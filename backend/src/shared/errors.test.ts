import { describe, it, expect } from 'vitest';
import {
  AppError, ValidationError, AuthenticationError, ForbiddenError,
  NotFoundError, ConflictError, RateLimitError, ExternalServiceError,
  ServiceUnavailableError,
} from './errors';

describe('AppError base', () => {
  it('captures message, statusCode, code', () => {
    const e = new AppError('boom', 500, 'BOOM');
    expect(e.message).toBe('boom');
    expect(e.statusCode).toBe(500);
    expect(e.code).toBe('BOOM');
    expect(e.isOperational).toBe(true);
  });

  it('inherits from Error', () => {
    const e = new AppError('x', 400, 'X');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AppError);
  });

  it('has a stack trace', () => {
    const e = new AppError('x', 400, 'X');
    expect(e.stack).toBeDefined();
  });

  it('accepts optional details', () => {
    const e = new AppError('x', 400, 'X', true, { field: ['err'] });
    expect(e.details).toEqual({ field: ['err'] });
  });
});

describe('Specific error classes', () => {
  it('ValidationError → 422 / VALIDATION_ERROR', () => {
    const e = new ValidationError('bad', { x: ['req'] });
    expect(e.statusCode).toBe(422);
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e.details?.['x']).toEqual(['req']);
  });

  it('AuthenticationError → 401', () => {
    expect(new AuthenticationError().statusCode).toBe(401);
    expect(new AuthenticationError().code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('AuthenticationError accepts custom message', () => {
    expect(new AuthenticationError('Token expired').message).toBe('Token expired');
  });

  it('ForbiddenError → 403', () => {
    expect(new ForbiddenError().statusCode).toBe(403);
  });

  it('NotFoundError formats message with resource name', () => {
    const e = new NotFoundError('User');
    expect(e.message).toBe('User not found');
    expect(e.statusCode).toBe(404);
  });

  it('ConflictError → 409', () => {
    expect(new ConflictError('exists').statusCode).toBe(409);
  });

  it('RateLimitError → 429', () => {
    expect(new RateLimitError().statusCode).toBe(429);
  });

  it('ExternalServiceError → 502 with service name', () => {
    const e = new ExternalServiceError('Gemini');
    expect(e.statusCode).toBe(502);
    expect(e.message).toContain('Gemini');
  });

  it('ServiceUnavailableError → 503', () => {
    expect(new ServiceUnavailableError().statusCode).toBe(503);
  });

  it('all specific errors are instances of AppError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(AppError);
    expect(new AuthenticationError()).toBeInstanceOf(AppError);
    expect(new ForbiddenError()).toBeInstanceOf(AppError);
    expect(new NotFoundError('X')).toBeInstanceOf(AppError);
    expect(new ConflictError('x')).toBeInstanceOf(AppError);
    expect(new RateLimitError()).toBeInstanceOf(AppError);
    expect(new ExternalServiceError('x')).toBeInstanceOf(AppError);
    expect(new ServiceUnavailableError()).toBeInstanceOf(AppError);
  });
});
