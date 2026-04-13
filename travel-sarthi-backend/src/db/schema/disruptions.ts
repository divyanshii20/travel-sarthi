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
import { users } from './users';
import { trips } from './trips';

export const disruptionEvents = pgTable(
  'disruption_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    flightNumber: varchar('flight_number', { length: 20 }).notNull(),
    airline: varchar('airline', { length: 100 }).notNull(),
    origin: varchar('origin', { length: 3 }).notNull(),
    destination: varchar('destination', { length: 3 }).notNull(),
    scheduledDeparture: timestamp('scheduled_departure', { withTimezone: true }).notNull(),
    actualDeparture: timestamp('actual_departure', { withTimezone: true }),
    scheduledArrival: timestamp('scheduled_arrival', { withTimezone: true }).notNull(),
    estimatedArrival: timestamp('estimated_arrival', { withTimezone: true }),
    disruptionType: varchar('disruption_type', { length: 30 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull(),
    delayMinutes: integer('delay_minutes'),
    reason: text('reason'),
    dgcaRightsJson: jsonb('dgca_rights_json').notNull(),
    recoveryOptionsJson: jsonb('recovery_options_json').notNull().default([]),
    revisedItineraryJson: jsonb('revised_itinerary_json'),
    rawWebhookJson: jsonb('raw_webhook_json'),
    notificationSentAt: timestamp('notification_sent_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    flightIdx: index('de_flight_idx').on(t.flightNumber),
    userIdx: index('de_user_idx').on(t.userId),
    tripIdx: index('de_trip_idx').on(t.tripId),
    severityIdx: index('de_severity_idx').on(t.severity),
  }),
);

export const disruptionEventsRelations = relations(disruptionEvents, ({ one }) => ({
  user: one(users, { fields: [disruptionEvents.userId], references: [users.id] }),
  trip: one(trips, { fields: [disruptionEvents.tripId], references: [trips.id] }),
}));
