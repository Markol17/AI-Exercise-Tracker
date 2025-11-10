import { os } from '@orpc/server';
import { loggingMiddleware } from '../logger';

export const healthRouter = {
	check: os.use(loggingMiddleware).handler(async () => ({
		status: 'healthy',
		timestamp: new Date(),
		version: '1.0.0',
	})),
};
