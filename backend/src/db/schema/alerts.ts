import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const priceAlerts = pgTable(
  'price_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    origin: varchar('origin', { length: 3 }).notNull(),
    destination: varchar('destination', { length: 3 }).notNull(),
    departDateFrom: varchar('depart_date_from', { length: 10 }).notNull(),
    departDateTo: varchar('depart_date_to', { length: 10 }).notNull(),
    targetPriceAmount: integer('target_price_amount').notNull(),
    targetPriceCurrency: varchar('target_price_currency', { length: 3 }).notNull().default('INR'),
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
    userIdx: index('pa_user_idx').on(t.userId),
    activeIdx: index('pa_active_idx').on(t.isActive),
    routeIdx: index('pa_route_idx').on(t.origin, t.destination),
  }),
);

export const priceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  user: one(users, { fields: [priceAlerts.userId], references: [users.id] }),
}));
