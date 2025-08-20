import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reactQueryApiClient } from '@vero/api';
import { useEffect, useState } from 'react';

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
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let abortController: AbortController | null = null;

		const connectWebSocket = () => {
			try {
				setError(null);
				console.log('🔗 Connecting to WebSocket...');

				const ws = new WebSocket('ws://192.168.1.103:3001');

				ws.onopen = () => {
					console.log('✅ WebSocket connected');
					setIsConnected(true);
				};

				ws.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);
						console.log('📨 WebSocket received:', JSON.stringify(data, null, 2));
						setEvents((prev) => {
							const newEvents = [...prev, data];
							console.log(`📊 Total events now: ${newEvents.length}`);
							return newEvents;
						});
					} catch (parseError) {
						console.warn('Failed to parse WebSocket message:', event.data, parseError);
					}
				};

				ws.onerror = (error) => {
					console.error('❌ WebSocket error:', error);
					setError('WebSocket connection error');
					setIsConnected(false);
				};

				ws.onclose = () => {
					console.log('🔴 WebSocket disconnected');
					setIsConnected(false);
				};

				// Store for cleanup
				abortController = { abort: () => ws.close() } as any;
			} catch (err: any) {
				console.error('❌ WebSocket connection failed:', err);
				setError(err.message || 'WebSocket connection failed');
				setIsConnected(false);
			}
		};

		connectWebSocket();

		return () => {
			if (abortController) {
				abortController.abort();
			}
			setIsConnected(false);
		};
	}, []);

	const clearEvents = () => setEvents([]);

	const triggerTest = async () => {
		try {
			const result = await reactQueryApiClient.events.test.call();
			console.log('✅ Test triggered:', result);
		} catch (error) {
			console.error('❌ Failed to trigger test:', error);
		}
	};

	return {
		events,
		isConnected,
		error,
		clearEvents,
		triggerTest,
	};
}
