import { Router } from 'express';
import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'crypto';
import { eq } from 'drizzle-orm';
import { validateBody } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { sendSuccess } from '../../shared/response';
import { db } from '../../config/database';
import { disruptionEvents } from '../../db/schema/disruptions';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import axios from 'axios';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// ─── DGCA Rights Engine ───────────────────────────────────────────────────────

function computeDGCARights(delayMinutes: number, disruptionType: string, isDomestic: boolean) {
  // DGCA Civil Aviation Requirements — domestic flights
  const rights = {
    compensationAmount: null as { amount: number; currency: string; formatted: string } | null,
    mealEntitlement: false,
    hotelEntitlement: false,
    refundEntitlement: false,
    reroutingEntitlement: false,
    explanation: '',
    claimInstructions: [] as string[],
    isApplicable: isDomestic,
    condition: '',
    delayThresholdHours: 0,
  };

  if (!isDomestic) {
    rights.explanation = 'For international flights, your rights depend on the airline\'s policy and destination country regulations.';
    rights.claimInstructions = ['Contact the airline customer service', 'Check EU261 regulation if departing from EU', 'Keep all receipts for expenses'];
    return rights;
  }

  if (disruptionType === 'cancellation') {
    rights.refundEntitlement = true;
    rights.reroutingEntitlement = true;
    rights.compensationAmount = { amount: 5000, currency: 'INR', formatted: '₹5,000' };
    rights.explanation = 'Under DGCA regulations, you are entitled to a full refund or rerouting, plus compensation of ₹5,000 if notified less than 24 hours before departure.';
    rights.claimInstructions = [
      'Request full refund or alternative flight at check-in',
      'Demand compensation if notification was less than 24 hours',
      'File complaint at DGCA website if airline refuses',
      'Keep your ticket and boarding pass as proof',
    ];
    rights.condition = 'Cancellation with less than 24 hours notice';
    rights.delayThresholdHours = 0;
  } else if (delayMinutes >= 120) { // 2+ hours
    rights.mealEntitlement = true;
    rights.explanation = 'Airline must provide meals/refreshments for delays of 2+ hours.';
    rights.claimInstructions = ['Request meal voucher from airline staff', 'If refused, buy meals and claim reimbursement'];
    rights.condition = '2+ hour delay';
    rights.delayThresholdHours = 2;
  }

  if (delayMinutes >= 360) { // 6+ hours
    rights.hotelEntitlement = true;
    rights.refundEntitlement = true;
    rights.compensationAmount = { amount: 10000, currency: 'INR', formatted: '₹10,000' };
    rights.explanation = 'For delays of 6+ hours, you are entitled to hotel accommodation, meals, and compensation of ₹10,000.';
    rights.claimInstructions = [
      'Request hotel accommodation from airline',
      'Request all meals during the wait',
      'Request compensation of ₹10,000',
      'You may also request a full refund',
      'File DGCA complaint if entitlements are denied',
    ];
    rights.condition = '6+ hour delay';
    rights.delayThresholdHours = 6;
  }

  return rights;
}

// ─── Severity Classifier ──────────────────────────────────────────────────────

