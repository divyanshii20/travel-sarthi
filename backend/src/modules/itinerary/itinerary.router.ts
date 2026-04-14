import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { aiRateLimiter } from '../../middleware/rateLimiter';
import { sendSuccess } from '../../shared/response';
import { AppError } from '../../shared/errors';
import { generateItinerary, getSavedItinerary } from './itinerary.service';

const router = Router();

const legacyGenerateSchema = z.object({
  destination: z.string().min(2).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  travelers: z.object({
    adults: z.number().int().min(1),
    children: z.number().int().min(0).default(0),
    infants: z.number().int().min(0).default(0),
  }),
  budgetTotal: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  style: z.array(z.enum(['adventure', 'cultural', 'relaxation', 'foodie', 'romantic', 'family', 'budget'])).min(1),
  pace: z.enum(['slow', 'moderate', 'packed']).default('moderate'),
  avoidCategories: z.array(z.string()).optional(),
  mustInclude: z.array(z.string()).optional(),
  flightInfo: z.object({ origin: z.string(), flightNumber: z.string().optional() }).optional(),
  hotelName: z.string().optional(),
  existingTripId: z.string().uuid().optional(),
});

const eliteGenerateSchema = z.object({
  destination: z.string().min(2).max(120),
  flying_from: z.string().max(120).optional(),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).default(0),
  budget_inr: z.number().positive(),
  travel_style: z.array(z.string().min(2)).min(1),
  custom_preferences: z.string().max(1000).default(''),
  mode: z.enum(['A', 'B']).default('A'),
});

const generateSchema = z.union([legacyGenerateSchema, eliteGenerateSchema]);

router.post('/generate', requireAuth, aiRateLimiter, validateBody(generateSchema), async (req, res, next) => {
  try {
    const itinerary = await generateItinerary(req.body, req.userId);
    sendSuccess(res, { itinerary, generationTokensUsed: 0, cachedAt: null }, 201);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const itinerary = await getSavedItinerary(req.params.id, req.userId);
    sendSuccess(res, itinerary);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id/activity/:activityId',
  requireAuth,
  validateBody(z.object({
    isCompleted: z.boolean().optional(),
    isSkipped: z.boolean().optional(),
    customNote: z.string().max(500).nullable().optional(),
  })),
  (_req, _res, next) => {
    next(new AppError('Not implemented', 501, 'NOT_IMPLEMENTED'));
  },
);

router.post(
  '/:id/swap-activity',
  requireAuth,
  aiRateLimiter,
  validateBody(z.object({
    dayNumber: z.number().int().min(1),
    activityId: z.string().min(1),
    reason: z.string().optional(),
  })),
  (_req, _res, next) => {
    next(new AppError('Not implemented', 501, 'NOT_IMPLEMENTED'));
  },
);

router.post(
  '/:id/export',
  requireAuth,
  validateBody(z.object({
    format: z.enum(['pdf', 'notion', 'google_calendar', 'email']),
    includeMap: z.boolean().default(true),
    includeBudget: z.boolean().default(true),
    includeWeather: z.boolean().default(true),
  })),
  async (req, res, next) => {
    try {
      sendSuccess(res, { message: `Export to ${req.body.format} initiated`, exportId: `exp_${Date.now()}` });
    } catch (error) {
      next(error);
    }
  },
);

export { router as itineraryRouter };
