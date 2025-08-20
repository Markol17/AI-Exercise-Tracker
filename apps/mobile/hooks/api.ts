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

// Real-time events using ORPC streaming (Server-Sent Events)
export function useRealtimeEvents() {
	const [events, setEvents] = useState<any[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let abortController: AbortController | null = null;

		const startStream = async () => {
			try {
				setError(null);
				console.log('🔴 Starting event stream...');

				abortController = new AbortController();

				// Start the ORPC streaming endpoint
				const stream = await reactQueryApiClient.events.stream.call(undefined, {
					signal: abortController.signal,
				});

				setIsConnected(true);

				// Process the stream
				for await (const event of stream) {
					console.log('📨 Received event:', event);
					setEvents((prev) => [...prev, event]);
				}
			} catch (err: any) {
				if (err.name !== 'AbortError') {
					console.error('❌ Stream error:', err);
					setError(err.message || 'Stream connection failed');
					setIsConnected(false);
				}
			}
		};

		startStream();

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
