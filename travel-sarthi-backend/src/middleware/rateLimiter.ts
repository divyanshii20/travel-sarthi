import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const defaultRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  keyGenerator: (req) => {
    return (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip ?? 'unknown';
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again in 15 minutes',
    },
  },
  skipSuccessfulRequests: true,
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Search rate limit exceeded, please wait before searching again',
    },
  },
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'AI generation rate limit exceeded',
    },
  },
});
