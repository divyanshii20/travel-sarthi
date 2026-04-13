import bcrypt from 'bcrypt';
import { randomBytes, timingSafeEqual, createHash } from 'crypto';
import { randomUUID } from 'crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../config/database';
import { users } from '../../db/schema/users';
import { sessions, refreshTokens } from '../../db/schema/sessions';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.service';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../shared/errors';
import { sendVerificationEmail, sendPasswordResetEmail } from '../users/email.service';
import type { RegisterDTO, LoginDTO } from './auth.schema';
import { logger } from '../../shared/logger';

const BCRYPT_ROUNDS = 12;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Helper: hash a random token for DB storage ───────────────────────────────

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export async function register(dto: RegisterDTO, ipAddress: string, userAgent: string) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, dto.email))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
  const verificationToken = generateToken();
  const verificationHash = hashToken(verificationToken);

  const [user] = await db
    .insert(users)
    .values({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      emailVerificationToken: verificationHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning();

  if (!user) throw new Error('Failed to create user');

  // Send verification email (non-blocking — failure should not block registration)
  sendVerificationEmail(user.email, user.displayName, verificationToken).catch((err) => {
    logger.error({ err, userId: user.id }, 'Failed to send verification email');
  });

  const { accessToken, refreshToken, session } = await createSession(user.id, 'user', ipAddress, userAgent);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    expiresAt: session.expiresAt.toISOString(),
  };
}

export async function login(dto: LoginDTO, ipAddress: string, userAgent: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, dto.email))
    .limit(1);

  if (!user || !user.passwordHash) {
    // Constant-time dummy comparison to prevent timing attacks
    await bcrypt.compare('dummy-password', '$2b$12$dummyhashfordummypurposesonly12345678901');
    throw new AuthenticationError('Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!passwordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // TOTP check
  if (user.isTwoFactorEnabled && user.twoFactorMethod === 'totp') {
    if (!dto.totpCode) {
      throw new AuthenticationError('Two-factor authentication code required');
    }

    if (!user.totpSecret) {
      throw new AuthenticationError('TOTP not configured');
    }

    const totp = new OTPAuth.TOTP({ secret: user.totpSecret, digits: 6, period: 30 });
    const delta = totp.validate({ token: dto.totpCode, window: 1 });

    if (delta === null) {
      // Check backup codes
      const backupValid = await verifyBackupCode(user.id, dto.totpCode, user.totpBackupCodes ?? []);
      if (!backupValid) {
        throw new AuthenticationError('Invalid two-factor authentication code');
      }
    }
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const { accessToken, refreshToken, session } = await createSession(user.id, user.role, ipAddress, userAgent);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    expiresAt: session.expiresAt.toISOString(),
  };
}

export async function refreshSession(refreshTokenStr: string) {
  const payload = await verifyRefreshToken(refreshTokenStr);
  const tokenHash = hashToken(refreshTokenStr);

  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.sessionId, payload.sessionId),
        eq(refreshTokens.tokenHash, tokenHash),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!storedToken || storedToken.revokedAt !== null) {
    throw new AuthenticationError('Invalid or revoked refresh token');
  }

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) throw new AuthenticationError('User not found');

  // Rotate refresh token
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, storedToken.id));

  const newRefreshToken = generateToken();
  const newRefreshHash = hashToken(newRefreshToken);
  const newExpiry = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(refreshTokens).values({
    sessionId: payload.sessionId,
    userId: user.id,
    tokenHash: newRefreshHash,
    expiresAt: newExpiry,
  });

  // Extend session
  await db
    .update(sessions)
    .set({ expiresAt: newExpiry })
    .where(eq(sessions.id, payload.sessionId));

  const accessToken = await signAccessToken({
    userId: user.id,
    sessionId: payload.sessionId,
    role: user.role,
  });

  const newRefreshSigned = await signRefreshToken({
    userId: user.id,
    sessionId: payload.sessionId,
    jti: randomUUID(),
  });

  return {
    accessToken,
    refreshToken: newRefreshSigned,
    expiresAt: newExpiry.toISOString(),
  };
}

export async function logout(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ expiresAt: new Date() })
    .where(eq(sessions.id, sessionId));

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.sessionId, sessionId));
}

