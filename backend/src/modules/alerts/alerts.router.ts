import { Router } from 'express';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { sendSuccess, buildPaginationMeta } from '../../shared/response';
import { db } from '../../config/database';
import { priceAlerts } from '../../db/schema/alerts';
import { NotFoundError, ForbiddenError } from '../../shared/errors';

const router = Router();

const createAlertSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetPrice: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  travelers: z.object({ adults: z.number().int().min(1), children: z.number().int().min(0).default(0), infants: z.number().int().min(0).default(0) }),
  frequency: z.enum(['instant', 'daily', 'weekly']).default('daily'),
  channels: z.array(z.enum(['email', 'push', 'whatsapp'])).min(1),
});

const idParamSchema = z.object({ id: z.string().uuid() });

// GET /api/alerts
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query['page'] as string ?? '1'));
    const limit = 20;
    const offset = (page - 1) * limit;

    const alerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.userId, req.userId))
      .orderBy(desc(priceAlerts.createdAt))
      .limit(limit)
      .offset(offset);

    sendSuccess(res, alerts.map(formatAlert), 200, buildPaginationMeta(alerts.length, page, limit));
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts
router.post('/', requireAuth, validateBody(createAlertSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createAlertSchema>;

    const [alert] = await db
      .insert(priceAlerts)
      .values({
        userId: req.userId,
        origin: body.origin,
        destination: body.destination,
        departDateFrom: body.departDateFrom,
        departDateTo: body.departDateTo,
        targetPriceAmount: body.targetPrice,
        targetPriceCurrency: body.currency,
        cabinClass: body.cabinClass,
        travelersJson: body.travelers,
        frequency: body.frequency,
        channelsJson: body.channels,
      })
      .returning();

    sendSuccess(res, formatAlert(alert!), 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [existing] = await db
      .select({ userId: priceAlerts.userId })
      .from(priceAlerts)
      .where(eq(priceAlerts.id, req.params['id'] ?? ''))
      .limit(1);

    if (!existing) throw new NotFoundError('Alert');
    if (existing.userId !== req.userId) throw new ForbiddenError('Access denied');

    await db.delete(priceAlerts).where(eq(priceAlerts.id, req.params['id'] ?? ''));
    sendSuccess(res, { message: 'Alert deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/:id/toggle
router.patch('/:id/toggle', requireAuth, validateParams(idParamSchema), async (req, res, next) => {
  try {
    const [existing] = await db
      .select({ userId: priceAlerts.userId, isActive: priceAlerts.isActive })
      .from(priceAlerts)
      .where(eq(priceAlerts.id, req.params['id'] ?? ''))
      .limit(1);

    if (!existing) throw new NotFoundError('Alert');
    if (existing.userId !== req.userId) throw new ForbiddenError('Access denied');

    const [updated] = await db
      .update(priceAlerts)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(priceAlerts.id, req.params['id'] ?? ''))
      .returning();

    sendSuccess(res, formatAlert(updated!));
  } catch (err) {
    next(err);
  }
});

function formatAlert(a: typeof priceAlerts.$inferSelect) {
  return {
    id: a.id,
    userId: a.userId,
    origin: a.origin,
    destination: a.destination,
    departDateFrom: a.departDateFrom,
    departDateTo: a.departDateTo,
    targetPrice: { amount: a.targetPriceAmount, currency: a.targetPriceCurrency, formatted: `₹${a.targetPriceAmount.toLocaleString('en-IN')}` },
    cabinClass: a.cabinClass,
    travelers: a.travelersJson,
    frequency: a.frequency,
    channels: a.channelsJson,
    isActive: a.isActive,
    lastCheckedAt: a.lastCheckedAt?.toISOString() ?? null,
    lastAlertSentAt: a.lastAlertSentAt?.toISOString() ?? null,
    triggerCount: a.triggerCount,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export { router as alertsRouter };
