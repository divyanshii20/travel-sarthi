import { describe, it, expect } from 'vitest';
import {
  signAccessToken, signRefreshToken,
  verifyAccessToken, verifyRefreshToken,
} from './jwt.service';
import { AuthenticationError } from '../../shared/errors';

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips a valid payload', async () => {
    const payload = { userId: 'u1', sessionId: 's1', role: 'user' };
    const token = await signAccessToken(payload);
    const decoded = await verifyAccessToken(token);
    expect(decoded).toEqual(payload);
  });

  it('produces a JWT in three dot-separated parts', async () => {
    const token = await signAccessToken({ userId: 'u', sessionId: 's', role: 'user' });
    expect(token.split('.')).toHaveLength(3);
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken({ userId: 'u', sessionId: 's', role: 'user' });
    const tampered = token.slice(0, -2) + 'XX';
    await expect(verifyAccessToken(tampered)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('rejects garbage', async () => {
    await expect(verifyAccessToken('not-a-jwt')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('rejects an empty token', async () => {
    await expect(verifyAccessToken('')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('rejects a refresh token used as access token (audience mismatch)', async () => {
    const refresh = await signRefreshToken({ userId: 'u', sessionId: 's', jti: 'j1' });
    await expect(verifyAccessToken(refresh)).rejects.toBeInstanceOf(AuthenticationError);
  });
});

describe('signRefreshToken / verifyRefreshToken', () => {
  it('round-trips a valid payload', async () => {
    const payload = { userId: 'u1', sessionId: 's1', jti: 'jti-123' };
    const token = await signRefreshToken(payload);
    const decoded = await verifyRefreshToken(token);
    expect(decoded).toEqual(payload);
  });

  it('rejects an access token used as refresh (audience mismatch)', async () => {
    const access = await signAccessToken({ userId: 'u', sessionId: 's', role: 'user' });
    await expect(verifyRefreshToken(access)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('rejects a tampered refresh token', async () => {
    const token = await signRefreshToken({ userId: 'u', sessionId: 's', jti: 'j' });
    await expect(verifyRefreshToken(token.slice(0, -3) + 'AAA')).rejects.toBeInstanceOf(AuthenticationError);
  });
});

describe('JWT performance', () => {
  it('signs an access token in < 50ms', async () => {
    const start = performance.now();
    await signAccessToken({ userId: 'u', sessionId: 's', role: 'user' });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('verifies an access token in < 25ms', async () => {
    const token = await signAccessToken({ userId: 'u', sessionId: 's', role: 'user' });
    const start = performance.now();
    await verifyAccessToken(token);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(25);
  });

  it('1000 sign+verify cycles complete in < 5 seconds', async () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const token = await signAccessToken({ userId: `u${i}`, sessionId: 's', role: 'user' });
      await verifyAccessToken(token);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  }, 10000);
});
