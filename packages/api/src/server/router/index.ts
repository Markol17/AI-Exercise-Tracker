import { eventsRouter } from './events';
import { healthRouter } from './health';
import { membersRouter } from './members';
import { sessionsRouter } from './sessions';
import { weightsRouter } from './weights';

export const appRouter = {
	health: healthRouter,
	members: membersRouter,
	sessions: sessionsRouter,
	weights: weightsRouter,
	events: eventsRouter,
};

export type AppRouter = typeof appRouter;
