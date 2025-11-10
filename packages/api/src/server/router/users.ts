import { db, eq, users } from '@ai-exercise-tracker/db';
import { os } from '@orpc/server';
import { nanoid } from 'nanoid';
import { getOrCreateUserSchema } from '../../shared/orpc/contracts';
import { loggingMiddleware } from '../logger';

export const usersRouter = {
	getOrCreate: os
		.use(loggingMiddleware)
		.input(getOrCreateUserSchema)
		.handler(async ({ input }) => {
			console.log('getOrCreate', input);
			const existingUsers = await db.select().from(users).where(eq(users.fingerprint, input.fingerprint)).limit(1);

			if (existingUsers.length > 0) {
				return existingUsers[0];
			}

			// Create new user if none exists
			const newUser = await db
				.insert(users)
				.values({
					id: nanoid(),
					fingerprint: input.fingerprint,
				})
				.returning();

			return newUser[0];
		}),
};
