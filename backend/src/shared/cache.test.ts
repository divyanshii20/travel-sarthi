import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the redis client BEFORE importing cache.ts (vi.hoisted ensures correct order)
const redisMock = vi.hoisted(() => ({
  get:    vi.fn(),
  setex:  vi.fn(),
  del:    vi.fn(),
  keys:   vi.fn(),
}));

vi.mock('../config/redis', () => ({ redis: redisMock }));
vi.mock('./logger', () => ({ logger: { warn: vi.fn(), debug: vi.fn(), info: vi.fn() } }));

import {
  cacheGet, cacheSet, cacheDel, cacheInvalidatePattern,
  buildCacheKey, withCache,
} from './cache';

beforeEach(() => {
  redisMock.get.mockReset();
  redisMock.setex.mockReset();
  redisMock.del.mockReset();
  redisMock.keys.mockReset();
});

describe('buildCacheKey', () => {
  it('joins parts with a colon', () => {
    expect(buildCacheKey('flights', 'DEL', 'BLR')).toBe('flights:DEL:BLR');
  });
  it('handles numbers', () => {
    expect(buildCacheKey('user', 42, 'profile')).toBe('user:42:profile');
  });
  it('handles a single part', () => {
    expect(buildCacheKey('only')).toBe('only');
  });
});

describe('cacheGet', () => {
  it('returns parsed value on hit', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ x: 1 }));
    expect(await cacheGet('k')).toEqual({ x: 1 });
  });

  it('returns null on miss', async () => {
    redisMock.get.mockResolvedValue(null);
    expect(await cacheGet('k')).toBeNull();
  });

  it('returns null on parse error (graceful)', async () => {
    redisMock.get.mockResolvedValue('not-json{{');
    expect(await cacheGet('k')).toBeNull();
  });

  it('returns null on redis error (graceful)', async () => {
    redisMock.get.mockRejectedValue(new Error('redis down'));
    expect(await cacheGet('k')).toBeNull();
  });
});

describe('cacheSet', () => {
  it('serialises value and uses TTL', async () => {
    redisMock.setex.mockResolvedValue('OK');
    await cacheSet('k', { a: 1 }, 900);
    expect(redisMock.setex).toHaveBeenCalledWith('k', 900, JSON.stringify({ a: 1 }));
  });

  it('does not throw on redis error', async () => {
    redisMock.setex.mockRejectedValue(new Error('redis down'));
    await expect(cacheSet('k', 'v', 60)).resolves.toBeUndefined();
  });
});

describe('cacheDel', () => {
  it('calls redis.del with all keys', async () => {
    redisMock.del.mockResolvedValue(2);
    await cacheDel('a', 'b');
    expect(redisMock.del).toHaveBeenCalledWith('a', 'b');
  });

  it('skips redis when no keys provided', async () => {
    await cacheDel();
    expect(redisMock.del).not.toHaveBeenCalled();
  });

  it('survives redis error', async () => {
    redisMock.del.mockRejectedValue(new Error('x'));
    await expect(cacheDel('k')).resolves.toBeUndefined();
  });
});

describe('cacheInvalidatePattern', () => {
  it('deletes matching keys when found', async () => {
    redisMock.keys.mockResolvedValue(['k1', 'k2']);
    redisMock.del.mockResolvedValue(2);
    await cacheInvalidatePattern('flights:*');
    expect(redisMock.del).toHaveBeenCalledWith('k1', 'k2');
  });

  it('skips del when no keys match', async () => {
    redisMock.keys.mockResolvedValue([]);
    await cacheInvalidatePattern('x:*');
    expect(redisMock.del).not.toHaveBeenCalled();
  });
});

describe('withCache', () => {
  it('returns cached value when present (no fetcher call)', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ cached: true }));
    const fetcher = vi.fn().mockResolvedValue({ fresh: true });
    const out = await withCache('k', 60, fetcher);
    expect(out).toEqual({ cached: true });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('calls fetcher + sets cache on miss', async () => {
    redisMock.get.mockResolvedValue(null);
    redisMock.setex.mockResolvedValue('OK');
    const fetcher = vi.fn().mockResolvedValue({ fresh: true });
    const out = await withCache('k', 60, fetcher);
    expect(out).toEqual({ fresh: true });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(redisMock.setex).toHaveBeenCalledWith('k', 60, JSON.stringify({ fresh: true }));
  });

  it('still returns fresh data when cache write fails', async () => {
    redisMock.get.mockResolvedValue(null);
    redisMock.setex.mockRejectedValue(new Error('redis down'));
    const fetcher = vi.fn().mockResolvedValue({ ok: 1 });
    expect(await withCache('k', 60, fetcher)).toEqual({ ok: 1 });
  });
});
