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

export const trips = pgTable(
  'trips',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    destination: varchar('destination', { length: 255 }).notNull(),
    destinationCode: varchar('destination_code', { length: 3 }),
    coverImageUrl: text('cover_image_url'),
    status: varchar('status', { length: 30 }).notNull().default('planning'),
    visibility: varchar('visibility', { length: 20 }).notNull().default('private'),
    shareToken: varchar('share_token', { length: 64 }).unique(),
    startDate: varchar('start_date', { length: 10 }).notNull(),
    endDate: varchar('end_date', { length: 10 }).notNull(),
    travelersJson: jsonb('travelers_json').notNull(),
    comfortLevel: varchar('comfort_level', { length: 20 }).notNull().default('comfort'),
    totalBudgetAmount: integer('total_budget_amount').notNull(),
    totalBudgetCurrency: varchar('total_budget_currency', { length: 3 }).notNull().default('INR'),
    totalSpentAmount: integer('total_spent_amount').notNull().default(0),
    totalSavingsAmount: integer('total_savings_amount').notNull().default(0),
    flightBookingsJson: jsonb('flight_bookings_json').notNull().default([]),
    hotelBookingsJson: jsonb('hotel_bookings_json').notNull().default([]),
    activeItineraryId: uuid('active_itinerary_id'),
    isGroupTrip: boolean('is_group_trip').notNull().default(false),
    notes: text('notes'),
    tags: varchar('tags', { length: 50 }).array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('trips_user_idx').on(t.userId),
    statusIdx: index('trips_status_idx').on(t.status),
    shareTokenIdx: index('trips_share_token_idx').on(t.shareToken),
  }),
);

export const tripMembers = pgTable(
  'trip_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tripUserIdx: index('tm_trip_user_idx').on(t.tripId, t.userId),
  }),
);

export const tripsRelations = relations(trips, ({ one, many }) => ({
  owner: one(users, { fields: [trips.userId], references: [users.id] }),
  members: many(tripMembers),
  itineraries: many(itineraries),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, { fields: [tripMembers.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripMembers.userId], references: [users.id] }),
}));

// Forward declaration
import { itineraries } from './itineraries';
