import { os } from '@orpc/server';
import { db, events } from '@vero/db';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { eventSchema, getRecentEventsSchema, ingestEventsSchema } from '../../shared/orpc/contracts';

// Import WebSocket broadcasting function
import { broadcastToAll, getClientCount } from '../websocket';

export const eventsRouter = {
	// Simple test endpoint - broadcasts via WebSocket
	test: os.handler(async () => {
		const testEvent = {
			type: 'test_broadcast',
			data: {
				message: 'Hello from server!',
				timestamp: new Date().toISOString(),
			},
		};

		// Broadcast via WebSocket to all connected clients
		console.log(`🔥 Broadcasting test event to all WebSocket clients`);
		broadcastToAll(testEvent);

		return {
			success: true,
			message: `Test event broadcasted to ${getClientCount()} clients`,
			timestamp: new Date().toISOString(),
		};
	}),

	// Broadcast weight update
	broadcastWeightUpdate: os
		.input(
			z.object({
				sessionId: z.string(),
				weight: z.number(),
				memberId: z.string(),
			})
		)
		.handler(async ({ input }) => {
			const weightEvent = {
				type: 'weight_updated',
				data: {
					sessionId: input.sessionId,
					weight: input.weight,
					memberId: input.memberId,
					timestamp: new Date().toISOString(),
				},
			};

			// Broadcast via WebSocket to all connected clients
			console.log(`🏋️ Broadcasting weight update to all WebSocket clients`);
			broadcastToAll(weightEvent);

			return {
				success: true,
				broadcastedTo: getClientCount(),
			};
		}),

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

				// Broadcast the event in real-time via WebSocket
				broadcastToAll({
					type: 'event_ingested',
					data: insertedEvent,
				});

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

		// Broadcast the event in real-time via WebSocket
		broadcastToAll({
			type: 'event_created',
			data: insertedEvent,
		});

		return insertedEvent;
	}),

	getRecent: os.input(getRecentEventsSchema).handler(async ({ input }) => {
		const recentEvents = await db.select().from(events).orderBy(events.timestamp).limit(input.limit);

		return recentEvents;
	}),
};
