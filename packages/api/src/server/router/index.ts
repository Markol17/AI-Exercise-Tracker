import { eventsRouter } from './events';
import { healthRouter } from './health';
import { membersRouter } from './members';
import { sessionsRouter } from './sessions';
import { weightsRouter } from './weights';

export const appRouter = {
	health: healthRouter,
	members: membersRouter,
	sessions: sessionsRouter,
	events: eventsRouter,
	weights: weightsRouter,
};

export type AppRouter = typeof appRouter;
