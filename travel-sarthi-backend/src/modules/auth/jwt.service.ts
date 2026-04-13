import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env';
import { AuthenticationError } from '../../shared/errors';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  jti: string; // unique token id
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .setIssuer('travel-sarthi')
    .setAudience('travel-sarthi-client')
    .sign(secret);
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .setIssuer('travel-sarthi')
    .setAudience('travel-sarthi-refresh')
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'travel-sarthi',
      audience: 'travel-sarthi-client',
    });

    if (
      typeof payload['userId'] !== 'string' ||
      typeof payload['sessionId'] !== 'string' ||
      typeof payload['role'] !== 'string'
    ) {
      throw new AuthenticationError('Invalid token payload');
    }

    return {
      userId: payload['userId'],
      sessionId: payload['sessionId'],
      role: payload['role'],
    };
  } catch (err) {
    if (err instanceof AuthenticationError) throw err;
    throw new AuthenticationError('Invalid or expired access token');
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'travel-sarthi',
      audience: 'travel-sarthi-refresh',
    });

    if (
      typeof payload['userId'] !== 'string' ||
      typeof payload['sessionId'] !== 'string' ||
      typeof payload['jti'] !== 'string'
    ) {
      throw new AuthenticationError('Invalid refresh token payload');
    }

    return {
      userId: payload['userId'],
      sessionId: payload['sessionId'],
      jti: payload['jti'],
    };
  } catch (err) {
    if (err instanceof AuthenticationError) throw err;
    throw new AuthenticationError('Invalid or expired refresh token');
  }
}
