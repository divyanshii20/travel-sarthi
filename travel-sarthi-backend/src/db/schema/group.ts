import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  jsonb,
  text,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { trips } from './trips';
import { users } from './users';

export const groupVotes = pgTable(
  'group_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 30 }).notNull(),
    optionsJson: jsonb('options_json').notNull().default([]),
    status: varchar('status', { length: 20 }).notNull().default('open'),
    decidedOptionId: uuid('decided_option_id'),
    deadline: timestamp('deadline', { withTimezone: true }),
    allowMultiple: boolean('allow_multiple').notNull().default(false),
    anonymousVoting: boolean('anonymous_voting').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (t) => ({
    tripIdx: index('gv_trip_idx').on(t.tripId),
    statusIdx: index('gv_status_idx').on(t.status),
  }),
);

export const groupExpenses = pgTable(
  'group_expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tripId: uuid('trip_id').notNull().references(() => trips.id, { onDelete: 'cascade' }),
    paidBy: uuid('paid_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 30 }).notNull(),
    amountValue: integer('amount_value').notNull(),
    amountCurrency: varchar('amount_currency', { length: 3 }).notNull().default('INR'),
    splitsJson: jsonb('splits_json').notNull().default([]),
    splitMethod: varchar('split_method', { length: 20 }).notNull().default('equal'),
    receiptUrl: text('receipt_url'),
    date: varchar('date', { length: 10 }).notNull(),
    isSettled: boolean('is_settled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tripIdx: index('ge_trip_idx').on(t.tripId),
    paidByIdx: index('ge_paid_by_idx').on(t.paidBy),
  }),
);

export const groupVotesRelations = relations(groupVotes, ({ one }) => ({
  trip: one(trips, { fields: [groupVotes.tripId], references: [trips.id] }),
  creator: one(users, { fields: [groupVotes.createdBy], references: [users.id] }),
}));

export const groupExpensesRelations = relations(groupExpenses, ({ one }) => ({
  trip: one(trips, { fields: [groupExpenses.tripId], references: [trips.id] }),
  payer: one(users, { fields: [groupExpenses.paidBy], references: [users.id] }),
}));
