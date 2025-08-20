import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import {
	appRouter,
	initWebSocketServer,
	onError,
	OpenAPIHandler,
	RPCHandler,
	SmartCoercionPlugin,
	ZodToJsonSchemaConverter,
} from '@vero/api/server';
import { allContracts } from '@vero/api/shared';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

app.use(cors());

const rpcHandler = new RPCHandler(appRouter);

const zodConverter = new ZodToJsonSchemaConverter();
const openAPIHandler = new OpenAPIHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
	plugins: [
		new SmartCoercionPlugin({
			schemaConverters: [zodConverter],
		}),
		new OpenAPIReferencePlugin({
			schemaConverters: [zodConverter],
			specGenerateOptions: {
				info: {
					title: 'Vero Wellness API',
					version: '1.0.0',
					description: 'API for managing gym members, sessions, and workout data',
				},
				commonSchemas: {
					...Object.fromEntries(Object.entries(allContracts).map(([key, value]) => [key, { schema: value }])),
				},
				security: [{ bearerAuth: [] }],
				components: {
					securitySchemes: {
						bearerAuth: {
							type: 'http',
							scheme: 'bearer',
						},
					},
				},
			},
			docsConfig: {
				authentication: {
					securitySchemes: {
						bearerAuth: {
							token: 'default-token',
						},
					},
				},
			},
		}),
	],
});

app.use('/rpc*', async (req, res, next) => {
	const { matched } = await rpcHandler.handle(req, res, {
		prefix: '/rpc',
	});

	if (matched) {
		return;
	}

	next();
});

app.use('/api*', async (req, res, next) => {
	const { matched } = await openAPIHandler.handle(req, res, {
		prefix: '/api',
	});
	if (matched) {
		return;
	}

	next();
});

initWebSocketServer(WS_PORT);

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`OpenAPI docs running on http://localhost:${PORT}/api`);
	console.log(`RPC server running on http://localhost:${PORT}/rpc`);
	console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
});
