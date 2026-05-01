import { describe, it, expect, vi } from 'vitest';
import { sendSuccess, sendError, buildPaginationMeta } from './response';
import type { Response } from 'express';

function mockRes() {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

describe('sendSuccess', () => {
  it('defaults to 200 status', () => {
    const res = mockRes();
    sendSuccess(res, { hello: 'world' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('shapes the body as { data, error: null }', () => {
    const res = mockRes();
    sendSuccess(res, { hello: 'world' });
    expect(res.json).toHaveBeenCalledWith({ data: { hello: 'world' }, error: null });
  });

  it('respects custom status code (e.g. 201)', () => {
    const res = mockRes();
    sendSuccess(res, { id: 1 }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('attaches pagination meta when provided', () => {
    const res = mockRes();
    sendSuccess(res, [1, 2], 200, {
      page: 1, limit: 10, total: 50, totalPages: 5, hasNext: true, hasPrev: false,
    });
    expect(res.json).toHaveBeenCalledWith({
      data: [1, 2], error: null,
      meta: { page: 1, limit: 10, total: 50, totalPages: 5, hasNext: true, hasPrev: false },
    });
  });

  it('omits meta key when not provided', () => {
    const res = mockRes();
    sendSuccess(res, { x: 1 });
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(body).not.toHaveProperty('meta');
  });
});

describe('sendError', () => {
  it('shapes body as { data: null, error: {code, message} }', () => {
    const res = mockRes();
    sendError(res, 400, 'BAD', 'Bad request');
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      error: { code: 'BAD', message: 'Bad request' },
    });
  });

  it('uses the supplied status code', () => {
    const res = mockRes();
    sendError(res, 404, 'NOT_FOUND', 'gone');
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('attaches details when provided', () => {
    const res = mockRes();
    sendError(res, 422, 'VAL', 'fail', { email: ['bad'] });
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      error: { code: 'VAL', message: 'fail', details: { email: ['bad'] } },
    });
  });

  it('omits details when not provided', () => {
    const res = mockRes();
    sendError(res, 401, 'AUTH', 'no');
    const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(body.error).not.toHaveProperty('details');
  });
});

describe('buildPaginationMeta', () => {
  it('computes totalPages correctly', () => {
    expect(buildPaginationMeta(50, 1, 10).totalPages).toBe(5);
    expect(buildPaginationMeta(51, 1, 10).totalPages).toBe(6);
    expect(buildPaginationMeta(0,  1, 10).totalPages).toBe(0);
  });

  it('hasNext / hasPrev are correct on first page', () => {
    const m = buildPaginationMeta(30, 1, 10);
    expect(m.hasPrev).toBe(false);
    expect(m.hasNext).toBe(true);
  });

  it('hasNext / hasPrev are correct on middle page', () => {
    const m = buildPaginationMeta(30, 2, 10);
    expect(m.hasPrev).toBe(true);
    expect(m.hasNext).toBe(true);
  });

  it('hasNext / hasPrev are correct on last page', () => {
    const m = buildPaginationMeta(30, 3, 10);
    expect(m.hasPrev).toBe(true);
    expect(m.hasNext).toBe(false);
  });

  it('returns the input page and limit', () => {
    const m = buildPaginationMeta(100, 4, 25);
    expect(m.page).toBe(4);
    expect(m.limit).toBe(25);
    expect(m.total).toBe(100);
  });
});
