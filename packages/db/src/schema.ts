import { relations } from 'drizzle-orm';
import { index, pgTable, real, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: varchar('id', { length: 255 }).primaryKey(),
	fingerprint: varchar('fingerprint', { length: 255 }).notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable(
	'sessions',
	{
		id: varchar('id', { length: 255 }).primaryKey(),
		userId: varchar('user_id', { length: 255 })
			.notNull()
			.references(() => users.id),
		startedAt: timestamp('started_at').defaultNow().notNull(),
		endedAt: timestamp('ended_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => {
		return {
			userIdx: index('user_idx').on(table.userId),
			startedAtIdx: index('started_at_idx').on(table.startedAt),
		};
	}
);

export const sets = pgTable(
	'sets',
	{
		id: varchar('id', { length: 255 }).primaryKey(),
		exerciseType: varchar('type', { length: 50 }).notNull(),
		sessionId: varchar('session_id', { length: 255 })
			.notNull()
			.references(() => sessions.id),
		startedAt: timestamp('started_at').defaultNow().notNull(),
		endedAt: timestamp('ended_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => {
		return {
			sessionIdx: index('session_idx').on(table.sessionId),
			exerciseTypeIdx: index('type_idx').on(table.exerciseType),
		};
	}
);

export const reps = pgTable(
	'reps',
	{
		id: varchar('id', { length: 255 }).primaryKey(),
		setId: varchar('set_id', { length: 255 })
			.notNull()
			.references(() => sets.id),
		accuracy: real('accuracy').notNull(),
		startedAt: timestamp('started_at').defaultNow().notNull(),
		endedAt: timestamp('ended_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(table) => {
		return {
			setIdx: index('set_idx').on(table.setId),
		};
	}
);

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
	sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one, many }) => ({
	session: one(sessions, {
		fields: [sets.sessionId],
		references: [sessions.id],
	}),
	reps: many(reps),
}));

export const repsRelations = relations(reps, ({ one }) => ({
	set: one(sets, {
		fields: [reps.setId],
		references: [sets.id],
	}),
}));
