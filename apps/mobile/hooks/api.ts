import { reactQueryApiClient } from '@ai-exercise-tracker/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { persistUserId, useDeviceIdentity } from './useDeviceIdentity';

export function useGetOrCreateUser() {
	return useMutation(
		reactQueryApiClient.users.getOrCreate.mutationOptions({
			onSuccess: async (data) => {
				// Persist the user ID locally
				await persistUserId(data.id);
			},
		})
	);
}

export function useCreateSession() {
	const queryClient = useQueryClient();
	const { userId, fingerprint, isLoading } = useDeviceIdentity();
	const getOrCreateUserMutation = useGetOrCreateUser();

	return useMutation({
		mutationFn: async () => {
			// Wait for device identity to be loaded
			if (isLoading) {
				throw new Error('Device identity is still loading');
			}

			let currentUserId = userId;

			// Get or create user if we don't have a userId yet
			if (!currentUserId && fingerprint) {
				const user = await getOrCreateUserMutation.mutateAsync({ fingerprint });
				currentUserId = user.id;
			}

			if (!currentUserId) {
				throw new Error('Failed to get or create user');
			}

			// Create session with the user ID
			const createMutationFn = reactQueryApiClient.sessions.create.mutationOptions().mutationFn;
			if (!createMutationFn) {
				throw new Error('Session create mutation not available');
			}
			const result = await createMutationFn({ userId: currentUserId }, undefined as any);
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessions'] });
		},
	});
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
