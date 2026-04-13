import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  text,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const flightSearchCache = pgTable(
  'flight_search_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cacheKey: varchar('cache_key', { length: 512 }).notNull().unique(),
    origin: varchar('origin', { length: 3 }).notNull(),
    destination: varchar('destination', { length: 3 }).notNull(),
    departDate: varchar('depart_date', { length: 10 }).notNull(),
    returnDate: varchar('return_date', { length: 10 }),
    cabinClass: varchar('cabin_class', { length: 20 }).notNull(),
    adults: integer('adults').notNull(),
    children: integer('children').notNull().default(0),
    infants: integer('infants').notNull().default(0),
    resultsJson: jsonb('results_json').notNull(),
    resultCount: integer('result_count').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    cacheKeyIdx: index('fsc_cache_key_idx').on(t.cacheKey),
    routeIdx: index('fsc_route_idx').on(t.origin, t.destination, t.departDate),
  }),
);

export const pricePredictionCache = pgTable(
  'price_prediction_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cacheKey: varchar('cache_key', { length: 512 }).notNull().unique(),
    origin: varchar('origin', { length: 3 }).notNull(),
    destination: varchar('destination', { length: 3 }).notNull(),
    departDate: varchar('depart_date', { length: 10 }).notNull(),
    cabinClass: varchar('cabin_class', { length: 20 }).notNull(),
    predictionJson: jsonb('prediction_json').notNull(),
    signal: varchar('signal', { length: 20 }).notNull(),
    confidence: real('confidence').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    cacheKeyIdx: index('ppc_cache_key_idx').on(t.cacheKey),
  }),
);

export const fareAlerts = pgTable(
  'fare_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    origin: varchar('origin', { length: 3 }).notNull(),
    destination: varchar('destination', { length: 3 }).notNull(),
    departDateFrom: varchar('depart_date_from', { length: 10 }).notNull(),
    departDateTo: varchar('depart_date_to', { length: 10 }).notNull(),
    targetPrice: integer('target_price').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    cabinClass: varchar('cabin_class', { length: 20 }).notNull(),
    travelersJson: jsonb('travelers_json').notNull(),
    frequency: varchar('frequency', { length: 20 }).notNull().default('daily'),
    channelsJson: jsonb('channels_json').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),
    lastAlertSentAt: timestamp('last_alert_sent_at', { withTimezone: true }),
    triggerCount: integer('trigger_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('fa_user_idx').on(t.userId),
    activeIdx: index('fa_active_idx').on(t.isActive),
    routeIdx: index('fa_route_idx').on(t.origin, t.destination),
  }),
);

export const fareAlertsRelations = relations(fareAlerts, ({ one }) => ({
  user: one(users, { fields: [fareAlerts.userId], references: [users.id] }),
}));
