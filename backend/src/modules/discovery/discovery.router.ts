import axios from 'axios';
import { Router } from 'express';
import { z } from 'zod';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { env } from '../../config/env';
import { db } from '../../config/database';
import { optionalAuth } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  destinationCollections,
  destinationImageAssets,
  destinationPois,
  destinations,
} from '../../db/schema/hotels';
import { logger } from '../../shared/logger';
import { buildPaginationMeta, sendSuccess } from '../../shared/response';
import { buildCacheKey, withCache } from '../../shared/cache';
import { fetchImagesForDestination, saveImagesToDb } from '../../shared/imageSeeder';

const router = Router();

// ─── Tier 2: lazy background image fetch ──────────────────────────────────────
// Tracks destination IDs currently being fetched so we don't duplicate work.
const imagesFetchInProgress = new Set<string>();

function lazyFetchImages(rows: { id: string; name: string; country: string; continent: string | null }[]) {
  if (rows.length === 0) return;
  setImmediate(async () => {
    for (const dest of rows) {
      if (imagesFetchInProgress.has(dest.id)) continue;
      imagesFetchInProgress.add(dest.id);
      try {
        const images = await fetchImagesForDestination(dest, 10);
        if (images.length > 0) await saveImagesToDb(dest.id, images);
      } catch {
        // non-blocking — ignore errors
      } finally {
        imagesFetchInProgress.delete(dest.id);
      }
      // Small delay between destinations so we don't burst-fire the API
      await new Promise((r) => setTimeout(r, 500));
    }
  });
}

