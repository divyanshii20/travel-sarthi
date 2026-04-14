import { redis } from '../config/redis';
import { logger } from './logger';

export type CacheTTL =
  | 300         // 5 minutes
  | 60          // 1 minute
  | 900         // 15 minutes (flight search)
  | 1800        // 30 minutes (hotel search)
  | 3600        // 1 hour (weather)
  | 14400       // 4 hours (price predictions)
  | 86400       // 24 hours (itinerary)
  | 604800;     // 7 days (places)

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    logger.warn({ err, key }, 'Cache GET error');
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: CacheTTL): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn({ err, key }, 'Cache SET error');
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logger.warn({ err, keys }, 'Cache DEL error');
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug({ pattern, count: keys.length }, 'Cache pattern invalidated');
    }
  } catch (err) {
    logger.warn({ err, pattern }, 'Cache pattern invalidation error');
  }
}

export function buildCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

// ─── Cache-aside helper ───────────────────────────────────────────────────────

export async function withCache<T>(
  key: string,
  ttl: CacheTTL,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await cacheSet(key, fresh, ttl);
  return fresh;
}
