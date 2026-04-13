import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc, asc, ilike, inArray } from 'drizzle-orm';
import { validateQuery, validateBody } from '../../middleware/validate';
import { optionalAuth } from '../../middleware/auth';
import { sendSuccess, buildPaginationMeta } from '../../shared/response';
import { db } from '../../config/database';
import { destinations } from '../../db/schema/hotels';
import { withCache, buildCacheKey } from '../../shared/cache';
import { logger } from '../../shared/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const discoverQuerySchema = z.object({
  budget: z.coerce.number().positive().optional(),
  currency: z.string().length(3).default('INR'),
  budgetDays: z.coerce.number().int().min(1).max(30).optional(),
  moods: z.string().optional(), // comma-separated
  continent: z.enum(['asia', 'europe', 'north_america', 'south_america', 'africa', 'oceania', 'middle_east']).optional(),
  departMonth: z.coerce.number().int().min(1).max(12).optional(),
  durationDays: z.coerce.number().int().min(1).max(30).optional(),
  fromAirport: z.string().length(3).optional(),
  sortBy: z.enum(['score', 'price', 'safety', 'trending', 'hidden_gem']).default('score'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// GET /api/discovery/destinations
router.get('/destinations', optionalAuth, validateQuery(discoverQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as z.infer<typeof discoverQuerySchema>;
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const cacheKey = buildCacheKey('discover', q.continent ?? 'all', q.moods ?? '', q.sortBy, page, limit);

    let rows: (typeof destinations.$inferSelect)[] = [];
    try {
      const cached = await withCache(cacheKey, 3600, async () => {
        const conditions = [];
        if (q.continent) conditions.push(eq(destinations.continent, q.continent));

        const dbRows = await db
          .select()
          .from(destinations)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(
            q.sortBy === 'trending' ? desc(destinations.isTrending)
              : q.sortBy === 'hidden_gem' ? desc(destinations.isHiddenGem)
              : asc(destinations.rank),
          )
          .limit(limit)
          .offset(offset);

        return dbRows;
      });
      rows = cached as (typeof destinations.$inferSelect)[];
    } catch (dbErr) {
      logger.warn({ dbErr }, 'Discovery DB query failed — returning empty result');
      rows = [];
    }

    const formatted = rows.map(formatDestination);

    sendSuccess(
      res,
      {
        destinations: formatted,
        totalResults: formatted.length,
        featured: formatted.filter((d) => d.isPopular).slice(0, 4),
        trending: formatted.filter((d) => d.isTrending).slice(0, 4),
        hiddenGems: formatted.filter((d) => d.isHiddenGem).slice(0, 4),
      },
      200,
      buildPaginationMeta(formatted.length, page, limit),
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/discovery/destinations/:slug
router.get('/destinations/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [dest] = await db
      .select()
      .from(destinations)
      .where(eq(destinations.slug, req.params['slug'] ?? ''))
      .limit(1);

    if (!dest) {
      res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Destination not found' } });
      return;
    }

    sendSuccess(res, formatDestination(dest));
  } catch (err) {
    next(err);
  }
});

// POST /api/discovery/compare
router.post(
  '/compare',
  validateBody(z.object({ destinationIds: z.array(z.string().uuid()).min(2).max(4) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dests = await db
        .select()
        .from(destinations)
        .where(inArray(destinations.id, req.body.destinationIds));

      sendSuccess(res, {
        destinations: dests.map(formatDestination),
        comparison: {
          winner: dests[0]?.id ?? '',
          metrics: [
            { metric: 'Safety', values: dests.map((d) => ({ destinationId: d.id, value: d.safetyRating, isBest: d.safetyRating === Math.max(...dests.map((x) => x.safetyRating)) })) },
            { metric: 'Rank', values: dests.map((d) => ({ destinationId: d.id, value: d.rank, isBest: d.rank === Math.min(...dests.map((x) => x.rank)) })) },
          ],
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

function formatDestination(d: typeof destinations.$inferSelect) {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    country: d.country,
    countryCode: d.countryCode,
    continent: d.continent,
    coordinates: { lat: parseFloat(d.lat), lng: parseFloat(d.lng) },
    airportCodes: d.airportCodes,
    heroImage: { url: d.heroImageUrl, alt: d.name },
    images: d.imagesJson,
    tagline: d.tagline,
    description: d.description,
    moods: d.moodsJson,
    score: d.scoreJson,
    budget: d.budgetJson,
    visa: d.visaJson,
    highlights: d.highlightsJson,
    bestTimeToVisit: d.bestTimeJson,
    popularActivities: d.popularActivities,
    cuisineHighlights: d.cuisineHighlights,
    localTips: d.localTips,
    safetyRating: d.safetyRating,
    languageBarrier: d.languageBarrier,
    currency: d.currency,
    timezoneName: d.timezoneName,
    utcOffset: d.utcOffset,
    isPopular: d.isPopular === 1,
    isTrending: d.isTrending === 1,
    isHiddenGem: d.isHiddenGem === 1,
    rank: d.rank,
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  };
}

export { router as discoveryRouter };
