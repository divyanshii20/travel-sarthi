import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../../middleware/validate';
import { searchRateLimiter } from '../../middleware/rateLimiter';
import { sendSuccess } from '../../shared/response';
import { searchFlights } from './flights.service';
import { getPricePrediction } from '../price-prediction/prediction.service';

const router = Router();

const flightSearchSchema = z.object({
  mode: z.enum(['A', 'B']).default('A'),
  origin: z.string().length(3).toUpperCase().optional(),
  destination: z.string().length(3).toUpperCase().optional(),
  originCity: z.string().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  currency: z.string().length(3).default('INR'),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tripType: z.enum(['one_way', 'round_trip', 'multi_city']).default('one_way'),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  children: z.coerce.number().int().min(0).max(9).default(0),
  infants: z.coerce.number().int().min(0).max(4).default(0),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  directOnly: z.coerce.boolean().default(false),
  preferredAirlines: z.string().optional(),
  maxLayoverMinutes: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const predictionQuerySchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase(),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  adults: z.coerce.number().int().min(1).default(1),
});

// GET /api/flights/search
router.get('/search', searchRateLimiter, optionalAuth, validateQuery(flightSearchSchema), async (req, res, next) => {
  try {
    const q = req.query as z.infer<typeof flightSearchSchema>;
    const result = await searchFlights({
      mode: q.mode,
      origin: q.origin,
      destination: q.destination,
      originCity: q.originCity,
      maxBudget: q.maxBudget,
      currency: q.currency as any,
      departDate: q.departDate,
      returnDate: q.returnDate,
      tripType: q.tripType,
      travelers: { adults: q.adults, children: q.children, infants: q.infants },
      cabinClass: q.cabinClass,
      directOnly: q.directOnly,
      maxLayoverMinutes: q.maxLayoverMinutes,
    });

    const page = q.page;
    const limit = q.limit;
    const total = result.totalResults;
    const paginated = result.results.slice((page - 1) * limit, page * limit);

    sendSuccess(
      res,
      { ...result, results: paginated },
      200,
      { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/flights/predict
router.get('/predict', optionalAuth, validateQuery(predictionQuerySchema), async (req, res, next) => {
  try {
    const q = req.query as z.infer<typeof predictionQuerySchema>;
    const prediction = await getPricePrediction({
      origin: q.origin,
      destination: q.destination,
      departDate: q.departDate,
      returnDate: q.returnDate,
      cabinClass: q.cabinClass,
      travelers: { adults: q.adults, children: 0, infants: 0 },
    });
    sendSuccess(res, prediction);
  } catch (err) {
    next(err);
  }
});

export { router as flightsRouter };
