import { useExerciseStats } from '@/hooks/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LiveSessionScreen() {
	const { memberName } = useLocalSearchParams<{
		memberId: string;
		memberName: string;
	}>();

	const [sessionStartTime] = useState<Date>(new Date());
	const [sessionDuration, setSessionDuration] = useState<string>('00:00');

	// Real-time exercise stats from perception app
	const { currentExercise, repCount, plankDuration, shoulderTapCount, isConnected, connectionStatus } =
		useExerciseStats();

	// Update session duration every second
	useEffect(() => {
		const interval = setInterval(() => {
			const now = new Date();
			const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
			const minutes = Math.floor(diff / 60);
			const seconds = diff % 60;
			setSessionDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
		}, 1000);

		return () => clearInterval(interval);
	}, [sessionStartTime]);

	const endSession = () => {
		Alert.alert('End Session', `Are you sure you want to end the session for ${memberName}?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'End Session',
				style: 'destructive',
				onPress: () => {
					// TODO: Save session data to backend
					Alert.alert('Session Ended', `Session for ${memberName} has been completed.`, [
						{ text: 'OK', onPress: () => router.back() },
					]);
				},
			},
		]);
	};

	return (
		<View style={styles.container}>
			{/* Session Header */}
			<View style={styles.header}>
				<View style={styles.sessionInfo}>
					<Text style={styles.memberName}>{memberName}</Text>
					<Text style={styles.sessionTime}>Duration: {sessionDuration}</Text>
				</View>

				{/* Connection Status */}
				<View style={styles.connectionStatus}>
					<View style={[styles.statusDot, { backgroundColor: isConnected ? '#28a745' : '#dc3545' }]} />
					<Text style={[styles.statusText, { color: isConnected ? '#28a745' : '#dc3545' }]}>{connectionStatus}</Text>
				</View>
			</View>

			{/* Camera Feed */}
			<View style={styles.cameraContainer}>
				{isConnected ? (
					<View style={styles.cameraFeed}>
						{/* Placeholder for camera feed - would integrate with actual perception stream */}
						<View style={styles.cameraPlaceholder}>
							<Text style={styles.cameraPlaceholderText}>🎥 Live Camera Feed</Text>
							<Text style={styles.cameraPlaceholderSubtext}>
								Connect perception app to see live video with pose detection
							</Text>
						</View>
					</View>
				) : (
					<View style={styles.cameraDisconnected}>
						<Text style={styles.disconnectedText}>📱 Perception App Disconnected</Text>
						<Text style={styles.disconnectedSubtext}>Start the perception app to see live camera feed</Text>
					</View>
				)}
			</View>

			{/* Real-time Exercise Stats */}
			{currentExercise && (
				<View style={styles.exerciseStats}>
					<Text style={styles.exerciseTitle}>🏋️ {currentExercise.toUpperCase()}</Text>
					<View style={styles.statsRow}>
						{currentExercise === 'plank' ? (
							<View style={styles.statItem}>
								<Text style={styles.statValue}>{plankDuration.toFixed(1)}s</Text>
								<Text style={styles.statLabel}>Duration</Text>
							</View>
						) : currentExercise === 'shouldertap' ? (
							<View style={styles.statItem}>
								<Text style={styles.statValue}>{shoulderTapCount}</Text>
								<Text style={styles.statLabel}>Taps</Text>
							</View>
						) : (
							<View style={styles.statItem}>
								<Text style={styles.statValue}>{repCount}</Text>
								<Text style={styles.statLabel}>Reps</Text>
							</View>
						)}
					</View>
				</View>
			)}

			{/* Session Controls */}
			<View style={styles.controls}>
				<TouchableOpacity style={styles.endSessionButton} onPress={endSession}>
					<Text style={styles.endSessionButtonText}>End Session</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: 'rgba(0,0,0,0.8)',
	},
	sessionInfo: {
		flex: 1,
	},
	memberName: {
		fontSize: 18,
		fontWeight: 'bold',
		color: 'white',
		marginBottom: 4,
	},
	sessionTime: {
		fontSize: 14,
		color: '#ccc',
	},
	connectionStatus: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginRight: 6,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '500',
	},
	cameraContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cameraFeed: {
		width: '100%',
		height: '100%',
		backgroundColor: '#1a1a1a',
	},
	cameraPlaceholder: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	cameraPlaceholderText: {
		fontSize: 24,
		color: 'white',
		marginBottom: 10,
		textAlign: 'center',
	},
	cameraPlaceholderSubtext: {
		fontSize: 14,
		color: '#ccc',
		textAlign: 'center',
	},
	cameraDisconnected: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	disconnectedText: {
		fontSize: 20,
		color: '#dc3545',
		marginBottom: 10,
		textAlign: 'center',
	},
	disconnectedSubtext: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
	},
	exerciseStats: {
		backgroundColor: 'rgba(0,0,0,0.8)',
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: '#333',
	},
	exerciseTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#28a745',
		textAlign: 'center',
		marginBottom: 12,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	statItem: {
		alignItems: 'center',
		marginHorizontal: 20,
	},
	statValue: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#28a745',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: '#ccc',
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	controls: {
		padding: 16,
		backgroundColor: 'rgba(0,0,0,0.8)',
	},
	endSessionButton: {
		backgroundColor: '#dc3545',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	endSessionButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
