import { pgTable, varchar, timestamp, jsonb, text, integer, real, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const members = pgTable('members', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  enrolledAt: timestamp('enrolled_at'),
  consentedAt: timestamp('consented_at'),
  faceEmbedding: text('face_embedding'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: index('email_idx').on(table.email),
  };
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  memberId: varchar('member_id', { length: 255 }).references(() => members.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    memberIdx: index('member_idx').on(table.memberId),
    startedAtIdx: index('started_at_idx').on(table.startedAt),
  };
});

export const events = pgTable('events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull().references(() => sessions.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  source: varchar('source', { length: 20 }).notNull(),
  confidence: real('confidence'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    sessionIdx: index('session_idx').on(table.sessionId),
    typeIdx: index('type_idx').on(table.type),
    timestampIdx: index('timestamp_idx').on(table.timestamp),
  };
});

export const weights = pgTable('weights', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull().references(() => sessions.id),
  memberId: varchar('member_id', { length: 255 }).references(() => members.id),
  setNumber: integer('set_number').notNull(),
  exercise: varchar('exercise', { length: 100 }).notNull(),
  value: real('value').notNull(),
  unit: varchar('unit', { length: 10 }).notNull(),
  source: varchar('source', { length: 20 }).notNull(),
  confidence: real('confidence'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    sessionIdx: index('weight_session_idx').on(table.sessionId),
    memberIdx: index('weight_member_idx').on(table.memberId),
    exerciseIdx: index('exercise_idx').on(table.exercise),
  };
});

export const membersRelations = relations(members, ({ many }) => ({
  sessions: many(sessions),
  weights: many(weights),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  member: one(members, {
    fields: [sessions.memberId],
    references: [members.id],
  }),
  events: many(events),
  weights: many(weights),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  session: one(sessions, {
    fields: [events.sessionId],
    references: [sessions.id],
  }),
}));

export const weightsRelations = relations(weights, ({ one }) => ({
  session: one(sessions, {
    fields: [weights.sessionId],
    references: [sessions.id],
  }),
  member: one(members, {
    fields: [weights.memberId],
    references: [members.id],
  }),
}));