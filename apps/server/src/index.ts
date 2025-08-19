import { appRouter, RPCHandler } from '@vero/api/server';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

app.use(cors());

const rpcHandler = new RPCHandler(appRouter);
// const openapiHandler = new OpenAPIHandler(appRouter);

app.use('/rpc*', async (req, res, next) => {
	const { matched } = await rpcHandler.handle(req, res, {
		prefix: '/rpc',
		context: {},
	});

	if (matched) {
		return;
	}

	next();
});

// app.use('/api', async (req, res, next) => {
// 	const { matched } = await openapiHandler.handle(req, res, {
// 		prefix: '/api',
// 	});
// 	if (matched) {
// 		return;
// 	}

// 	next();
// });

app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		timestamp: new Date(),
		endpoints: {
			api: '/api',
			websocket: `ws://localhost:${WS_PORT}`,
		},
	});
});

// initWebSocketServer(WS_PORT);

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
	console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
});
