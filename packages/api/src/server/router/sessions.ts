import { db, events, sessions } from '@ai-exercise-tracker/db';
import { os } from '@orpc/server';
import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
	createSessionSchema,
	endSessionSchema,
	getSessionEventsSchema,
	getSessionsByMemberSchema,
	stringIdSchema,
} from '../../shared/orpc/contracts';

export const sessionsRouter = {
	create: os.input(createSessionSchema).handler(async ({ input }) => {
		const session = await db
			.insert(sessions)
			.values({
				id: nanoid(),
				memberId: input.memberId,
				metadata: input.metadata,
			})
			.returning();

		return session[0];
	}),

	end: os.input(endSessionSchema).handler(async ({ input }) => {
		const updated = await db
			.update(sessions)
			.set({
				endedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(sessions.id, input.sessionId))
			.returning();

		return updated[0];
	}),

	getById: os.input(stringIdSchema).handler(async ({ input }) => {
		const session = await db.select().from(sessions).where(eq(sessions.id, input)).limit(1);

		return session[0] || null;
	}),

	getActive: os.handler(async () => {
		const activeSessions = await db
			.select()
			.from(sessions)
			.where(isNull(sessions.endedAt))
			.orderBy(desc(sessions.startedAt));

		return activeSessions;
	}),

	getByMember: os.input(getSessionsByMemberSchema).handler(async ({ input }) => {
		const conditions = [eq(sessions.memberId, input.memberId)];

		if (input.startDate) {
			conditions.push(gte(sessions.startedAt, input.startDate));
		}
		if (input.endDate) {
			conditions.push(lte(sessions.startedAt, input.endDate));
		}

		const results = await db
			.select()
			.from(sessions)
			.where(and(...conditions))
			.orderBy(desc(sessions.startedAt))
			.limit(input.limit)
			.offset(input.offset);

		return {
			items: results,
			limit: input.limit,
			offset: input.offset,
			total: results.length,
		};
	}),

	getSessionEvents: os.input(getSessionEventsSchema).handler(async ({ input }) => {
		const conditions = [eq(events.sessionId, input.sessionId)];

		const results = await db
			.select()
			.from(events)
			.where(and(...conditions))
			.orderBy(desc(events.timestamp))
			.limit(input.limit)
			.offset(input.offset);

		const filteredResults = input.eventTypes ? results.filter((e) => input.eventTypes!.includes(e.type)) : results;

		return {
			items: filteredResults,
			limit: input.limit,
			offset: input.offset,
			total: filteredResults.length,
		};
	}),
};
