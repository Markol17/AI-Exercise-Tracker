import { useCreateSession } from '@/hooks/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXERCISES = [
	{ id: 'squat', name: 'Squats', description: 'Lower body strength' },
	{ id: 'pushup', name: 'Push-ups', description: 'Upper body strength' },
	{ id: 'lunges', name: 'Lunges', description: 'Single leg strength' },
	{ id: 'plank', name: 'Plank', description: 'Core stability' },
	{ id: 'shouldertap', name: 'Shoulder Taps', description: 'Core stability' },
];

export default function ExerciseSelectionScreen() {
	const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
	const createSessionMutation = useCreateSession();

	const startSession = async () => {
		if (!selectedExercise) {
			Alert.alert('Select Exercise', 'Please select an exercise to track');
			return;
		}

		try {
			const session = await createSessionMutation.mutateAsync();
			router.replace({
				pathname: '/live-session',
				params: {
					sessionId: session.id,
					exercise: selectedExercise,
				},
			});
		} catch (error) {
			Alert.alert('Error', `Failed to create session ${error}`);
			console.error('Failed to create session:', error);
		}
	};

	return (
		<SafeAreaView style={styles.safeAreaContainer} edges={['bottom']}>
			<ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
						</TouchableOpacity>
					))}
				</View>
			</ScrollView>

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
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeAreaContainer: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 16,
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
	footer: {
		padding: 20,
		gap: 12,
		backgroundColor: '#f5f5f5',
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
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
