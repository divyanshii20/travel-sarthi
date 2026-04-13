import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { trips } from './trips';
import { users } from './users';

export const itineraries = pgTable(
  'itineraries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    destination: varchar('destination', { length: 255 }).notNull(),
    startDate: varchar('start_date', { length: 10 }).notNull(),
    endDate: varchar('end_date', { length: 10 }).notNull(),
    durationDays: integer('duration_days').notNull(),
    daysJson: jsonb('days_json').notNull().default([]),
    budgetJson: jsonb('budget_json').notNull(),
    generatedBy: varchar('generated_by', { length: 10 }).notNull().default('ai'),
    version: integer('version').notNull().default(1),
    isPublic: boolean('is_public').notNull().default(false),
    shareToken: varchar('share_token', { length: 64 }).unique(),
    generationPrompt: text('generation_prompt'),
    tokensUsed: integer('tokens_used'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tripIdx: index('itin_trip_idx').on(t.tripId),
    userIdx: index('itin_user_idx').on(t.userId),
  }),
);

export const itineraryGenerationCache = pgTable(
  'itinerary_generation_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cacheKey: varchar('cache_key', { length: 512 }).notNull().unique(),
    destination: varchar('destination', { length: 255 }).notNull(),
    startDate: varchar('start_date', { length: 10 }).notNull(),
    endDate: varchar('end_date', { length: 10 }).notNull(),
    itineraryJson: jsonb('itinerary_json').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    cacheKeyIdx: index('igc_cache_key_idx').on(t.cacheKey),
  }),
);

export const itinerariesRelations = relations(itineraries, ({ one }) => ({
  trip: one(trips, { fields: [itineraries.tripId], references: [trips.id] }),
  user: one(users, { fields: [itineraries.userId], references: [users.id] }),
}));
