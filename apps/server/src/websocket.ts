import { nanoid } from 'nanoid';
import { WebSocket, WebSocketServer } from 'ws';

interface Client {
	id: string;
	ws: WebSocket;
	sessionId?: string;
	memberId?: string;
}

const clients = new Map<string, Client>();
let wss: WebSocketServer;

export function initWebSocketServer(port: number) {
	wss = new WebSocketServer({ port });

	wss.on('connection', (ws) => {
		const clientId = nanoid();
		const client: Client = { id: clientId, ws };

		clients.set(clientId, client);

		ws.on('message', (data) => {
			try {
				const message = JSON.parse(data.toString());

				if (message.type === 'subscribe') {
					client.sessionId = message.sessionId;
					client.memberId = message.memberId;

					ws.send(
						JSON.stringify({
							type: 'subscribed',
							sessionId: message.sessionId,
							memberId: message.memberId,
						})
					);
				}
			} catch (error) {
				console.error('WebSocket message error:', error);
			}
		});

		ws.on('close', () => {
			clients.delete(clientId);
		});

		ws.on('error', (error) => {
			console.error('WebSocket error:', error);
			clients.delete(clientId);
		});

		ws.send(
			JSON.stringify({
				type: 'connected',
				clientId,
			})
		);
	});
}

export function broadcastEvent(data: { sessionId?: string; memberId?: string; event: any }) {
	const message = JSON.stringify({
		type: 'event',
		...data,
	});

	clients.forEach((client) => {
		if (client.ws.readyState === WebSocket.OPEN) {
			if (data.sessionId && client.sessionId === data.sessionId) {
				client.ws.send(message);
			} else if (data.memberId && client.memberId === data.memberId) {
				client.ws.send(message);
			}
		}
	});
}

export function getConnectedClients() {
	return Array.from(clients.values()).map((client) => ({
		id: client.id,
		sessionId: client.sessionId,
		memberId: client.memberId,
	}));
}
