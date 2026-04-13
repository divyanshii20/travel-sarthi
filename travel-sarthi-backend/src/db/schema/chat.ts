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
import { users } from './users';
import { trips } from './trips';

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tripId: uuid('trip_id').references(() => trips.id, { onDelete: 'set null' }),
    tripContextJson: jsonb('trip_context_json'),
    mode: varchar('mode', { length: 30 }).notNull().default('standalone'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('cs_user_idx').on(t.userId),
    activeIdx: index('cs_active_idx').on(t.isActive),
  }),
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(),
    content: text('content').notNull(),
    category: varchar('category', { length: 50 }),
    actionCardsJson: jsonb('action_cards_json').notNull().default([]),
    placesMapCardJson: jsonb('places_map_card_json'),
    quickRepliesJson: jsonb('quick_replies_json').notNull().default([]),
    tokensUsed: integer('tokens_used'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index('cm_session_idx').on(t.sessionId),
    createdIdx: index('cm_created_idx').on(t.createdAt),
  }),
);

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, { fields: [chatSessions.userId], references: [users.id] }),
  trip: one(trips, { fields: [chatSessions.tripId], references: [trips.id] }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, { fields: [chatMessages.sessionId], references: [chatSessions.id] }),
}));
