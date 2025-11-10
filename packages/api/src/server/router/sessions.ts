import { and, db, desc, eq, gte, isNull, lte, sessions } from '@ai-exercise-tracker/db';
import { os } from '@orpc/server';
import { nanoid } from 'nanoid';
import {
	createSessionSchema,
	endSessionSchema,
	getSessionsByUserSchema,
	stringIdSchema,
} from '../../shared/orpc/contracts';
import { loggingMiddleware } from '../logger';

export const sessionsRouter = {
	create: os
		.use(loggingMiddleware)
		.input(createSessionSchema)
		.handler(async ({ input }) => {
			const session = await db
				.insert(sessions)
				.values({
					id: nanoid(),
					userId: input.userId,
				})
				.returning();

			return session[0];
		}),

	end: os
		.use(loggingMiddleware)
		.input(endSessionSchema)
		.handler(async ({ input }) => {
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

	getById: os
		.use(loggingMiddleware)
		.input(stringIdSchema)
		.handler(async ({ input }) => {
			const session = await db.select().from(sessions).where(eq(sessions.id, input)).limit(1);

			return session[0] || null;
		}),

	getActive: os.use(loggingMiddleware).handler(async () => {
		const activeSessions = await db
			.select()
			.from(sessions)
			.where(isNull(sessions.endedAt))
			.orderBy(desc(sessions.startedAt));

		return activeSessions;
	}),

	getByUser: os
		.use(loggingMiddleware)
		.input(getSessionsByUserSchema)
		.handler(async ({ input }) => {
			const conditions = [eq(sessions.userId, input.userId)];

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
};
