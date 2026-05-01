// Recreates the flight schemas for testing in isolation (the source schemas
// are inline inside the router file). Keeps them in sync via a single source
// of truth would be ideal, but for now we test the contract directly.
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const flightSearchSchema = z.object({
  mode: z.enum(['A', 'B']).default('A'),
  origin: z.string().length(3).toUpperCase().optional(),
  destination: z.string().length(3).toUpperCase().optional(),
  originCity: z.string().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  currency: z.string().length(3).default('INR'),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tripType: z.enum(['one_way', 'round_trip', 'multi_city']).default('one_way'),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  children: z.coerce.number().int().min(0).max(9).default(0),
  infants: z.coerce.number().int().min(0).max(4).default(0),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  directOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

describe('flightSearchSchema — happy path', () => {
  it('accepts a minimal one-way query', () => {
    expect(() => flightSearchSchema.parse({
      origin: 'DEL', destination: 'BLR', departDate: '2026-08-15',
    })).not.toThrow();
  });

  it('uppercases IATA codes', () => {
    const out = flightSearchSchema.parse({
      origin: 'del', destination: 'blr', departDate: '2026-08-15',
    });
    expect(out.origin).toBe('DEL');
    expect(out.destination).toBe('BLR');
  });

  it('applies defaults: mode=A, currency=INR, tripType=one_way, cabin=economy', () => {
    const out = flightSearchSchema.parse({ departDate: '2026-08-15' });
    expect(out.mode).toBe('A');
    expect(out.currency).toBe('INR');
    expect(out.tripType).toBe('one_way');
    expect(out.cabinClass).toBe('economy');
    expect(out.adults).toBe(1);
    expect(out.children).toBe(0);
    expect(out.infants).toBe(0);
  });

  it('coerces string numbers from query string', () => {
    const out = flightSearchSchema.parse({
      departDate: '2026-08-15', adults: '3', children: '1', limit: '40', page: '2',
    });
    expect(out.adults).toBe(3);
    expect(out.children).toBe(1);
    expect(out.limit).toBe(40);
    expect(out.page).toBe(2);
  });
});

describe('flightSearchSchema — validation', () => {
  it('rejects 2-letter IATA code', () => {
    expect(() => flightSearchSchema.parse({
      origin: 'DE', destination: 'BLR', departDate: '2026-08-15',
    })).toThrow();
  });

  it('rejects 4-letter IATA code', () => {
    expect(() => flightSearchSchema.parse({
      origin: 'DELI', destination: 'BLR', departDate: '2026-08-15',
    })).toThrow();
  });

  it('rejects bad date format', () => {
    expect(() => flightSearchSchema.parse({
      origin: 'DEL', destination: 'BLR', departDate: '15-08-2026',
    })).toThrow(/Invalid date format/);
  });

  it('rejects adults < 1', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', adults: 0,
    })).toThrow();
  });

  it('rejects adults > 9', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', adults: 10,
    })).toThrow();
  });

  it('rejects children > 9', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', children: 10,
    })).toThrow();
  });

  it('rejects infants > 4', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', infants: 5,
    })).toThrow();
  });

  it('rejects negative budget', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', maxBudget: '-1',
    })).toThrow();
  });

  it('rejects unknown cabin class', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', cabinClass: 'first-class',
    })).toThrow();
  });

  it('rejects limit > 50', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', limit: '60',
    })).toThrow();
  });

  it('rejects page < 1', () => {
    expect(() => flightSearchSchema.parse({
      departDate: '2026-08-15', page: '0',
    })).toThrow();
  });
});

describe('flightSearchSchema — performance', () => {
  it('parses 1000 valid queries in < 250ms', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      flightSearchSchema.parse({
        origin: 'del', destination: 'blr', departDate: '2026-08-15', adults: '2',
      });
    }
    expect(performance.now() - start).toBeLessThan(250);
  });
});
