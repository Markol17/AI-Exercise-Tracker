import { procedure } from '../orpc';

export const healthRouter = {
	check: procedure.handler(async () => ({
		status: 'healthy',
		timestamp: new Date(),
		version: '1.0.0',
	})),
};
