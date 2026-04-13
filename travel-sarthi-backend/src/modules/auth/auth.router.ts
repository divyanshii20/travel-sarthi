import { Router } from 'express';
import { validateBody, validateQuery } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { sendSuccess } from '../../shared/response';
import {
  register,
  login,
  refreshSession,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  setupTotp,
  enableTotp,
  disableTotp,
} from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  verifyTotpSchema,
  disableTotpSchema,
  googleCallbackSchema,
} from './auth.schema';
import { sendVerificationEmail } from '../users/email.service';
import { db } from '../../config/database';
import { users } from '../../db/schema/users';
import { eq, gt, and } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../shared/logger';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { redis } from '../../config/redis';

const router = Router();

function getIp(req: Express.Request & { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  return (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
}
function getUa(req: { headers: Record<string, string | string[] | undefined> }): string {
  return (req.headers['user-agent'] as string | undefined) ?? 'unknown';
}

// POST /api/auth/register
router.post('/register', authRateLimiter, validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await register(req.body, getIp(req as any), getUa(req as any));
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body, getIp(req as any), getUa(req as any));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', validateBody(refreshTokenSchema), async (req, res, next) => {
  try {
    const result = await refreshSession(req.body.refreshToken);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await logout(req.sessionId);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    await forgotPassword(req.body.email);
    // Always return success to prevent email enumeration
    sendSuccess(res, { message: 'If an account exists with this email, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    await resetPassword(req.body.token, req.body.newPassword);
    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), async (req, res, next) => {
  try {
    await changePassword(req.userId, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', validateBody(verifyEmailSchema), async (req, res, next) => {
  try {
    await verifyEmail(req.body.token);
    sendSuccess(res, { message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authRateLimiter, validateBody(resendVerificationSchema), async (req, res, next) => {
  try {
    const [user] = await db
      .select({ id: users.id, displayName: users.displayName, isEmailVerified: users.isEmailVerified })
      .from(users)
      .where(eq(users.email, req.body.email))
      .limit(1);

    if (user && !user.isEmailVerified) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      await db
        .update(users)
        .set({
          emailVerificationToken: tokenHash,
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .where(eq(users.id, user.id));

      await sendVerificationEmail(req.body.email, user.displayName, token).catch((err) => {
        logger.error({ err }, 'Failed to resend verification email');
      });
    }

    sendSuccess(res, { message: 'If your email is registered and unverified, a new verification email has been sent' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod,
      authProvider: user.authProvider,
      voyageCoinBalance: user.voyageCoinBalance,
      preferredCurrency: user.preferredCurrency,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/totp/setup
router.post('/totp/setup', requireAuth, async (req, res, next) => {
  try {
    const result = await setupTotp(req.userId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/totp/verify (enable after setup)
router.post('/totp/verify', requireAuth, validateBody(verifyTotpSchema), async (req, res, next) => {
  try {
    await enableTotp(req.userId, req.body.code);
    sendSuccess(res, { message: 'Two-factor authentication enabled successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/totp/disable
router.post('/totp/disable', requireAuth, validateBody(disableTotpSchema), async (req, res, next) => {
  try {
    await disableTotp(req.userId, req.body.password, req.body.code);
    sendSuccess(res, { message: 'Two-factor authentication disabled' });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/google — initiate Google OAuth PKCE flow
router.get('/google', async (req, res, next) => {
  try {
    const state = randomUUID();
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    // Store verifier in Redis for 10 minutes
    await redis.setex(`oauth:state:${state}`, 600, JSON.stringify({ codeVerifier, state }));

    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'select_account',
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/google/callback
router.get('/google/callback', validateQuery(googleCallbackSchema), async (req, res, next) => {
  try {
    const { code, state } = req.query as { code: string; state: string };

    const stored = await redis.getdel(`oauth:state:${state}`);
    if (!stored) {
      res.redirect(`${env.CORS_ORIGIN}/login?error=invalid_state`);
      return;
    }

    const { codeVerifier } = JSON.parse(stored) as { codeVerifier: string };

    // Exchange code for tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    const { access_token } = tokenRes.data as { access_token: string };

    // Get user info
    const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const googleUser = userInfoRes.data as {
      sub: string;
      email: string;
      name: string;
      picture: string;
      email_verified: boolean;
    };

    // Find or create user
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleUser.sub))
      .limit(1);

    if (!existingUser) {
      // Check if email already registered
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1);

      if (byEmail) {
        // Link Google account to existing user
        await db
          .update(users)
          .set({ googleId: googleUser.sub, authProvider: 'google', isEmailVerified: true })
          .where(eq(byEmail.id, byEmail.id));
        existingUser = { ...byEmail, googleId: googleUser.sub, authProvider: 'google' };
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: googleUser.email,
            displayName: googleUser.name,
            avatarUrl: googleUser.picture,
            googleId: googleUser.sub,
            authProvider: 'google',
            isEmailVerified: googleUser.email_verified,
          })
          .returning();
        if (!newUser) throw new Error('Failed to create Google user');
        existingUser = newUser;
      }
    }

    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0] ?? req.ip ?? 'unknown';
    const ua = (req.headers['user-agent'] as string | undefined) ?? 'unknown';

    const { accessToken, refreshToken } = await import('./auth.service').then((m) =>
      m.login({ email: existingUser!.email, password: '', totpCode: undefined }, ip, ua).catch(async () => {
        // For Google auth we bypass password check — create session directly
        const { signAccessToken, signRefreshToken } = await import('./jwt.service');
        const { sessions: sessionsTable } = await import('../../db/schema/sessions');
        const { refreshTokens: rtTable } = await import('../../db/schema/sessions');
        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await db.insert(sessionsTable).values({ id: sessionId, userId: existingUser!.id, expiresAt, ipAddress: ip, userAgent: ua });

        const rawRt = randomBytes(32).toString('hex');
        const rtHash = createHash('sha256').update(rawRt).digest('hex');
        await db.insert(rtTable).values({ sessionId, userId: existingUser!.id, tokenHash: rtHash, expiresAt });

        const at = await signAccessToken({ userId: existingUser!.id, sessionId, role: existingUser!.role });
        const rt = await signRefreshToken({ userId: existingUser!.id, sessionId, jti: randomUUID() });
        return { accessToken: at, refreshToken: rt };
      }),
    );

    // Redirect to frontend with tokens in query (frontend stores them)
    const params = new URLSearchParams({ accessToken, refreshToken });
    res.redirect(`${env.CORS_ORIGIN}/auth/callback?${params.toString()}`);
  } catch (err) {
    logger.error({ err }, 'Google OAuth callback failed');
    res.redirect(`${env.CORS_ORIGIN}/login?error=oauth_failed`);
    next(err);
  }
});

export { router as authRouter };