const discoverQuerySchema = z.object({
  continent: z.string().max(40).optional(),
  tags: z.string().max(300).optional(),
  budgetMin: z.coerce.number().int().positive().optional(),
  budgetMax: z.coerce.number().int().positive().optional(),
  safetyMin: z.coerce.number().int().min(0).max(100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  visaStatus: z.string().max(30).optional(),
  isDomestic: z.preprocess((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean().optional()),
  search: z.string().max(120).optional(),
  hiddenGem: z.preprocess((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean().optional()),
  trending: z.preprocess((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean().optional()),
  flightDuration: z.string().max(10).optional(),
  sortBy: z.enum(['score', 'price', 'safety', 'trending', 'hidden_gem', 'popularity', 'az']).default('score'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

const aiSearchSchema = z.object({
  query: z.string().min(3).max(200),
});

type DiscoverQuery = z.infer<typeof discoverQuerySchema>;

router.get('/destinations', optionalAuth, validateQuery(discoverQuerySchema), async (req, res, next) => {
  try {
    const query = req.query as DiscoverQuery;
    const result = await searchDestinations(query);

    // Fetch trending/featured/hiddenGems from ALL destinations (not just current page)
    // to ensure diversity across continents
    const [trendingRows, featuredRows, gemRows] = await Promise.all([
      db.select().from(destinations).where(eq(destinations.isTrending, 1)).orderBy(desc(destinations.trendingScore)).limit(12),
      db.select().from(destinations).where(eq(destinations.isPopular, 1)).orderBy(asc(destinations.rank)).limit(8),
      db.select().from(destinations).where(eq(destinations.isHiddenGem, 1)).orderBy(desc(destinations.valueScore)).limit(8),
    ]);

    const imageAssetIds = [...trendingRows, ...featuredRows, ...gemRows].map((r) => r.id);
    const assetMap = imageAssetIds.length > 0 ? await loadImageAssetMap(imageAssetIds) : new Map();

    sendSuccess(
      res,
      {
        destinations: result.destinations,
        totalResults: result.total,
        featured: featuredRows.slice(0, 4).map((r) => formatDestination(r, assetMap.get(r.id) ?? [])),
        trending: trendingRows.slice(0, 6).map((r) => formatDestination(r, assetMap.get(r.id) ?? [])),
        hiddenGems: gemRows.slice(0, 4).map((r) => formatDestination(r, assetMap.get(r.id) ?? [])),
      },
      200,
      buildPaginationMeta(result.total, query.page, query.limit),
    );
  } catch (error) {
    next(error);
  }
});

router.post('/ai-search', validateBody(aiSearchSchema), async (req, res, next) => {
  try {
    const extracted = await extractDiscoveryFilters(req.body.query);
    const result = await searchDestinations({
      page: 1,
      limit: 24,
      sortBy: 'score',
      ...extracted,
    });

    sendSuccess(
      res,
      {
        destinations: result.destinations,
        query: req.body.query,
        filters: extracted,
      },
      200,
      buildPaginationMeta(result.total, 1, 24),
    );
  } catch (error) {
    next(error);
  }
});

router.get('/destinations/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug ?? '';
    const cacheKey = buildCacheKey('destination', slug);
    const destination = await withCache(cacheKey, 300, async () => {
      const [row] = await db.select().from(destinations).where(eq(destinations.slug, slug)).limit(1);
      if (row == null) return null;

      const imageAssets = await db
        .select()
        .from(destinationImageAssets)
        .where(eq(destinationImageAssets.destinationId, row.id))
        .orderBy(asc(destinationImageAssets.assetType), asc(destinationImageAssets.sortOrder));

      return { row, imageAssets };
    });

    if (destination == null) {
      res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Destination not found' } });
      return;
    }

    sendSuccess(res, formatDestination(destination.row, destination.imageAssets));
  } catch (error) {
    next(error);
  }
});

router.get('/destinations/:slug/pois', async (req, res, next) => {
  try {
    const slug = req.params.slug ?? '';
    const [destination] = await db
      .select({ id: destinations.id })
      .from(destinations)
      .where(eq(destinations.slug, slug))
      .limit(1);

    if (destination == null) {
      res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Destination not found' } });
      return;
    }

    const pois = await db
      .select()
      .from(destinationPois)
      .where(eq(destinationPois.destinationId, destination.id))
      .orderBy(asc(destinationPois.priority), asc(destinationPois.name));

    sendSuccess(res, {
      destinationSlug: slug,
      pois: pois.map((poi) => ({
        ...poi,
        latitude: poi.latitude != null ? Number(poi.latitude) : null,
        longitude: poi.longitude != null ? Number(poi.longitude) : null,
        avgVisitHours: poi.avgVisitHours != null ? Number(poi.avgVisitHours) : null,
        rating: poi.rating != null ? Number(poi.rating) : null,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/collections', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(destinationCollections)
      .where(eq(destinationCollections.isActive, true))
      .orderBy(asc(destinationCollections.sortOrder), asc(destinationCollections.title));

    sendSuccess(res, { collections: rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/compare',
  validateBody(
    z.object({
      destinationIds: z.array(z.string().uuid()).min(2).max(4).optional(),
      slugs: z.array(z.string().max(120)).min(2).max(4).optional(),
    }).refine((value) => value.destinationIds != null || value.slugs != null, {
      message: 'Provide either destinationIds or slugs',
    }),
  ),
  async (req, res, next) => {
    try {
      const rows = req.body.destinationIds != null
        ? await db.select().from(destinations).where(inArray(destinations.id, req.body.destinationIds))
        : await db.select().from(destinations).where(inArray(destinations.slug, req.body.slugs));

      const formatted = rows.map(formatDestination);
      const scores = rows.map((row) => scoreFromRow(row));

      const winner = rows
        .map((row, index) => ({ id: row.id, score: scores[index] ?? 0 }))
        .sort((left, right) => right.score - left.score)[0]?.id ?? rows[0]?.id ?? '';

      sendSuccess(res, {
      destinations: formatted,
        comparison: {
          winner,
          metrics: [
            buildMetric(rows, 'Safety Score', (row) => row.safetyScore, true),
            buildMetric(rows, 'Weather Score', (row) => row.weatherScore, true),
            buildMetric(rows, 'Value Score', (row) => row.valueScore, true),
            buildMetric(rows, 'Budget/Day (INR)', (row) => row.budgetMidPerDay ?? row.budgetPerDay ?? 0, false),
            buildMetric(rows, 'Trending Score', (row) => row.trendingScore, true),
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

async function searchDestinations(query: DiscoverQuery) {
  const parsedTags = (query.tags ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const cachePayload = {
    budgetMax: query.budgetMax ?? null,
    budgetMin: query.budgetMin ?? null,
    continent: query.continent ?? null,
    hiddenGem: query.hiddenGem ?? null,
    isDomestic: query.isDomestic ?? null,
    limit: query.limit,
    month: query.month ?? null,
    page: query.page,
    safetyMin: query.safetyMin ?? null,
    search: query.search ?? null,
    sortBy: query.sortBy,
    tags: [...parsedTags].sort(),
    trending: query.trending ?? null,
    visaStatus: query.visaStatus ?? null,
    flightDuration: query.flightDuration ?? null,
  };

  const cacheKey = `dest:${JSON.stringify(cachePayload)}`;
  return withCache(cacheKey, 300, async () => {
    const conditions = [];

    if (query.continent != null && query.continent.length > 0) {
      const c = query.continent.toLowerCase();
      if (c === 'india') {
        conditions.push(eq(destinations.isDomestic, true));
      } else if (c === 'americas' || c === 'north_america') {
        conditions.push(or(eq(destinations.continent, 'north_america'), eq(destinations.continent, 'south_america'))!);
      } else if (c === 'asia') {
        conditions.push(and(eq(destinations.continent, 'asia'), eq(destinations.isDomestic, false))!);
      } else {
        conditions.push(eq(destinations.continent, c));
      }
    }

    if (query.isDomestic != null) conditions.push(eq(destinations.isDomestic, query.isDomestic));
    if (query.visaStatus != null && query.visaStatus.length > 0) conditions.push(eq(destinations.visaStatus, query.visaStatus));
    if (query.budgetMin != null) conditions.push(gte(destinations.budgetMidPerDay, query.budgetMin));
    if (query.budgetMax != null) conditions.push(lte(destinations.budgetMidPerDay, query.budgetMax));
    if (query.safetyMin != null) conditions.push(gte(destinations.safetyScore, query.safetyMin));
    if (query.hiddenGem === true) conditions.push(eq(destinations.isHiddenGem, 1));
    if (query.trending === true) conditions.push(eq(destinations.isTrending, 1));
    if (query.month != null) conditions.push(sql`${destinations.bestMonths} @> ARRAY[${query.month}]::integer[]`);
    if (parsedTags.length > 0) conditions.push(sql`${destinations.tags} && ${parsedTags}::text[]`);

    if (query.search != null && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      conditions.push(
        or(
          ilike(destinations.name, `%${searchTerm}%`),
          ilike(destinations.country, `%${searchTerm}%`),
          ilike(destinations.tagline, `%${searchTerm}%`),
        )!,
      );
    }

    if (query.flightDuration != null && query.flightDuration.length > 0) {
      if (query.flightDuration === '<4') {
        conditions.push(lte(destinations.flightHoursMax, 4));
      } else if (query.flightDuration === '4-8') {
        conditions.push(and(gte(destinations.flightHoursMin, 4), lte(destinations.flightHoursMax, 8))!);
      } else if (query.flightDuration === '8+') {
        conditions.push(gte(destinations.flightHoursMin, 8));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.limit;

    const orderBy = query.sortBy === 'price'
      ? asc(destinations.budgetMidPerDay)
      : query.sortBy === 'safety'
        ? desc(destinations.safetyScore)
        : query.sortBy === 'trending'
          ? desc(destinations.trendingScore)
          : query.sortBy === 'hidden_gem'
            ? desc(destinations.isHiddenGem)
            : query.sortBy === 'az'
              ? asc(destinations.name)
              : query.sortBy === 'popularity'
                ? asc(destinations.rank)
                : asc(destinations.rank); // 'score' and default

    const [countRows, rows] = await Promise.all([
      db.select({ total: count() }).from(destinations).where(whereClause),
      db.select().from(destinations).where(whereClause).orderBy(orderBy).limit(query.limit).offset(offset),
    ]);

    const imageAssetMap = await loadImageAssetMap(rows.map((row) => row.id));

    // Tier 2: fire-and-forget fetch for any destination that has no image assets yet
    const missingImages = rows.filter((row) => !imageAssetMap.has(row.id));
    if (missingImages.length > 0) {
      lazyFetchImages(missingImages.map((row) => ({ id: row.id, name: row.name, country: row.country, continent: row.continent })));
    }

    return {
      total: countRows[0]?.total ?? 0,
      destinations: rows.map((row) => formatDestination(row, imageAssetMap.get(row.id) ?? [])),
    };
  });
}

async function extractDiscoveryFilters(query: string): Promise<Partial<DiscoverQuery>> {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are the world's most intelligent travel search engine for Indian travelers. Your job is to interpret natural language travel queries and extract precise, structured filter parameters.

=== YOUR INTELLIGENCE ===
• You understand context: "cheap" means budget ≤ ₹3000/day, "luxury" means ≥ ₹15000/day, "mid-range" is ₹3000-8000/day
• You understand geography: "Southeast Asia" → asia, "Americas" → north_america + south_america, "Europe" → europe
• You understand seasons: "winter trip" → months 11,12,1,2; "summer" → 5,6,7; "monsoon" → 7,8,9
• You understand travel intent: "honeymoon" → tags Romance; "family trip" → tags Family; "trekking" → tags Mountain,Adventure
• You understand visa context for Indian passport: Thailand=visa_free, Japan=visa_required, UAE=visa_on_arrival, UK=visa_required
• You handle compound queries: "beach in December visa-free under 3k/day" → tags Beach, month 12, visaStatus visa_free, budgetMax 3000
• You handle vague queries intelligently: "somewhere peaceful" → tags Wellness, hiddenGem true; "party destination" → tags Nightlife

=== FILTER PARAMETERS ===
Extract ONLY relevant filters. Leave unmentioned filters out (do NOT set them to null).

{
  "continent": "asia | europe | north_america | south_america | africa | oceania | middle_east | india | americas",
  "tags": ["Beach","Mountain","Heritage","Romance","Adventure","Family","Wellness","Foodie","Luxury","Nightlife"],
  "visaStatus": "visa_free | visa_on_arrival | e_visa | visa_required",
  "budgetMax": number (INR per person per day),
  "budgetMin": number (INR per person per day),
  "safetyMin": number (0-100, set 80+ for "safe" queries, 90+ for "very safe"),
  "month": number (1-12),
  "hiddenGem": boolean (true for "offbeat", "unexplored", "hidden", "underrated"),
  "trending": boolean (true for "trending", "popular now", "hot"),
  "search": "text search term for destination name/country if specific place mentioned"
}

=== RULES ===
1. Budget values are ALWAYS in INR per person per day. Convert if user says total budget (divide by days and people).
2. If user mentions a specific destination by name, put it in "search" field, not tags.
3. "Americas" encompasses both north_america and south_america — use "americas" for the continent value.
4. For Indian domestic destinations, use continent "india".
5. Only set filters that are clearly implied. When in doubt, leave it out — returning fewer filters is better than wrong ones.
6. Tags must EXACTLY match: Beach, Mountain, Heritage, Romance, Adventure, Family, Wellness, Foodie, Luxury, Nightlife (title case).

Return ONLY valid JSON. No explanations.

User query: "${query}"`,
          }],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      },
      { timeout: 20000 },
    );

    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return { search: query };
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      continent: typeof parsed.continent === 'string' ? parsed.continent : undefined,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((item): item is string => typeof item === 'string').join(',') : undefined,
      visaStatus: typeof parsed.visaStatus === 'string' ? parsed.visaStatus : undefined,
      budgetMax: typeof parsed.budgetMax === 'number' ? parsed.budgetMax : undefined,
      budgetMin: typeof parsed.budgetMin === 'number' ? parsed.budgetMin : undefined,
      safetyMin: typeof parsed.safetyMin === 'number' ? parsed.safetyMin : undefined,
      month: typeof parsed.month === 'number' ? parsed.month : undefined,
      hiddenGem: typeof parsed.hiddenGem === 'boolean' ? parsed.hiddenGem : undefined,
      trending: typeof parsed.trending === 'boolean' ? parsed.trending : undefined,
      search: typeof parsed.search === 'string' ? parsed.search : query,
    };
  } catch (error) {
    logger.warn({ error, query }, 'AI discovery filter extraction failed');
    return { search: query };
  }
}

function scoreFromRow(row: typeof destinations.$inferSelect) {
  return Math.round(
    (
      row.safetyScore +
      row.weatherScore +
      row.infrastructureScore +
      row.valueScore +
      row.trendingScore
    ) / 5,
  );
}

function buildMetric(
  rows: (typeof destinations.$inferSelect)[],
  metric: string,
  valueGetter: (row: typeof destinations.$inferSelect) => number,
  higherIsBetter: boolean,
) {
  const values = rows.map(valueGetter);
  const target = higherIsBetter ? Math.max(...values) : Math.min(...values);
  return {
    metric,
    values: rows.map((row) => {
      const value = valueGetter(row);
      return {
        destinationId: row.id,
        value,
        isBest: value === target,
      };
    }),
  };
}

function formatDestination(
  row: typeof destinations.$inferSelect,
  imageAssets: (typeof destinationImageAssets.$inferSelect)[] = [],
) {
  const flatSafety = row.safetyScore ?? 75;
  const flatWeather = row.weatherScore ?? 70;
  const flatInfrastructure = row.infrastructureScore ?? 70;
  const flatValue = row.valueScore ?? 70;

  const heroAsset = imageAssets.find((asset) => asset.assetType === 'hero') ?? null;
  const galleryAssetRows = imageAssets.filter((asset) => asset.assetType !== 'hero');

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    countryCode: row.countryCode,
    continent: row.continent,
    coordinates: {
      lat: Number.isFinite(parseFloat(row.lat)) ? parseFloat(row.lat) : 0,
      lng: Number.isFinite(parseFloat(row.lng)) ? parseFloat(row.lng) : 0,
    },
    airportCodes: row.airportCodes,
    heroImage: heroAsset != null
      ? {
        url: heroAsset.publicUrl,
        alt: heroAsset.altText,
        width: heroAsset.width ?? 1600,
        height: heroAsset.height ?? 1000,
        blurHash: heroAsset.blurDataUrl ?? undefined,
      }
      : { url: row.heroImageUrl, alt: row.name, width: 1600, height: 1000 },
    images: galleryAssetRows.map((asset) => ({
      url: asset.publicUrl,
      alt: asset.altText,
      width: asset.width ?? 1400,
      height: asset.height ?? 900,
      blurHash: asset.blurDataUrl ?? undefined,
    })),
    tagline: row.tagline,
    description: row.description,
    moods: row.moodsJson,
    score: {
      overall: scoreFromRow(row),
      affordability: Math.max(25, 100 - Math.round((row.budgetMidPerDay ?? row.budgetPerDay ?? 4000) / 200)),
      safety: Math.round(flatSafety / 10),
      weatherScore: Math.round(flatWeather / 10),
      touristInfrastructure: flatInfrastructure,
      uniqueness: Math.max(55, Math.min(95, 50 + (row.isHiddenGem === 1 ? 25 : 10))),
      visaEase: row.visaStatus === 'visa_free' ? 95 : row.visaStatus === 'visa_on_arrival' ? 85 : row.visaStatus === 'e_visa' ? 75 : 45,
      travelTime: Math.max(30, 100 - Math.round((row.flightHoursMin ?? 6) * 6)),
      communityRating: Math.max(60, Math.min(95, Math.round((row.trendingScore + flatSafety) / 2))),
      badge: row.isHiddenGem === 1 ? 'hidden_gem' : row.isTrending === 1 ? 'trending' : row.valueScore >= 85 ? 'best_value' : null,
    },
    budget: row.budgetJson,
    visa: row.visaJson,
    highlights: row.highlightsJson,
    bestTimeToVisit: row.bestTimeJson,
    currentWeather: null,
    popularActivities: row.popularActivities,
    cuisineHighlights: row.cuisineHighlights,
    localTips: row.localTips,
    safetyRating: row.safetyRating,
    languageBarrier: row.languageBarrier,
    currency: row.currency,
    timezoneName: row.timezoneName,
    utcOffset: row.utcOffset,
    isPopular: row.isPopular === 1,
    isTrending: row.isTrending === 1,
    isHiddenGem: row.isHiddenGem === 1,
    rank: row.rank,
    tags: row.tags,
    visaStatus: row.visaStatus,
    budgetPerDay: row.budgetPerDay,
    budgetMidPerDay: row.budgetMidPerDay,
    budgetLuxuryPerDay: row.budgetLuxuryPerDay,
    flightHoursMin: row.flightHoursMin,
    flightHoursMax: row.flightHoursMax,
    directFlightCities: row.directFlightCities,
    nearestAirportCode: row.nearestAirportCode,
    isDomestic: row.isDomestic,
    stateProvince: row.stateProvince,
    trendingScore: row.trendingScore,
    trendingChangePct: row.trendingChangePct,
    flagEmoji: row.flagEmoji,
    galleryImages: galleryAssetRows.length > 0 ? galleryAssetRows.map((asset) => asset.publicUrl) : row.galleryImages,
    nearbyDestinations: row.nearbyDestinations,
    crowdLevel: row.crowdLevel,
    idealDurationMin: row.idealDurationMin,
    idealDurationMax: row.idealDurationMax,
    safetyScore: flatSafety,
    weatherScore: flatWeather,
    infrastructureScore: flatInfrastructure,
    valueScore: flatValue,
    bestMonths: row.bestMonths,
    avoidMonths: row.avoidMonths,
    peakMonths: row.peakMonths,
    weatherSummary: row.weatherSummary,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

async function loadImageAssetMap(destinationIds: string[]) {
  if (destinationIds.length === 0) return new Map<string, (typeof destinationImageAssets.$inferSelect)[]>();

  try {
    const rows = await db
      .select()
      .from(destinationImageAssets)
      .where(inArray(destinationImageAssets.destinationId, destinationIds))
      .orderBy(asc(destinationImageAssets.destinationId), asc(destinationImageAssets.assetType), asc(destinationImageAssets.sortOrder));

    const map = new Map<string, (typeof destinationImageAssets.$inferSelect)[]>();
    for (const row of rows) {
      const current = map.get(row.destinationId) ?? [];
      current.push(row);
      map.set(row.destinationId, current);
    }
    return map;
  } catch {
    // Table not yet created — fall back to heroImageUrl/galleryImages columns on the destinations row
    return new Map<string, (typeof destinationImageAssets.$inferSelect)[]>();
  }
}

export { router as discoveryRouter };
