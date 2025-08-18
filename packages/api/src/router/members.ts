import { db } from '@vero/db/index';
import { members } from '@vero/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { os } from '@orpc/server';
import {
	createMemberSchema,
	enrollIdentitySchema,
	listMembersSchema,
	stringIdSchema,
	updateMemberSchema,
} from '../orpc/contracts';

export const membersRouter = {
	create: os.input(createMemberSchema).handler(async ({ input }) => {
		const member = await db
			.insert(members)
			.values({
				id: nanoid(),
				name: input.name,
				email: input.email,
			})
			.returning();

		return member[0];
	}),

	update: os.input(updateMemberSchema).handler(async ({ input }) => {
		const { id, ...updateData } = input;

		const updated = await db
			.update(members)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(eq(members.id, id))
			.returning();

		return updated[0];
	}),

	getById: os.input(stringIdSchema).handler(async ({ input }) => {
		const member = await db.select().from(members).where(eq(members.id, input)).limit(1);

		return member[0] || null;
	}),

	list: os.input(listMembersSchema).handler(async ({ input }) => {
		const limit = input?.limit || 50;
		const offset = input?.offset || 0;

		const results = await db.select().from(members).limit(limit).offset(offset);

		return {
			items: results,
			limit,
			offset,
			total: results.length,
		};
	}),

	enrollIdentity: os.input(enrollIdentitySchema).handler(async ({ input }) => {
		const updated = await db
			.update(members)
			.set({
				faceEmbedding: input.photoData,
				enrolledAt: new Date(),
				consentedAt: input.consent ? new Date() : undefined,
				updatedAt: new Date(),
			})
			.where(eq(members.id, input.memberId))
			.returning();

		return updated[0];
	}),

	delete: os.input(stringIdSchema).handler(async ({ input }) => {
		await db.delete(members).where(eq(members.id, input));

		return { success: true };
	}),
};
