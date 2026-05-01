import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { errorHandler } from './errorHandler';
import {
  AppError, ValidationError, AuthenticationError,
  NotFoundError, RateLimitError,
} from '../shared/errors';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../shared/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

function makeReqRes() {
  const req = { headers: {}, path: '/test', method: 'GET' } as unknown as Request;
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return { req, res, next: vi.fn() as unknown as NextFunction };
}

describe('errorHandler — ZodError', () => {
  it('returns 422 with VALIDATION_ERROR code', () => {
    const { req, res, next } = makeReqRes();
    const zodErr = z.object({ x: z.string() }).safeParse({ x: 1 });
    if (zodErr.success) throw new Error('expected zod error');
    errorHandler(zodErr.error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('aggregates details by path', () => {
    const { req, res, next } = makeReqRes();
    const result = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }).safeParse({ email: 'no', password: 'x' });
    if (result.success) throw new Error('expected zod error');
    errorHandler(result.error, req, res, next);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(body.error.details).toHaveProperty('email');
    expect(body.error.details).toHaveProperty('password');
  });
});

describe('errorHandler — AppError subclasses', () => {
  it('AuthenticationError → 401', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new AuthenticationError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('NotFoundError → 404', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new NotFoundError('User'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('ValidationError → 422', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new ValidationError('bad'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('RateLimitError → 429', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new RateLimitError(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('passes the error message through', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new AuthenticationError('Token expired'), req, res, next);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(body.error.message).toBe('Token expired');
  });

  it('passes the error code through', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new AppError('x', 418, 'TEAPOT'), req, res, next);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(body.error.code).toBe('TEAPOT');
  });
});

describe('errorHandler — unknown errors', () => {
  it('returns 500 INTERNAL_SERVER_ERROR for native Error', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('returns 500 for unknown types', () => {
    const { req, res, next } = makeReqRes();
    errorHandler('string error', req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('does NOT leak the original error message to clients on 500', () => {
    const { req, res, next } = makeReqRes();
    errorHandler(new Error('SECRET LEAK 12345'), req, res, next);
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(body.error.message).not.toContain('SECRET LEAK');
  });
});
