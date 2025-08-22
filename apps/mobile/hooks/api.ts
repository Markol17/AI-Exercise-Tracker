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
				console.log('🏋️ Exercise stats received:', data);

				if (data.type === 'exercise_stats') {
					const { exercise, data: exerciseData } = data;
					setCurrentExercise(exercise);

					if (exerciseData.type === 'rep_count') {
						setRepCount(exerciseData.count);
					} else if (exerciseData.type === 'duration') {
						setPlankDuration(exerciseData.duration);
					} else if (exerciseData.type === 'tap_count') {
						setShouldertapCount(exerciseData.count);
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
		if (currentExercise !== null) {
			const exerciseStateMap = {
				plank: {
					type: 'duration',
					setter: setPlankDuration,
				},
				shouldertap: {
					type: 'tap_count',
					setter: setShouldertapCount,
				},
				pushup: {
					type: 'rep_count',
					setter: setRepCount,
				},
				squat: {
					type: 'rep_count',
					setter: setRepCount,
				},
				lunges: {
					type: 'rep_count',
					setter: setRepCount,
				},
			} as const;

			Object.entries(exerciseStateMap).forEach(([exercise, { setter }]) => {
				if (exercise !== currentExercise) {
					setter(0);
				}
			});
		}
	}, [currentExercise]);

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
