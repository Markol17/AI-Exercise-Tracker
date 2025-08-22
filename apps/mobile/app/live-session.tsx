import { VideoStream } from '@/components/VideoStream';
import { useEndSession, useExerciseStats } from '@/hooks/api';
import { useWebRTCVideoStream } from '@/hooks/useWebRTCVideoStream';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export default function LiveSessionScreen() {
	// TODO: remove this when env validation is added
	if (!process.env.EXPO_PUBLIC_WS_URL) {
		throw new Error('EXPO_PUBLIC_WS_URL is not set');
	}

	const { sessionId, memberId, memberName, exercise } = useLocalSearchParams<{
		sessionId: string;
		memberId: string;
		memberName: string;
		exercise: string;
	}>();

	const [sessionStartTime] = useState<Date>(new Date());
	const [sessionDuration, setSessionDuration] = useState<string>('00:00');
	const endSessionMutation = useEndSession();

	const { currentExercise, repCount, plankDuration, shoulderTapCount, isConnected, connectionStatus } =
		useExerciseStats();

	// WebRTC video streaming with integrated WebSocket
	const { remoteStream, connectionState, isStreaming, startVideoStream, stopVideoStream, webSocketState } =
		useWebRTCVideoStream({
			sessionId: sessionId || '',
		});

	const { sendJsonMessage } = useWebSocket(process.env.EXPO_PUBLIC_WS_URL, {
		share: true,
		shouldReconnect: () => true,
	});

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

	// Send session start message once when ready
	useEffect(() => {
		if (webSocketState === ReadyState.OPEN && sessionId && exercise) {
			// Send session start message with exercise type
			sendJsonMessage({
				type: 'session_start',
				sessionId,
				exercise,
				memberId,
			});
		}
	}, [webSocketState, sessionId, exercise, memberId, sendJsonMessage]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			stopVideoStream();
		};
	}, [stopVideoStream]);

	const endSession = () => {
		Alert.alert('End Session', `Are you sure you want to end the session for ${memberName}?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'End Session',
				style: 'destructive',
				onPress: async () => {
					try {
						stopVideoStream();
						sendJsonMessage({
							type: 'session_end',
							sessionId,
						});
						if (sessionId) {
							await endSessionMutation.mutateAsync({ sessionId });
						}
						router.replace('/(tabs)');
					} catch (error) {
						console.error('Failed to end session:', error);
						Alert.alert('Error', 'Failed to end session properly');
					}
				},
			},
		]);
	};

	return (
		<View style={styles.container}>
			<View style={styles.cameraContainer}>
				{isStreaming && remoteStream ? (
					<View style={styles.videoContainer}>
						<VideoStream stream={remoteStream} style={styles.videoStream} objectFit='cover' mirror={false} />
						{/* Debug Overlay */}
						<View style={styles.debugOverlay}>
							<View style={styles.debugHeader}>
								<Text style={styles.debugTitle}>{exercise}</Text>
							</View>
							<View style={styles.debugStats}>
								{exercise === 'plank' ? (
									<>
										<View style={styles.debugStatItem}>
											<Text style={styles.debugStatValue}>{plankDuration.toFixed(1)}</Text>
											<Text style={styles.debugStatLabel}>seconds</Text>
										</View>
									</>
								) : exercise === 'shouldertap' ? (
									<>
										<View style={styles.debugStatItem}>
											<Text style={styles.debugStatValue}>{shoulderTapCount}</Text>
											<Text style={styles.debugStatLabel}>taps</Text>
										</View>
									</>
								) : (
									<>
										<View style={styles.debugStatItem}>
											<Text style={styles.debugStatValue}>{repCount}</Text>
											<Text style={styles.debugStatLabel}>reps</Text>
										</View>
									</>
								)}
								<View style={styles.debugStatItem}>
									<Text style={styles.debugStatValue}>{sessionDuration}</Text>
									<Text style={styles.debugStatLabel}>duration</Text>
								</View>
							</View>
						</View>
					</View>
				) : isConnected ? (
					<View style={styles.cameraFeed}>
						<View style={styles.cameraPlaceholder}>
							<Text style={styles.cameraPlaceholderText}>Connecting to Camera</Text>
							<Text style={styles.cameraPlaceholderSubtext}>WebRTC Status: {connectionState}</Text>
							<Text style={styles.cameraPlaceholderSubtext}>Exercise: {exercise}</Text>
							{webSocketState === ReadyState.OPEN && (
								<TouchableOpacity style={styles.retryButton} onPress={startVideoStream}>
									<Text style={styles.retryButtonText}>Retry Connection</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				) : (
					<View style={styles.cameraDisconnected}>
						<Text style={styles.disconnectedText}>Perception App Disconnected</Text>
						<Text style={styles.disconnectedSubtext}>Start the perception app to see live camera feed</Text>
					</View>
				)}
			</View>

			<TouchableOpacity style={styles.endSessionButton} onPress={endSession}>
				<Text style={styles.endSessionButtonText}>End Session</Text>
			</TouchableOpacity>
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
	exerciseType: {
		fontSize: 14,
		color: '#4CAF50',
		fontWeight: '600',
		marginBottom: 2,
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
	endSessionButton: {
		backgroundColor: '#dc3545',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		margin: 16,
		marginBottom: 24,
	},
	endSessionButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
	videoContainer: {
		width: '100%',
		height: '100%',
		position: 'relative',
	},
	videoStream: {
		width: '100%',
		height: '100%',
		backgroundColor: '#000',
	},
	debugOverlay: {
		position: 'absolute',
		top: 60,
		left: 10,
		right: 10,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		borderRadius: 8,
		padding: 12,
	},
	debugHeader: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	debugTitle: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	debugSession: {
		color: '#999',
		fontSize: 12,
	},
	debugStats: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	debugStatItem: {
		alignItems: 'center',
	},
	debugStatValue: {
		color: '#fff',
		fontSize: 24,
		fontWeight: 'bold',
	},
	debugStatLabel: {
		color: '#999',
		fontSize: 10,
		textTransform: 'uppercase',
		marginTop: 2,
	},
	retryButton: {
		backgroundColor: '#007AFF',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
		marginTop: 12,
	},
	retryButtonText: {
		color: 'white',
		fontSize: 14,
		fontWeight: '500',
	},
});
