import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'support']);
export const authProviderEnum = pgEnum('auth_provider', ['email', 'google']);
export const twoFactorMethodEnum = pgEnum('two_factor_method', ['totp', 'sms', 'email']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('user'),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: timestamp('email_verification_expires', { withTimezone: true }),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires', { withTimezone: true }),
  isTwoFactorEnabled: boolean('is_two_factor_enabled').notNull().default(false),
  twoFactorMethod: twoFactorMethodEnum('two_factor_method'),
  totpSecret: varchar('totp_secret', { length: 255 }),
  totpBackupCodes: text('totp_backup_codes').array(),
  authProvider: authProviderEnum('auth_provider').notNull().default('email'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  voyageCoinBalance: integer('voyage_coin_balance').notNull().default(0),
  preferredCurrency: varchar('preferred_currency', { length: 3 }).notNull().default('INR'),
  preferredLanguage: varchar('preferred_language', { length: 10 }).notNull().default('en'),
  fcmToken: text('fcm_token'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const voyageCoinTransactions = pgTable('voyage_coin_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // earn | spend | refund | expire
  description: text('description').notNull(),
  referenceId: uuid('reference_id'),
  referenceType: varchar('reference_type', { length: 50 }),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  voyageCoinTransactions: many(voyageCoinTransactions),
}));

// Forward declaration — sessions defined in sessions.ts
import { sessions } from './sessions';
