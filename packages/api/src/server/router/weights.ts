import { db, weights } from '@ai-exercise-tracker/db';
import { os } from '@orpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
	getWeightsByMemberSchema,
	recordWeightSchema,
	stringIdSchema,
	updateWeightSchema,
} from '../../shared/orpc/contracts';

export const weightsRouter = {
	record: os.input(recordWeightSchema).handler(async ({ input }) => {
		const weight = await db
			.insert(weights)
			.values({
				id: nanoid(),
				sessionId: input.sessionId,
				memberId: input.memberId,
				setNumber: input.setNumber,
				exercise: input.exercise,
				value: input.value,
				unit: input.unit,
				source: input.source,
				confidence: input.confidence,
			})
			.returning();

		return weight[0];
	}),

	getBySession: os.input(stringIdSchema).handler(async ({ input }) => {
		const sessionWeights = await db
			.select()
			.from(weights)
			.where(eq(weights.sessionId, input))
			.orderBy(desc(weights.timestamp));

		return sessionWeights;
	}),

	getByMember: os.input(getWeightsByMemberSchema).handler(async ({ input }) => {
		const conditions = [eq(weights.memberId, input.memberId)];

		if (input.exercise) {
			conditions.push(eq(weights.exercise, input.exercise));
		}

		const results = await db
			.select()
			.from(weights)
			.where(and(...conditions))
			.orderBy(desc(weights.timestamp))
			.limit(input.limit)
			.offset(input.offset);

		return {
			items: results,
			limit: input.limit,
			offset: input.offset,
			total: results.length,
		};
	}),

	update: os.input(updateWeightSchema).handler(async ({ input }) => {
		const { id, ...updateData } = input;

		const updated = await db.update(weights).set(updateData).where(eq(weights.id, id)).returning();

		return updated[0];
	}),
};
