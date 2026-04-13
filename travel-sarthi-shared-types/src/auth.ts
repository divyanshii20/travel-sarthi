// ─── Auth Types ───────────────────────────────────────────────────────────────

import type { UUID, ISODateTimeString } from './common';

export type AuthProvider = 'email' | 'google';

export type UserRole = 'user' | 'admin' | 'support';

export type TwoFactorMethod = 'totp' | 'sms' | 'email';

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  twoFactorMethod: TwoFactorMethod | null;
  authProvider: AuthProvider;
  googleId: string | null;
  voyageCoinBalance: number;
  preferredCurrency: string;
  preferredLanguage: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Session {
  id: UUID;
  userId: UUID;
  expiresAt: ISODateTimeString;
  createdAt: ISODateTimeString;
  ipAddress: string | null;
  userAgent: string | null;
}

// ─── Request / Response DTOs ──────────────────────────────────────────────────

export interface RegisterRequestDTO {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
  totpCode?: string;
}

export interface AuthResponseDTO {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODateTimeString;
}

export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken: string;
  expiresAt: ISODateTimeString;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequestDTO {
  token: string;
}

export interface ResendVerificationRequestDTO {
  email: string;
}

export interface SetupTotpResponseDTO {
  qrCodeDataUrl: string;
  secret: string;
  backupCodes: string[];
}

export interface VerifyTotpRequestDTO {
  code: string;
}

export interface DisableTotpRequestDTO {
  password: string;
  code: string;
}

export interface GoogleOAuthCallbackDTO {
  code: string;
  state: string;
  codeVerifier: string;
}

export interface UpdateProfileRequestDTO {
  displayName?: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}

export interface UpdateAvatarResponseDTO {
  avatarUrl: string;
}

export interface VoyageCoinTransaction {
  id: UUID;
  userId: UUID;
  amount: number;
  type: 'earn' | 'spend' | 'refund' | 'expire';
  description: string;
  referenceId: string | null;
  referenceType: string | null;
  balanceAfter: number;
  createdAt: ISODateTimeString;
}

export interface VoyageCoinBalance {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  expiringAmount: number;
  expiringAt: ISODateTimeString | null;
}
