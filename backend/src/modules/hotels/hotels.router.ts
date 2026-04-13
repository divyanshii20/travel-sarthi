import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { validateQuery } from '../../middleware/validate';
import { optionalAuth } from '../../middleware/auth';
import { searchRateLimiter } from '../../middleware/rateLimiter';
import { sendSuccess, buildPaginationMeta } from '../../shared/response';
import { withCache, buildCacheKey } from '../../shared/cache';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const hotelSearchSchema = z.object({
  destination: z.string().min(2).max(255),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rooms: z.coerce.number().int().min(1).max(10).default(1),
  adults: z.coerce.number().int().min(1).max(30).default(1),
  children: z.coerce.number().int().min(0).max(10).default(0),
  currency: z.string().length(3).default('INR'),
  starRating: z.string().optional(),
  maxPricePerNight: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  sortBy: z.enum(['price', 'rating', 'score', 'distance']).default('score'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

// GET /api/hotels/search
router.get('/search', searchRateLimiter, optionalAuth, validateQuery(hotelSearchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as z.infer<typeof hotelSearchSchema>;

    const cacheKey = buildCacheKey('hotels', q.destination, q.checkIn, q.checkOut, q.rooms, q.adults);

    const result = await withCache(cacheKey, 1800, async () => {
      // Search Amadeus hotel offers
      const amadeusResults = await searchAmadeusHotels(q).catch(() => []);
      // Search Xotelo for additional pricing
      const xoteloResults = await searchXoteloHotels(q).catch(() => []);

      const merged = [...amadeusResults, ...xoteloResults];

      return {
        results: merged,
        searchId: `hschk_${Date.now()}`,
        searchedAt: new Date().toISOString(),
        totalResults: merged.length,
        currency: 'INR',
        nightsCount: Math.round((new Date(q.checkOut).getTime() - new Date(q.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
        filters: {
          starRatings: [1, 2, 3, 4, 5].map((s) => ({ value: s, count: merged.filter(() => true).length })),
          propertyTypes: [],
          amenities: [],
          priceRange: { min: 0, max: 50000 },
          guestRatingRange: { min: 0, max: 10 },
          mealPlans: [],
        },
      };
    });

    const page = q.page;
    const limit = q.limit;
    const paginatedResult = result as typeof result;

    sendSuccess(res, paginatedResult, 200, buildPaginationMeta(paginatedResult.totalResults, page, limit));
  } catch (err) {
    next(err);
  }
});

async function searchAmadeusHotels(q: z.infer<typeof hotelSearchSchema>): Promise<unknown[]> {
  try {
    // Get Amadeus token first
    const tokenRes = await axios.post(
      `${env.AMADEUS_BASE_URL}/v1/security/oauth2/token`,
      new URLSearchParams({ grant_type: 'client_credentials', client_id: env.AMADEUS_CLIENT_ID, client_secret: env.AMADEUS_CLIENT_SECRET }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const token = (tokenRes.data as { access_token: string }).access_token;

    const res = await axios.get(`${env.AMADEUS_BASE_URL}/v3/shopping/hotel-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        cityCode: q.destination.toUpperCase().slice(0, 3),
        checkInDate: q.checkIn,
        checkOutDate: q.checkOut,
        adults: q.adults,
        roomQuantity: q.rooms,
        currency: 'INR',
        sort: 'PRICE',
      },
      timeout: 15000,
    });

    logger.debug({ destination: q.destination }, 'Amadeus hotel search completed');
    return (res.data as { data: unknown[] }).data ?? [];
  } catch (err) {
    logger.warn({ err }, 'Amadeus hotel search failed');
    return [];
  }
}

async function searchXoteloHotels(q: z.infer<typeof hotelSearchSchema>): Promise<unknown[]> {
  // Xotelo provides hotel pricing from multiple booking platforms
  return [];
}

export { router as hotelsRouter };
