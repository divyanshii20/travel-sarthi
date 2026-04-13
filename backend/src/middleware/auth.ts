import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { sessions } from '../db/schema/sessions';
import { users } from '../db/schema/users';
import { eq, and, gt } from 'drizzle-orm';
import { AuthenticationError, ForbiddenError } from '../shared/errors';
import { verifyAccessToken } from '../modules/auth/jwt.service';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      userRole: string;
      sessionId: string;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Bearer token required');
    }

    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);

    // Verify session is still active
    const session = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, payload.sessionId),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (session.length === 0) {
      throw new AuthenticationError('Session expired or invalid');
    }

    // Verify user still exists and is not banned
    const user = await db
      .select({ id: users.id, role: users.role, isEmailVerified: users.isEmailVerified })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user.length === 0) {
      throw new AuthenticationError('User not found');
    }

    req.userId = payload.userId;
    req.userRole = user[0]?.role ?? 'user';
    req.sessionId = payload.sessionId;

    next();
  } catch (err) {
    next(err);
  }
}

export async function requireEmailVerified(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await db
      .select({ isEmailVerified: users.isEmailVerified })
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);

    if (!user[0]?.isEmailVerified) {
      throw new ForbiddenError('Email verification required');
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (!roles.includes(_req.userRole)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}

// Optional auth — attaches userId if token present but doesn't fail without it
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token).catch(() => null);
    if (payload) {
      req.userId = payload.userId;
      req.sessionId = payload.sessionId;
    }

    next();
  } catch {
    next();
  }
}
