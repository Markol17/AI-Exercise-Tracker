import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reactQueryApiClient } from '@vero/api';
import React, { useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

// Members API hooks
export function useMembers() {
	return useQuery(reactQueryApiClient.members.list.queryOptions());
}

export function useCreateMember() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.members.create.mutationOptions({
			onSuccess: () => {
				// Invalidate members list to refetch after creating
				queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
			},
		})
	);
}

export function useEnrollMember() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.members.enrollIdentity.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
			},
		})
	);
}

// Sessions API hooks
export function useCreateSession() {
	return useMutation(reactQueryApiClient.sessions.create.mutationOptions({}));
}

export function useEndSession() {
	return useMutation(reactQueryApiClient.sessions.end.mutationOptions());
}

export function useSessionEvents(sessionId: string, enabled = true) {
	return useQuery({
		...reactQueryApiClient.sessions.getSessionEvents.queryOptions({
			input: {
				sessionId,
				limit: 100,
				offset: 0,
			},
		}),
		enabled: enabled && !!sessionId,
	});
}

// Weights API hooks
export function useRecordWeight() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.weights.record.mutationOptions({
			onSuccess: (_, variables) => {
				// Invalidate session events to show the new weight record
				queryClient.invalidateQueries({
					queryKey: ['sessions', variables.sessionId, 'events'],
				});
			},
		})
	);
}

export function useRealtimeEvents() {
	const [events, setEvents] = useState<any[]>([]);

	const WS_URL = 'ws://192.168.1.103:3001';

	const { sendMessage, lastMessage, readyState, getWebSocket } = useWebSocket(WS_URL, {
		onOpen: () => {
			console.log('✅ WebSocket connected');
		},
		onClose: () => {
			console.log('🔴 WebSocket disconnected');
		},
		onError: (error) => {
			console.error('❌ WebSocket error:', error);
		},
		shouldReconnect: (closeEvent) => {
			// Reconnect on all close events
			console.log('🔄 WebSocket reconnecting...');
			return true;
		},
		reconnectAttempts: 10,
		reconnectInterval: 3000,
	});

	React.useEffect(() => {
		if (lastMessage !== null) {
			try {
				const data = JSON.parse(lastMessage.data);
				console.log('📨 WebSocket received:', JSON.stringify(data, null, 2));
				setEvents((prev) => {
					const newEvents = [...prev, data];
					console.log(`📊 Total events now: ${newEvents.length}`);
					return newEvents;
				});
			} catch (parseError) {
				console.warn('Failed to parse WebSocket message:', lastMessage.data);
			}
		}
	}, [lastMessage]);

	const connectionStatus = {
		[ReadyState.CONNECTING]: 'Connecting',
		[ReadyState.OPEN]: 'Open',
		[ReadyState.CLOSING]: 'Closing',
		[ReadyState.CLOSED]: 'Closed',
		[ReadyState.UNINSTANTIATED]: 'Uninstantiated',
	}[readyState];

	const isConnected = readyState === 1; // WebSocket.OPEN

	const clearEvents = () => setEvents([]);

	const triggerTest = async () => {
		try {
			const result = await reactQueryApiClient.events.test.call();
			console.log('✅ Test triggered:', result);
		} catch (error) {
			console.error('❌ Failed to trigger test:', error);
		}
	};

	const sendWebSocketMessage = (message: any) => {
		if (readyState === 1) {
			sendMessage(JSON.stringify(message));
			console.log('📤 Sent WebSocket message:', message);
		} else {
			console.warn('WebSocket not connected, cannot send message');
		}
	};

	return {
		events,
		isConnected,
		connectionStatus,
		clearEvents,
		triggerTest,
		sendWebSocketMessage,
		webSocket: getWebSocket(),
	};
}
