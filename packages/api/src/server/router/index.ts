import { healthRouter } from './health';
import { sessionsRouter } from './sessions';
import { usersRouter } from './users';

export const appRouter = {
	health: healthRouter,
	users: usersRouter,
	sessions: sessionsRouter,
};

export type AppRouter = typeof appRouter;