export async function forgotPassword(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Return silently if user not found to prevent email enumeration
  if (!user) return;

  const resetToken = generateToken();
  const resetHash = hashToken(resetToken);

  await db
    .update(users)
    .set({
      passwordResetToken: resetHash,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    })
    .where(eq(users.id, user.id));

  await sendPasswordResetEmail(user.email, user.displayName, resetToken).catch((err) => {
    logger.error({ err, userId: user.id }, 'Failed to send password reset email');
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.passwordResetToken, tokenHash),
        gt(users.passwordResetExpires!, new Date()),
      ),
    )
    .limit(1);

  if (!user) {
    throw new ValidationError('Invalid or expired password reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .where(eq(users.id, user.id));

  // Revoke all sessions after password reset
  await db
    .update(sessions)
    .set({ expiresAt: new Date() })
    .where(eq(sessions.userId, user.id));
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.passwordHash) throw new NotFoundError('User');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AuthenticationError('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.emailVerificationToken, tokenHash),
        gt(users.emailVerificationExpires!, new Date()),
      ),
    )
    .limit(1);

  if (!user) {
    throw new ValidationError('Invalid or expired verification token');
  }

  await db
    .update(users)
    .set({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    })
    .where(eq(users.id, user.id));
}

export async function setupTotp(userId: string) {
  const [user] = await db
    .select({ email: users.email, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new NotFoundError('User');

  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'Travel Sarthi',
    label: user.email,
    secret,
    digits: 6,
    period: 30,
  });

  const uri = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(uri);

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    randomBytes(4).toString('hex').toUpperCase(),
  );
  const backupHashes = backupCodes.map(hashToken);

  // Store secret temporarily (not yet enabled)
  await db
    .update(users)
    .set({ totpSecret: secret.base32, totpBackupCodes: backupHashes })
    .where(eq(users.id, userId));

  return {
    qrCodeDataUrl,
    secret: secret.base32,
    backupCodes,
  };
}

export async function enableTotp(userId: string, code: string): Promise<void> {
  const [user] = await db
    .select({ totpSecret: users.totpSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.totpSecret) {
    throw new ValidationError('TOTP setup not initiated — call /auth/totp/setup first');
  }

  const totp = new OTPAuth.TOTP({ secret: user.totpSecret, digits: 6, period: 30 });
  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    throw new AuthenticationError('Invalid TOTP code');
  }

  await db
    .update(users)
    .set({ isTwoFactorEnabled: true, twoFactorMethod: 'totp' })
    .where(eq(users.id, userId));
}

export async function disableTotp(userId: string, password: string, code: string): Promise<void> {
  const [user] = await db
    .select({ passwordHash: users.passwordHash, totpSecret: users.totpSecret })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.passwordHash) throw new NotFoundError('User');

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) throw new AuthenticationError('Invalid password');

  if (user.totpSecret) {
    const totp = new OTPAuth.TOTP({ secret: user.totpSecret, digits: 6, period: 30 });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) throw new AuthenticationError('Invalid TOTP code');
  }

  await db
    .update(users)
    .set({
      isTwoFactorEnabled: false,
      twoFactorMethod: null,
      totpSecret: null,
      totpBackupCodes: null,
    })
    .where(eq(users.id, userId));
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function createSession(userId: string, role: string, ipAddress: string, userAgent: string) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    ipAddress,
    userAgent,
  });

  const rawRefreshToken = generateToken();
  const refreshHash = hashToken(rawRefreshToken);

  await db.insert(refreshTokens).values({
    sessionId,
    userId,
    tokenHash: refreshHash,
    expiresAt,
  });

  const accessToken = await signAccessToken({ userId, sessionId, role });
  const refreshToken = await signRefreshToken({ userId, sessionId, jti: randomUUID() });

  return {
    accessToken,
    refreshToken,
    session: { id: sessionId, expiresAt },
  };
}

async function verifyBackupCode(userId: string, code: string, storedHashes: string[]): Promise<boolean> {
  for (const hash of storedHashes) {
    if (safeCompare(hashToken(code), hash)) {
      // Invalidate used backup code
      const updated = storedHashes.filter((h) => h !== hash);
      await db.update(users).set({ totpBackupCodes: updated }).where(eq(users.id, userId));
      return true;
    }
  }
  return false;
}

function sanitizeUser(user: typeof users.$inferSelect) {
  return {
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
  };
}
