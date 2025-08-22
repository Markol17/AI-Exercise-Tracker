import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reactQueryApiClient } from '@vero/api';
import { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export function useMembers() {
	return useQuery(reactQueryApiClient.members.list.queryOptions());
}

export function useCreateMember() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.members.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['members', 'list'] });
			},
		})
	);
}

export function useCreateSession() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.sessions.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['sessions'] });
			},
		})
	);
}

export function useEndSession() {
	const queryClient = useQueryClient();

	return useMutation(
		reactQueryApiClient.sessions.end.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['sessions'] });
			},
		})
	);
}

export function useExerciseStats() {
	if (!process.env.EXPO_PUBLIC_WS_URL) {
		throw new Error('EXPO_PUBLIC_WS_URL is not set');
	}

	const [currentExercise, setCurrentExercise] = useState<string | null>(null);
	const [repCount, setRepCount] = useState<number>(0);
	const [plankDuration, setPlankDuration] = useState<number>(0);
	const [shoulderTapCount, setShouldertapCount] = useState<number>(0);

	const { readyState } = useWebSocket(process.env.EXPO_PUBLIC_WS_URL, {
		share: true,
		filter: (message) => {
			return message.data.type === 'exercise_stats';
		},
		onMessage: (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'exercise_stats' && data.stats) {
					const { stats } = data;
					
					// Update current exercise
					if (stats.exercise) {
						setCurrentExercise(stats.exercise);
					}
					
					// Update rep count
					if (typeof stats.rep_count === 'number') {
						setRepCount(stats.rep_count);
					}
					
					// Update plank duration
					if (typeof stats.plank_duration === 'number') {
						setPlankDuration(stats.plank_duration);
					}
					
					// Update shoulder tap count
					if (typeof stats.shoulder_tap_count === 'number') {
						setShouldertapCount(stats.shoulder_tap_count);
					}
				}
			} catch (error) {
				console.error('Error parsing exercise stats:', error);
			}
		},
		shouldReconnect: () => true,
	});

	const isConnected = readyState === ReadyState.OPEN;
	const connectionStatus = {
		[ReadyState.CONNECTING]: 'Connecting',
		[ReadyState.OPEN]: 'Open',
		[ReadyState.CLOSING]: 'Closing',
		[ReadyState.CLOSED]: 'Closed',
		[ReadyState.UNINSTANTIATED]: 'Uninstantiated',
	}[readyState];

	useEffect(() => {
		// Reset stats when disconnected
		if (readyState !== ReadyState.OPEN) {
			setCurrentExercise(null);
			setRepCount(0);
			setPlankDuration(0);
			setShouldertapCount(0);
		}
	}, [readyState]);

	return {
		currentExercise,
		repCount,
		plankDuration,
		shoulderTapCount,
		isConnected,
		connectionStatus,
		stats: {
			pushup: repCount,
			squat: repCount,
			lunges: repCount,
			plank: plankDuration,
			shouldertap: shoulderTapCount,
		},
	};
}
