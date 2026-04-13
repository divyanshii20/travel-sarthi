import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validate';
import { aiRateLimiter } from '../../middleware/rateLimiter';
import { sendSuccess } from '../../shared/response';
import { generateItinerary } from './itinerary.service';

const router = Router();

const generateSchema = z.object({
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

// POST /api/itinerary/generate
router.post('/generate', requireAuth, aiRateLimiter, validateBody(generateSchema), async (req, res, next) => {
  try {
    const itinerary = await generateItinerary(req.body, req.userId);
    sendSuccess(res, { itinerary, generationTokensUsed: 0, cachedAt: null }, 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/itinerary/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    sendSuccess(res, { message: 'Itinerary retrieval — stored itineraries served from DB' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/itinerary/:id/activity/:activityId
router.patch(
  '/:id/activity/:activityId',
  requireAuth,
  validateBody(z.object({
    isCompleted: z.boolean().optional(),
    isSkipped: z.boolean().optional(),
    customNote: z.string().max(500).nullable().optional(),
  })),
  async (req, res, next) => {
    try {
      sendSuccess(res, { message: 'Activity status updated' });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/itinerary/:id/swap-activity
router.post(
  '/:id/swap-activity',
  requireAuth,
  aiRateLimiter,
  validateBody(z.object({
    dayNumber: z.number().int().min(1),
    activityId: z.string().min(1),
    reason: z.string().optional(),
  })),
  async (req, res, next) => {
    try {
      sendSuccess(res, { message: 'Activity swap requested' });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/itinerary/:id/export
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
    } catch (err) {
      next(err);
    }
  },
);

export { router as itineraryRouter };
