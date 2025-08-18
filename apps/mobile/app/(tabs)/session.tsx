import { useSessionEvents } from '@/hooks/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SessionScreen() {
	// TODO: Replace with proper state management (not Zustand)
	const [currentSession, setCurrentSession] = useState<any>(null);
	const [currentMember, setCurrentMember] = useState<any>(null);
	const [exercises] = useState(['Squat', 'Bench Press', 'Deadlift', 'Shoulder Press']);

	// Fetch session events using React Query
	const { data: eventsData, isLoading, error } = useSessionEvents(currentSession?.id || '', !!currentSession);
	const events = eventsData?.items || [];

	const startExerciseSet = (exercise: string) => {
		const setNumber = events.filter((e: any) => e.metadata?.exercise === exercise).length + 1;
		router.push({
			pathname: '/weight-entry',
			params: {
				sessionId: currentSession?.id || '',
				exercise,
				setNumber: setNumber.toString(),
			},
		});
	};

	if (!currentSession) {
		return (
			<View style={styles.noSessionContainer}>
				<Text style={styles.noSessionText}>No active session</Text>
				<Text style={styles.noSessionSubtext}>Start a session from the Home tab to begin tracking.</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.sessionTitle}>Active Session</Text>
				{currentMember && <Text style={styles.memberName}>{currentMember.name}</Text>}
				<Text style={styles.sessionTime}>Started: {new Date(currentSession.startedAt).toLocaleString()}</Text>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Exercises</Text>
				{exercises.map((exercise) => {
					const exerciseEvents = events.filter((e: any) => e.metadata?.exercise === exercise);
					const setCount = exerciseEvents.length;

					return (
						<View key={exercise} style={styles.exerciseCard}>
							<View style={styles.exerciseHeader}>
								<Text style={styles.exerciseName}>{exercise}</Text>
								<Text style={styles.setCount}>{setCount} sets</Text>
							</View>
							<TouchableOpacity style={styles.addSetButton} onPress={() => startExerciseSet(exercise)}>
								<Text style={styles.addSetButtonText}>Add Set</Text>
							</TouchableOpacity>
						</View>
					);
				})}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Recent Events</Text>
				{isLoading ? (
					<ActivityIndicator size='small' />
				) : error ? (
					<Text style={styles.noEvents}>Failed to load events</Text>
				) : events.length > 0 ? (
					events.slice(-10).map((event: any, index: number) => (
						<View key={index} style={styles.eventCard}>
							<Text style={styles.eventType}>{event.type}</Text>
							<Text style={styles.eventTime}>{new Date(event.timestamp).toLocaleTimeString()}</Text>
						</View>
					))
				) : (
					<Text style={styles.noEvents}>No events yet</Text>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	noSessionContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
	},
	noSessionText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#666',
		marginBottom: 8,
	},
	noSessionSubtext: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
	},
	header: {
		backgroundColor: 'white',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	sessionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	memberName: {
		fontSize: 16,
		color: '#4A90E2',
		marginBottom: 4,
	},
	sessionTime: {
		fontSize: 14,
		color: '#666',
	},
	section: {
		backgroundColor: 'white',
		marginTop: 16,
		padding: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 16,
	},
	exerciseCard: {
		borderWidth: 1,
		borderColor: '#e0e0e0',
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
	},
	exerciseHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	exerciseName: {
		fontSize: 16,
		fontWeight: '500',
	},
	setCount: {
		fontSize: 14,
		color: '#666',
	},
	addSetButton: {
		backgroundColor: '#28a745',
		padding: 8,
		borderRadius: 6,
		alignItems: 'center',
	},
	addSetButtonText: {
		color: 'white',
		fontWeight: '600',
	},
	eventCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	eventType: {
		fontSize: 14,
		fontWeight: '500',
	},
	eventTime: {
		fontSize: 12,
		color: '#666',
	},
	noEvents: {
		textAlign: 'center',
		color: '#666',
		padding: 16,
	},
});
