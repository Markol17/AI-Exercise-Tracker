import { os } from '@orpc/server';
import { db } from '@vero/db';
import { events } from '@vero/db/schema';
import { nanoid } from 'nanoid';
import { eventSchema, getRecentEventsSchema, ingestEventsSchema } from '../orpc/contracts';
// Note: broadcastEvent will need to be injected or handled by the server

export const eventsRouter = {
	ingest: os.input(ingestEventsSchema).handler(async ({ input }) => {
		if (input.authToken !== process.env.INGESTION_SECRET) {
			throw new Error('Unauthorized');
		}

		const insertedEvents = await Promise.all(
			input.events.map(async (event) => {
				const inserted = await db
					.insert(events)
					.values({
						id: nanoid(),
						type: event.type,
						sessionId: event.sessionId,
						timestamp: event.timestamp || new Date(),
						source: event.source,
						confidence: event.confidence,
						metadata: event.metadata,
					})
					.returning();

				const insertedEvent = inserted[0];

				// TODO: Broadcast event (will be handled by server layer)

				return insertedEvent;
			})
		);

		return {
			success: true,
			count: insertedEvents.length,
			events: insertedEvents,
		};
	}),

	create: os.input(eventSchema).handler(async ({ input }) => {
		const event = await db
			.insert(events)
			.values({
				id: nanoid(),
				type: input.type,
				sessionId: input.sessionId,
				timestamp: input.timestamp || new Date(),
				source: input.source,
				confidence: input.confidence,
				metadata: input.metadata,
			})
			.returning();

		const insertedEvent = event[0];

		// TODO: Broadcast event (will be handled by server layer)

		return insertedEvent;
	}),

	getRecent: os.input(getRecentEventsSchema).handler(async ({ input }) => {
		const recentEvents = await db.select().from(events).orderBy(events.timestamp).limit(input.limit);

		return recentEvents;
	}),
};
