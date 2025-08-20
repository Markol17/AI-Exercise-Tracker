import { appRouter, RPCHandlerWS } from '@vero/api/server';
import WebSocket, { WebSocketServer } from 'ws';

export function initWebSocketServer(port: number) {
	const rpcHandlerWS = new RPCHandlerWS(appRouter);
	const wss = new WebSocketServer({ port });
	wss.on('connection', (ws) => {
		rpcHandlerWS.upgrade(ws, {
			context: {
				getAllClients: () => {
					return Array.from(wss.clients);
				},
				broadcast: (message: string) => {
					wss.clients.forEach((client) => {
						if (client.readyState === WebSocket.OPEN) {
							client.send(message);
						}
					});
				},
				send: (message: string) => {
					ws.send(message);
				},
				close: () => {
					ws.close();
				},
				onOpen: () => {
					console.log('WebSocket connection opened');
				},
				onClose: () => {
					console.log('WebSocket connection closed');
				},
				onError: (error: Error) => {
					console.error('WebSocket error:', error);
				},
			},
		});
	});
}
