/**
 * Shared image-seeding service.
 * Primary: Pexels (200 req/hour free)
 * Fallback: Unsplash (50 req/hour demo)
 *
 * Stores results in `destination_image_assets` (Postgres/Supabase only).
 */
import axios from 'axios';
import { db } from '../config/database';
import { destinationImageAssets, destinations } from '../db/schema/hotels';
import { env } from '../config/env';
import { notInArray } from 'drizzle-orm';
import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageRecord {
  publicUrl: string;
  sourceUrl: string;
  sourceProvider: 'pexels' | 'unsplash';
  altText: string;
  width: number;
  height: number;
  creditName: string;
  creditUrl: string;
  license: string;
}

// ─── Pexels ──────────────────────────────────────────────────────────────────

export async function fetchPexelsImages(query: string, count = 10): Promise<ImageRecord[]> {
  const key = env.PEXELS_API_KEY;
  if (!key) return [];

  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      headers: { Authorization: key },
      params: { query, per_page: Math.min(count, 15), orientation: 'landscape' },
      timeout: 10_000,
    });

    const photos: ImageRecord[] = (res.data.photos ?? []).map((p: any) => ({
      publicUrl: p.src?.large2x ?? p.src?.large ?? p.src?.original,
      sourceUrl: p.url,
      sourceProvider: 'pexels' as const,
      altText: p.alt || query,
      width: p.width,
      height: p.height,
      creditName: p.photographer ?? 'Pexels',
      creditUrl: p.photographer_url ?? 'https://www.pexels.com',
      license: 'Pexels License',
    }));

    return photos.filter((p) => Boolean(p.publicUrl));
  } catch (err: any) {
    logger.warn({ err: err?.message, query }, 'Pexels fetch failed');
    return [];
  }
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────

export async function fetchUnsplashImages(query: string, count = 10): Promise<ImageRecord[]> {
  const key = env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: Math.min(count, 15), orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${key}` },
      timeout: 10_000,
    });

    const results: ImageRecord[] = (res.data.results ?? []).map((p: any) => ({
      publicUrl: p.urls?.regular ?? p.urls?.full,
      sourceUrl: p.links?.html,
      sourceProvider: 'unsplash' as const,
      altText: p.alt_description || p.description || query,
      width: p.width,
      height: p.height,
      creditName: p.user?.name ?? 'Unsplash',
      creditUrl: p.user?.links?.html ?? 'https://unsplash.com',
      license: 'Unsplash License',
    }));

    return results.filter((p) => Boolean(p.publicUrl));
  } catch (err: any) {
    logger.warn({ err: err?.message, query }, 'Unsplash fetch failed');
    return [];
  }
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function fetchImagesForDestination(
  destination: { name: string; country: string; continent: string | null },
  count = 10,
): Promise<ImageRecord[]> {
  const query = `${destination.name} ${destination.country} travel`;

  // Primary: Pexels
  let images = await fetchPexelsImages(query, count);

  // Fallback: Unsplash (only if Pexels returned too few)
  if (images.length < Math.ceil(count / 2)) {
    const needed = count - images.length;
    const fallback = await fetchUnsplashImages(query, needed);
    images = [...images, ...fallback];
  }

  return images.slice(0, count);
}

// ─── DB Writer ────────────────────────────────────────────────────────────────

export async function saveImagesToDb(destinationId: string, images: ImageRecord[]): Promise<void> {
  if (images.length === 0) return;

  const rows = images.map((img, i) => ({
    destinationId,
    assetType: i === 0 ? 'hero' : 'gallery',
    sourceProvider: img.sourceProvider,
    sourceUrl: img.sourceUrl,
    publicUrl: img.publicUrl,
    altText: img.altText,
    width: img.width,
    height: img.height,
    creditName: img.creditName,
    creditUrl: img.creditUrl,
    license: img.license,
    sortOrder: i,
    status: 'ready',
  }));

  await db.insert(destinationImageAssets).values(rows).onConflictDoNothing();
}

// ─── Query helper ─────────────────────────────────────────────────────────────

export async function getDestinationIdsWithoutImages(): Promise<{ id: string; name: string; country: string; continent: string | null }[]> {
  // Destinations whose IDs are NOT in destination_image_assets
  const withImages = await db
    .selectDistinct({ id: destinationImageAssets.destinationId })
    .from(destinationImageAssets);

  const withImageIds = withImages.map((r) => r.id);

  const query = withImageIds.length > 0
    ? db.select({ id: destinations.id, name: destinations.name, country: destinations.country, continent: destinations.continent })
        .from(destinations)
        .where(notInArray(destinations.id, withImageIds))
    : db.select({ id: destinations.id, name: destinations.name, country: destinations.country, continent: destinations.continent })
        .from(destinations);

  return query;
}
