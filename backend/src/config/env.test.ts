import { describe, it, expect } from 'vitest';
import { env } from './env';

describe('env config', () => {
  it('NODE_ENV is one of [development, production, test]', () => {
    expect(['development', 'production', 'test']).toContain(env.NODE_ENV);
  });

  it('PORT is a number in valid range', () => {
    expect(typeof env.PORT).toBe('number');
    expect(env.PORT).toBeGreaterThan(0);
    expect(env.PORT).toBeLessThan(65536);
  });

  it('API_BASE_URL is a valid URL', () => {
    expect(() => new URL(env.API_BASE_URL)).not.toThrow();
  });

  it('JWT_SECRET is at least 32 characters', () => {
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('SESSION_SECRET is at least 32 characters', () => {
    expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('DATABASE_URL is set', () => {
    expect(env.DATABASE_URL.length).toBeGreaterThan(0);
  });

  it('REDIS_URL is set', () => {
    expect(env.REDIS_URL.length).toBeGreaterThan(0);
  });

  it('SUPABASE_URL is a valid URL', () => {
    expect(() => new URL(env.SUPABASE_URL)).not.toThrow();
  });

  it('AMADEUS_BASE_URL has a sensible default', () => {
    expect(env.AMADEUS_BASE_URL).toMatch(/^https?:\/\//);
  });

  it('CORS_ORIGIN has a default', () => {
    expect(env.CORS_ORIGIN).toBeTruthy();
  });

  it('RATE_LIMIT_WINDOW_MS is a positive number', () => {
    expect(env.RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
  });

  it('RATE_LIMIT_MAX_REQUESTS is a positive number', () => {
    expect(env.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
  });

  it('JWT_ACCESS_EXPIRES_IN defaults to 15m', () => {
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe('15m');
  });

  it('JWT_REFRESH_EXPIRES_IN defaults to 30d', () => {
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe('30d');
  });
});
