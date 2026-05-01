import { describe, it, expect, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { validateBody, validateQuery, validateParams } from './validate';
import type { Request, Response, NextFunction } from 'express';

const schema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().int().min(0),
});

function makeReqRes(payload: { body?: unknown; query?: unknown; params?: unknown }) {
  const req = {
    body: payload.body, query: payload.query, params: payload.params,
  } as unknown as Request;
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('validateBody', () => {
  it('calls next() with no args on valid body', () => {
    const { req, res, next } = makeReqRes({ body: { name: 'A', age: 1 } });
    validateBody(schema)(req, res, next);
    expect((next as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([]);
  });

  it('replaces req.body with parsed (coerced) data', () => {
    const { req, res, next } = makeReqRes({ body: { name: 'A', age: '5' } });
    validateBody(schema)(req, res, next);
    expect(req.body).toEqual({ name: 'A', age: 5 });
  });

  it('passes ZodError to next on failure', () => {
    const { req, res, next } = makeReqRes({ body: { name: '', age: -1 } });
    validateBody(schema)(req, res, next);
    const fn = next as unknown as ReturnType<typeof vi.fn>;
    expect(fn).toHaveBeenCalledOnce();
    expect(fn.mock.calls[0]?.[0]).toBeInstanceOf(ZodError);
  });

  it('does not mutate body when validation fails', () => {
    const original = { name: '', age: -1 };
    const { req, res, next } = makeReqRes({ body: original });
    validateBody(schema)(req, res, next);
    expect(req.body).toEqual(original);
  });
});

describe('validateQuery', () => {
  it('replaces req.query with parsed data on success', () => {
    const { req, res, next } = makeReqRes({ query: { name: 'A', age: '12' } });
    validateQuery(schema)(req, res, next);
    expect(req.query).toEqual({ name: 'A', age: 12 });
  });

  it('passes error to next on invalid query', () => {
    const { req, res, next } = makeReqRes({ query: { age: 'not-a-number' } });
    validateQuery(schema)(req, res, next);
    const fn = next as unknown as ReturnType<typeof vi.fn>;
    expect(fn.mock.calls[0]?.[0]).toBeInstanceOf(ZodError);
  });
});

describe('validateParams', () => {
  const paramsSchema = z.object({ id: z.string().uuid() });

  it('accepts a valid uuid param', () => {
    const { req, res, next } = makeReqRes({ params: { id: '123e4567-e89b-12d3-a456-426614174000' } });
    validateParams(paramsSchema)(req, res, next);
    expect((next as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([]);
  });

  it('rejects an invalid uuid param', () => {
    const { req, res, next } = makeReqRes({ params: { id: 'not-uuid' } });
    validateParams(paramsSchema)(req, res, next);
    const fn = next as unknown as ReturnType<typeof vi.fn>;
    expect(fn.mock.calls[0]?.[0]).toBeInstanceOf(ZodError);
  });
});
