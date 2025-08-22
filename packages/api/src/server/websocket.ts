import { WebSocket, WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

const connections: Map<string, { ws: WebSocket; sessionId?: string; role?: 'perception' | 'mobile' }> = new Map();

export function initWebSocketServer(port: number) {
	wss = new WebSocketServer({ port });

	wss.on('connection', (ws) => {
		const clientId = Math.random().toString(36).substr(2, 9);
		console.log(`📱 Client ${clientId} connected`);

		// Store connection
		connections.set(clientId, { ws });

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

				// Handle different message types
				if (message.type === 'register') {
					handleRegisterClient(clientId, message);
				} else if (message.type === 'webrtc_signaling') {
					handleWebRTCSignaling(clientId, message);
				} else {
					// Legacy message handling
					const enrichedMessage = {
						...message,
						timestamp: new Date().toISOString(),
						fromClient: clientId,
					};
					broadcastToAll(enrichedMessage);
				}
			} catch (error) {
				console.error(`Failed to parse message from ${clientId}:`, error);
			}
		});

		ws.on('close', () => {
			console.log(`📱 Client ${clientId} disconnected`);
			connections.delete(clientId);
		});

		ws.on('error', (error) => {
			console.error(`📱 WebSocket error for client ${clientId}:`, error);
		});
	});

	return wss;
}

// Handle client registration with session and role info
function handleRegisterClient(clientId: string, message: any) {
	const connection = connections.get(clientId);
	if (connection) {
		connection.sessionId = message.sessionId;
		connection.role = message.role;
		console.log(`📱 Client ${clientId} registered as ${message.role} for session ${message.sessionId}`);

		// Notify other clients in the same session
		broadcastToSession(
			message.sessionId,
			{
				type: 'client_registered',
				clientId,
				role: message.role,
				timestamp: new Date().toISOString(),
			},
			clientId
		);
	}
}

// Handle WebRTC signaling messages
function handleWebRTCSignaling(clientId: string, message: any) {
	const connection = connections.get(clientId);
	if (!connection?.sessionId) {
		console.warn(`Client ${clientId} not registered for any session`);
		return;
	}

	const { sessionId } = connection;
	const { targetRole, signaling } = message;

	console.log(`🔄 WebRTC signaling from ${clientId} (${connection.role}) to ${targetRole} in session ${sessionId}`);

	// Forward signaling message to target role in the same session
	for (const [otherClientId, otherConnection] of connections.entries()) {
		if (otherClientId !== clientId && otherConnection.sessionId === sessionId && otherConnection.role === targetRole) {
			otherConnection.ws.send(
				JSON.stringify({
					type: 'webrtc_signaling',
					fromRole: connection.role,
					signaling,
					timestamp: new Date().toISOString(),
				})
			);
			console.log(`✅ Forwarded signaling to ${otherClientId}`);
			return;
		}
	}

	console.warn(`No ${targetRole} client found in session ${sessionId}`);
}

// Broadcast to all clients in a specific session
function broadcastToSession(sessionId: string, data: any, excludeClientId?: string) {
	for (const [clientId, connection] of connections.entries()) {
		if (connection.sessionId === sessionId && clientId !== excludeClientId) {
			try {
				connection.ws.send(JSON.stringify(data));
			} catch (error) {
				console.error(`Failed to send to client ${clientId}:`, error);
			}
		}
	}
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
