import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { validateQuery } from '../../middleware/validate';
import { optionalAuth } from '../../middleware/auth';
import { sendSuccess } from '../../shared/response';
import { withCache, buildCacheKey } from '../../shared/cache';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const placesQuerySchema = z.object({
  query: z.string().optional(),
  location: z.string().min(2),
  type: z.string().optional(),
  radius: z.coerce.number().int().min(100).max(50000).default(5000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  openNow: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

// GET /api/places/search
router.get('/search', optionalAuth, validateQuery(placesQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as z.infer<typeof placesQuerySchema>;

    const cacheKey = buildCacheKey('places', q.location, q.query ?? '', q.type ?? '', q.radius);

    const result = await withCache(cacheKey, 604800, async () => {
      const [googleResults, foursquareResults] = await Promise.allSettled([
        searchGooglePlaces(q),
        searchFoursquare(q),
      ]);

      const places = [
        ...(googleResults.status === 'fulfilled' ? googleResults.value : []),
        ...(foursquareResults.status === 'fulfilled' ? foursquareResults.value : []),
      ];

      return {
        places,
        totalResults: places.length,
        searchCenter: parseCoordinates(q.location),
        cachedAt: new Date().toISOString(),
      };
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

async function searchGooglePlaces(q: z.infer<typeof placesQuerySchema>): Promise<unknown[]> {
  try {
    const params: Record<string, string | number | boolean> = {
      location: q.location,
      radius: q.radius,
      key: env.GOOGLE_PLACES_API_KEY,
      language: 'en',
    };
    if (q.query) params['keyword'] = q.query;
    if (q.type) params['type'] = q.type;
    if (q.openNow) params['opennow'] = true;

    const res = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params,
      timeout: 10000,
    });

    const data = res.data as { results: unknown[]; status: string };
    if (data.status !== 'OK') return [];

    return (data.results as {
      place_id: string;
      name: string;
      vicinity: string;
      geometry: { location: { lat: number; lng: number } };
      rating?: number;
      user_ratings_total?: number;
      price_level?: number;
      types?: string[];
      photos?: { photo_reference: string }[];
      opening_hours?: { open_now?: boolean };
    }[]).map((p) => ({
      id: p.place_id,
      googlePlaceId: p.place_id,
      foursquareId: null,
      name: p.name,
      type: p.types?.[0] ?? 'attraction',
      address: p.vicinity,
      city: q.location,
      country: '',
      coordinates: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
      rating: p.rating ?? null,
      reviewCount: p.user_ratings_total ?? null,
      priceLevel: p.price_level ?? null,
      hours: null,
      phone: null,
      website: null,
      images: p.photos?.slice(0, 3).map((ph) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ph.photo_reference}&key=${env.GOOGLE_PLACES_API_KEY}`,
        alt: p.name,
      })) ?? [],
      description: null,
      tags: p.types ?? [],
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      isVerified: true,
      cachedAt: new Date().toISOString(),
    }));
  } catch (err) {
    logger.warn({ err }, 'Google Places search failed');
    return [];
  }
}

async function searchFoursquare(q: z.infer<typeof placesQuerySchema>): Promise<unknown[]> {
  try {
    const res = await axios.get('https://api.foursquare.com/v3/places/search', {
      headers: { Authorization: env.FOURSQUARE_API_KEY },
      params: {
        near: q.location,
        query: q.query,
        radius: q.radius,
        limit: Math.min(q.limit, 50),
        categories: q.type,
      },
      timeout: 10000,
    });

    const data = res.data as { results: unknown[] };
    return (data.results as {
      fsq_id: string;
      name: string;
      location: { formatted_address: string };
      geocodes: { main: { latitude: number; longitude: number } };
      rating?: number;
      photos?: { prefix: string; suffix: string }[];
      categories?: { name: string }[];
    }[]).map((p) => ({
      id: p.fsq_id,
      googlePlaceId: null,
      foursquareId: p.fsq_id,
      name: p.name,
      type: p.categories?.[0]?.name ?? 'attraction',
      address: p.location.formatted_address,
      coordinates: { lat: p.geocodes.main.latitude, lng: p.geocodes.main.longitude },
      rating: p.rating ?? null,
      reviewCount: null,
      images: p.photos?.slice(0, 2).map((ph) => ({ url: `${ph.prefix}800x600${ph.suffix}`, alt: p.name })) ?? [],
      tags: p.categories?.map((c) => c.name) ?? [],
      isVerified: true,
    }));
  } catch (err) {
    logger.warn({ err }, 'Foursquare search failed');
    return [];
  }
}

function parseCoordinates(location: string): { lat: number; lng: number } {
  const parts = location.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0] ?? '0');
    const lng = parseFloat(parts[1] ?? '0');
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  return { lat: 20.5937, lng: 78.9629 }; // India center fallback
}

export { router as placesRouter };
