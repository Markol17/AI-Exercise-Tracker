import { useCreateSession } from '@/hooks/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const EXERCISES = [
	{ id: 'squat', name: 'Squats', description: 'Lower body strength' },
	{ id: 'pushup', name: 'Push-ups', description: 'Upper body strength' },
	{ id: 'lunges', name: 'Lunges', description: 'Single leg strength' },
	{ id: 'plank', name: 'Plank', description: 'Core stability' },
	{ id: 'shouldertap', name: 'Shoulder Taps', description: 'Core stability' },
];

export default function ExerciseSelectionScreen() {
	const { memberId, memberName } = useLocalSearchParams<{
		memberId: string;
		memberName: string;
	}>();

	const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
	const createSessionMutation = useCreateSession();

	const startSession = async () => {
		if (!selectedExercise) {
			Alert.alert('Select Exercise', 'Please select an exercise to track');
			return;
		}

		try {
			// Create session with member and exercise metadata
			const session = await createSessionMutation.mutateAsync({
				memberId,
				metadata: {
					exercise: selectedExercise,
					startedAt: new Date().toISOString(),
				},
			});

			// Navigate to live session with all required params
			router.replace({
				pathname: '/live-session',
				params: {
					sessionId: session.id,
					memberId: memberId,
					memberName: memberName,
					exercise: selectedExercise,
				},
			});
		} catch (error) {
			Alert.alert('Error', 'Failed to create session');
			console.error('Failed to create session:', error);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView style={styles.container}>
				<View style={styles.exerciseGrid}>
					{EXERCISES.map((exercise) => (
						<TouchableOpacity
							key={exercise.id}
							style={[styles.exerciseCard, selectedExercise === exercise.id && styles.exerciseCardSelected]}
							onPress={() => setSelectedExercise(exercise.id)}>
							<Text style={[styles.exerciseName, selectedExercise === exercise.id && styles.exerciseNameSelected]}>
								{exercise.name}
							</Text>
							<Text style={styles.exerciseDescription}>{exercise.description}</Text>
							{selectedExercise === exercise.id && (
								<View style={styles.selectedBadge}>
									<Text style={styles.selectedBadgeText}>✓ Selected</Text>
								</View>
							)}
						</TouchableOpacity>
					))}
				</View>

				<View style={styles.footer}>
					<TouchableOpacity
						style={[styles.startButton, !selectedExercise && styles.startButtonDisabled]}
						onPress={startSession}
						disabled={!selectedExercise || createSessionMutation.isPending}>
						<Text style={styles.startButtonText}>
							{createSessionMutation.isPending ? 'Starting...' : 'Start Session'}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
						<Text style={styles.cancelButtonText}>Cancel</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	subtitle: {
		padding: 16,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	subtitleText: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
	},
	exerciseGrid: {
		padding: 16,
		gap: 12,
	},
	exerciseCard: {
		backgroundColor: 'white',
		padding: 20,
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 2,
		borderColor: 'transparent',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	exerciseCardSelected: {
		borderColor: '#4A90E2',
		backgroundColor: '#f0f7ff',
	},
	exerciseIcon: {
		fontSize: 36,
		marginBottom: 12,
		textAlign: 'center',
	},
	exerciseName: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
		color: '#333',
		textAlign: 'center',
	},
	exerciseNameSelected: {
		color: '#4A90E2',
	},
	exerciseDescription: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
	},
	selectedBadge: {
		backgroundColor: '#4A90E2',
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 12,
		marginTop: 8,
		alignSelf: 'center',
	},
	selectedBadgeText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600',
	},
	footer: {
		padding: 20,
		gap: 12,
	},
	startButton: {
		backgroundColor: '#28a745',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	startButtonDisabled: {
		backgroundColor: '#ccc',
	},
	startButtonText: {
		color: 'white',
		fontSize: 18,
		fontWeight: 'bold',
	},
	cancelButton: {
		backgroundColor: 'white',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ddd',
	},
	cancelButtonText: {
		color: '#666',
		fontSize: 16,
		fontWeight: '600',
	},
});
