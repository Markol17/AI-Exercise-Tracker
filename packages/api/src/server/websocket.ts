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
				} else if (message.type === 'session_start') {
					handleSessionStart(clientId, message);
				} else if (message.type === 'session_end') {
					handleSessionEnd(clientId, message);
				} else if (message.type === 'exercise_stats') {
					handleExerciseStats(clientId, message);
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
		
		if (message.sessionId) {
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
		} else {
			console.log(`📱 Client ${clientId} registered as ${message.role} (no session yet)`);
		}
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

// Handle session start message - forward to perception app
function handleSessionStart(clientId: string, message: any) {
	const { sessionId, exercise, memberId } = message;
	console.log(`🚀 Session start: ${sessionId} for member ${memberId}, exercise: ${exercise}`);
	
	// Forward to all perception clients (they will filter by sessionId if needed)
	for (const [otherClientId, connection] of connections.entries()) {
		if (connection.role === 'perception') {
			connection.ws.send(JSON.stringify({
				type: 'session_start',
				sessionId,
				exercise,
				memberId,
				timestamp: new Date().toISOString(),
			}));
			console.log(`✅ Forwarded session start to perception client ${otherClientId}`);
			
			// Update the perception client's sessionId
			connection.sessionId = sessionId;
		}
	}
}

// Handle session end message - forward to perception app
function handleSessionEnd(clientId: string, message: any) {
	const { sessionId } = message;
	console.log(`🛑 Session end: ${sessionId}`);
	
	// Forward to all perception clients in this session
	for (const [otherClientId, connection] of connections.entries()) {
		if (connection.role === 'perception' && connection.sessionId === sessionId) {
			connection.ws.send(JSON.stringify({
				type: 'session_end',
				sessionId,
				timestamp: new Date().toISOString(),
			}));
			console.log(`✅ Forwarded session end to perception client ${otherClientId}`);
		}
	}
}

// Handle exercise stats from perception app
function handleExerciseStats(clientId: string, message: any) {
	const connection = connections.get(clientId);
	if (!connection?.sessionId) {
		return;
	}
	
	const { sessionId, stats } = message;
	
	// Forward stats to all mobile clients in this session
	for (const [otherClientId, otherConnection] of connections.entries()) {
		if (otherConnection.role === 'mobile' && otherConnection.sessionId === sessionId) {
			otherConnection.ws.send(JSON.stringify({
				type: 'exercise_stats',
				sessionId,
				stats,
				timestamp: new Date().toISOString(),
			}));
		}
	}
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
