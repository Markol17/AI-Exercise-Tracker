import { os } from '@orpc/server';

export const healthRouter = {
	check: os.handler(async () => ({
		status: 'healthy',
		timestamp: new Date(),
		version: '1.0.0',
	})),
};