function classifySeverity(delayMinutes: number | null, disruptionType: string): string {
  if (disruptionType === 'cancellation') return 'critical';
  if (disruptionType === 'diversion') return 'high';
  if (!delayMinutes) return 'low';
  if (delayMinutes >= 360) return 'critical';
  if (delayMinutes >= 180) return 'high';
  if (delayMinutes >= 60) return 'medium';
  return 'low';
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/disruption/webhook (AeroDataBox)
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-aerodatabox-signature'] as string | undefined;
    if (!signature) {
      res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Missing signature' } });
      return;
    }

    const payload = JSON.stringify(req.body);
    const expected = createHmac('sha256', env.AERODATABOX_WEBHOOK_SECRET).update(payload).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
      res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } });
      return;
    }

    const data = req.body as {
      flightNumber: string;
      date: string;
      status: string;
      delay: number | null;
      departure: { scheduledTime: string; actualTime: string | null };
      arrival: { scheduledTime: string; estimatedTime: string | null };
    };

    const disruptionType = data.status === 'Cancelled' ? 'cancellation' : 'delay';
    const delayMinutes = data.delay ?? null;
    const severity = classifySeverity(delayMinutes, disruptionType);
    const dgcaRights = computeDGCARights(delayMinutes ?? 0, disruptionType, true);

    await db.insert(disruptionEvents).values({
      flightNumber: data.flightNumber,
      airline: data.flightNumber.slice(0, 2),
      origin: 'DEL', // would be parsed from flight data
      destination: 'BOM',
      scheduledDeparture: new Date(data.departure.scheduledTime),
      actualDeparture: data.departure.actualTime ? new Date(data.departure.actualTime) : null,
      scheduledArrival: new Date(data.arrival.scheduledTime),
      estimatedArrival: data.arrival.estimatedTime ? new Date(data.arrival.estimatedTime) : null,
      disruptionType,
      severity,
      delayMinutes,
      reason: null,
      dgcaRightsJson: dgcaRights,
      recoveryOptionsJson: [],
      rawWebhookJson: req.body as Record<string, unknown>,
    });

    logger.info({ flightNumber: data.flightNumber, disruptionType, severity }, 'Disruption event processed');

    // Generate recovery options via Gemini
    generateRecoveryOptions(data.flightNumber, disruptionType, severity).catch((err) => {
      logger.error({ err }, 'Failed to generate recovery options');
    });

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/disruption/flight/:flightNumber
router.get('/flight/:flightNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [event] = await db
      .select()
      .from(disruptionEvents)
      .where(eq(disruptionEvents.flightNumber, req.params['flightNumber'] ?? ''))
      .limit(1);

    if (!event) {
      sendSuccess(res, { disruption: null });
      return;
    }

    sendSuccess(res, { disruption: formatDisruption(event) });
  } catch (err) {
    next(err);
  }
});

// GET /api/disruption/my-disruptions
router.get('/my-disruptions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await db
      .select()
      .from(disruptionEvents)
      .where(eq(disruptionEvents.userId, req.userId))
      .limit(20);

    sendSuccess(res, events.map(formatDisruption));
  } catch (err) {
    next(err);
  }
});

async function generateRecoveryOptions(flightNumber: string, type: string, severity: string): Promise<void> {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Generate 3 travel recovery options for flight ${flightNumber} which has been ${type} (severity: ${severity}). Return as JSON with options: fastest, cheapest, comfortable. Each option should include alternative transport modes, estimated time, and cost in INR.`,
          }],
        }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1024, responseMimeType: 'application/json' },
      },
      { timeout: 15000 },
    );

    logger.info({ flightNumber }, 'Recovery options generated');
  } catch (err) {
    logger.warn({ err, flightNumber }, 'Failed to generate recovery options via Gemini');
  }
}

function formatDisruption(event: typeof disruptionEvents.$inferSelect) {
  return {
    id: event.id,
    flightNumber: event.flightNumber,
    airline: event.airline,
    origin: event.origin,
    destination: event.destination,
    scheduledDeparture: event.scheduledDeparture.toISOString(),
    actualDeparture: event.actualDeparture?.toISOString() ?? null,
    scheduledArrival: event.scheduledArrival.toISOString(),
    estimatedArrival: event.estimatedArrival?.toISOString() ?? null,
    disruptionType: event.disruptionType,
    severity: event.severity,
    delayMinutes: event.delayMinutes,
    reason: event.reason,
    dgcaRights: event.dgcaRightsJson,
    recoveryOptions: event.recoveryOptionsJson,
    revisedItinerary: event.revisedItineraryJson,
    createdAt: event.createdAt.toISOString(),
  };
}

export { router as disruptionRouter };
