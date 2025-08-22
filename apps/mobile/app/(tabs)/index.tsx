import { useExerciseStats, useMembers } from '@/hooks/api';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
	// Get members data and real-time exercise stats
	const { data: membersData } = useMembers();
	const members = membersData?.items || [];
	const { currentExercise, isConnected } = useExerciseStats();

	const goToMembers = () => {
		router.push('/members');
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>🏋️ Vero Fitness Tracker</Text>
				<Text style={styles.subtitle}>AI-Powered Workout Sessions</Text>

				{/* Perception Status */}
				<View style={[styles.statusCard, isConnected ? styles.connected : styles.disconnected]}>
					<Text style={styles.statusText}>{isConnected ? '🟢 WebSocket Connected' : '🔴 WebSocket Disconnected'}</Text>
					<Text style={styles.statusSubtext}>
						{isConnected ? 'Ready for live exercise tracking' : 'Start perception app to connect'}
					</Text>
					{currentExercise && (
						<Text style={styles.currentExercise}>🎯 Current Exercise: {currentExercise.toUpperCase()}</Text>
					)}
				</View>

				{/* Quick Start */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>🚀 Quick Start</Text>
					<Text style={styles.cardDescription}>
						Select a member and start a live workout session with AI pose detection
					</Text>
					<TouchableOpacity style={styles.startButton} onPress={goToMembers}>
						<Text style={styles.startButtonText}>Start New Session</Text>
					</TouchableOpacity>
				</View>

				{/* Members Overview */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>👥 Members ({members.length})</Text>
					{members.length > 0 ? (
						<View>
							<Text style={styles.cardDescription}>
								{members.length} member{members.length !== 1 ? 's' : ''} ready for training
							</Text>
							<TouchableOpacity style={styles.membersButton} onPress={goToMembers}>
								<Text style={styles.membersButtonText}>Manage Members</Text>
							</TouchableOpacity>
						</View>
					) : (
						<View>
							<Text style={styles.cardDescription}>Create your first member to start training</Text>
							<TouchableOpacity style={styles.membersButton} onPress={goToMembers}>
								<Text style={styles.membersButtonText}>Add First Member</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>

				{/* Features */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>✨ Features</Text>
					<View style={styles.featuresList}>
						<Text style={styles.feature}>📹 Live camera feed with pose detection</Text>
						<Text style={styles.feature}>🔢 Real-time rep counting</Text>
						<Text style={styles.feature}>⏱️ Exercise duration tracking</Text>
						<Text style={styles.feature}>🎯 Multiple exercise types support</Text>
						<Text style={styles.feature}>📊 Session data recording</Text>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	content: {
		padding: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 8,
		color: '#333',
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 24,
		color: '#666',
		fontStyle: 'italic',
	},
	statusCard: {
		padding: 16,
		borderRadius: 12,
		marginBottom: 16,
		alignItems: 'center',
	},
	connected: {
		backgroundColor: '#d4edda',
		borderWidth: 2,
		borderColor: '#28a745',
	},
	disconnected: {
		backgroundColor: '#f8d7da',
		borderWidth: 2,
		borderColor: '#dc3545',
	},
	statusText: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	statusSubtext: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
	},
	currentExercise: {
		fontSize: 14,
		fontWeight: '600',
		color: '#28a745',
		marginTop: 8,
		textAlign: 'center',
	},
	card: {
		backgroundColor: 'white',
		padding: 20,
		borderRadius: 12,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
		color: '#333',
	},
	cardDescription: {
		fontSize: 14,
		color: '#666',
		marginBottom: 16,
		lineHeight: 20,
	},
	memberName: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	memberEmail: {
		fontSize: 14,
		color: '#666',
		marginBottom: 12,
	},
	noMember: {
		fontSize: 14,
		color: '#666',
		marginBottom: 12,
	},
	selectButton: {
		backgroundColor: '#4A90E2',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	selectButtonText: {
		color: 'white',
		fontWeight: '600',
	},
	sessionInfo: {
		fontSize: 16,
		fontWeight: '500',
		color: '#28a745',
		marginBottom: 4,
	},
	sessionDetail: {
		fontSize: 14,
		color: '#666',
		marginBottom: 12,
	},
	noSession: {
		fontSize: 14,
		color: '#666',
		marginBottom: 12,
	},
	startButton: {
		backgroundColor: '#28a745',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	startButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	},
	membersButton: {
		backgroundColor: '#4A90E2',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	membersButtonText: {
		color: 'white',
		fontWeight: '600',
	},
	featuresList: {
		gap: 8,
	},
	feature: {
		fontSize: 14,
		color: '#555',
		lineHeight: 20,
	},
});
