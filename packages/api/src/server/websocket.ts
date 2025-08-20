import { WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

export function initWebSocketServer(port: number) {
	wss = new WebSocketServer({ port });

	wss.on('connection', (ws) => {
		const clientId = Math.random().toString(36).substr(2, 9);
		console.log(`📱 Client ${clientId} connected`);

		ws.send(
			JSON.stringify({
				type: 'connected',
				timestamp: new Date().toISOString(),
				message: 'WebSocket connected',
				clientId,
			})
		);

		ws.on('message', (data) => {
			try {
				const message = JSON.parse(data.toString());
				console.log(`📨 Received from ${clientId}:`, message);

				const enrichedMessage = {
					...message,
					timestamp: new Date().toISOString(),
					fromClient: clientId,
				};

				broadcastToAll(enrichedMessage);
			} catch (error) {
				console.error(`Failed to parse message from ${clientId}:`, error);
			}
		});

		ws.on('close', () => {
			console.log(`📱 Client ${clientId} disconnected`);
		});

		ws.on('error', (error) => {
			console.error(`📱 WebSocket error for client ${clientId}:`, error);
		});
	});

	return wss;
}

export function broadcastToAll(data: any) {
	if (!wss) {
		console.warn('WebSocket server not initialized');
		return;
	}

	const message = JSON.stringify(data);
	console.log(`📡 Broadcasting to ${wss.clients.size} clients:`, data);

	wss.clients.forEach((client) => {
		if (client.readyState === client.OPEN) {
			client.send(message);
		}
	});
}

export function getClientCount(): number {
	return wss?.clients.size || 0;
}
