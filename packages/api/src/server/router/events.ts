import { os } from '@orpc/server';
import { db, events } from '@vero/db';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { eventSchema, getRecentEventsSchema, ingestEventsSchema } from '../../shared/orpc/contracts';

// Event emitter for real-time updates
import { EventEmitter } from 'events';
export const eventBroadcaster = new EventEmitter();

export const eventsRouter = {
	// Server-Sent Events stream for real-time updates
	stream: os.handler(async function* () {
		console.log('🔴 Starting event stream...');

		// Send initial connection message
		yield {
			type: 'connected',
			timestamp: new Date().toISOString(),
			message: 'Real-time event stream connected',
		};

		try {
			// Keep the stream alive and yield events
			while (true) {
				const event = await new Promise<any>((resolve) => {
					eventBroadcaster.once('broadcast', resolve);
				});

				console.log('📡 Yielding event:', event);
				yield event;
			}
		} catch (error) {
			console.error('🔴 Event stream error:', error);
		} finally {
			console.log('🔴 Event stream ended');
		}
	}),

	// Simple test endpoint
	test: os.handler(async () => {
		const testEvent = {
			type: 'test_broadcast',
			data: {
				message: 'Hello from server!',
				timestamp: new Date().toISOString(),
			},
		};

		// Broadcast the event
		eventBroadcaster.emit('broadcast', testEvent);

		return {
			success: true,
			message: 'Test event broadcasted',
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

			// Broadcast the event
			eventBroadcaster.emit('broadcast', weightEvent);

			return { success: true };
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

				// Broadcast the event in real-time
				eventBroadcaster.emit('broadcast', {
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

		// Broadcast the event in real-time
		eventBroadcaster.emit('broadcast', {
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
