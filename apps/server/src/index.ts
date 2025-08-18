import { appRouter, RPCHandler } from '@vero/api';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import { initWebSocketServer } from './websocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const orpcHandler = new RPCHandler(appRouter);

app.use('/api*', async (req, res) => {
	const result = await orpcHandler.handle(req, res, {
		context: { headers: req.headers },
	});

	if (!result.matched) {
		res.status(404).json({ error: 'Procedure not found' });
	}
});

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

initWebSocketServer(WS_PORT);

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
	console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
});
