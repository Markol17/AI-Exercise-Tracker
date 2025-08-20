import { useCreateSession, useEndSession, useRealtimeEvents } from '@/hooks/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
	// TODO: Replace with proper state management (not Zustand)
	// This will be implemented with better auth in the @vero/auth package
	const [currentSession, setCurrentSession] = useState<any>(null);
	const [currentMember, setCurrentMember] = useState<any>(null);

	// Real-time events using WebSocket
	const { events, isConnected, error, clearEvents, triggerTest } = useRealtimeEvents();

	const createSessionMutation = useCreateSession();
	const endSessionMutation = useEndSession();

	const startNewSession = async () => {
		if (!currentMember) {
			Alert.alert('Error', 'Please select a member first');
			return;
		}

		try {
			const session = await createSessionMutation.mutateAsync({
				memberId: currentMember.id,
			});
			setCurrentSession(session);
			Alert.alert('Session Started', 'New session created successfully');
		} catch (error) {
			Alert.alert('Error', 'Failed to start session');
		}
	};

	const endCurrentSession = async () => {
		if (!currentSession) return;

		try {
			await endSessionMutation.mutateAsync({ sessionId: currentSession.id });
			setCurrentSession(null);
			Alert.alert('Session Ended', 'Session ended successfully');
		} catch (error) {
			Alert.alert('Error', 'Failed to end session');
		}
	};

	const goToMembers = () => {
		router.push('/members');
	};

	const goToSession = () => {
		router.push('/session');
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Vero Wellness</Text>

				{/* Connection Status */}
				<View style={[styles.statusCard, isConnected ? styles.connected : styles.disconnected]}>
					<Text style={styles.statusText}>{isConnected ? '🟢 Real-time Connected' : '🔴 Real-time Disconnected'}</Text>
					<Text style={styles.debugText}>WebSocket | Events: {events.length}</Text>
					{error && <Text style={styles.errorText}>Error: {error}</Text>}
					<TouchableOpacity style={styles.testButton} onPress={triggerTest}>
						<Text style={styles.testButtonText}>🧪 Test Event Stream</Text>
					</TouchableOpacity>
				</View>

				{/* Current Member */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Current Member</Text>
					{currentMember ? (
						<View>
							<Text style={styles.memberName}>{currentMember.name}</Text>
							{currentMember.email && <Text style={styles.memberEmail}>{currentMember.email}</Text>}
						</View>
					) : (
						<Text style={styles.noMember}>No member selected</Text>
					)}
					<TouchableOpacity style={styles.selectButton} onPress={goToMembers}>
						<Text style={styles.selectButtonText}>{currentMember ? 'Change Member' : 'Select Member'}</Text>
					</TouchableOpacity>
				</View>

				{/* Current Session */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Current Session</Text>
					{currentSession ? (
						<View>
							<Text style={styles.sessionInfo}>Active Session</Text>
							<Text style={styles.sessionDetail}>
								Started: {new Date(currentSession.startedAt).toLocaleTimeString()}
							</Text>
							<TouchableOpacity
								style={styles.endButton}
								onPress={endCurrentSession}
								disabled={endSessionMutation.isPending}>
								<Text style={styles.endButtonText}>{endSessionMutation.isPending ? 'Ending...' : 'End Session'}</Text>
							</TouchableOpacity>
						</View>
					) : (
						<View>
							<Text style={styles.noSession}>No active session</Text>
							<TouchableOpacity
								style={[styles.startButton, !currentMember && styles.disabledButton]}
								onPress={startNewSession}
								disabled={!currentMember || createSessionMutation.isPending}>
								<Text style={styles.startButtonText}>
									{createSessionMutation.isPending ? 'Starting...' : 'Start Session'}
								</Text>
							</TouchableOpacity>
						</View>
					)}
				</View>

				{/* Quick Actions */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Quick Actions</Text>
					<TouchableOpacity
						style={[styles.actionButton, !currentSession && styles.disabledButton]}
						onPress={goToSession}
						disabled={!currentSession}>
						<Text style={styles.actionButtonText}>View Session Details</Text>
					</TouchableOpacity>
				</View>

				{/* Real-time Events */}
				<View style={styles.card}>
					<View style={styles.eventsHeader}>
						<Text style={styles.cardTitle}>Real-time Events ({events.length})</Text>
						{events.length > 0 && (
							<TouchableOpacity style={styles.clearButton} onPress={clearEvents}>
								<Text style={styles.clearButtonText}>Clear</Text>
							</TouchableOpacity>
						)}
					</View>

					{events.length === 0 ? (
						<View style={styles.noEventsContainer}>
							<Text style={styles.noEventsText}>
								{isConnected ? '📡 Listening for real-time events...' : '🔌 Connecting to event stream...'}
							</Text>
							{error && <Text style={styles.errorText}>Error: {error}</Text>}
						</View>
					) : (
						<>
							{events
								.slice(-3)
								.reverse()
								.map((event, index) => (
									<View key={index} style={styles.eventItem}>
										<Text style={styles.eventType}>🔔 {event.type}</Text>
										<Text style={styles.eventData}>{JSON.stringify(event.data, null, 2)}</Text>
										<Text style={styles.eventTime}>
											{new Date(event.data?.timestamp || Date.now()).toLocaleTimeString()}
										</Text>
									</View>
								))}
							{events.length > 3 && <Text style={styles.moreEvents}>... and {events.length - 3} more events</Text>}
						</>
					)}
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
		marginBottom: 20,
		color: '#333',
	},
	statusCard: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
		alignItems: 'center',
	},
	connected: {
		backgroundColor: '#d4edda',
	},
	disconnected: {
		backgroundColor: '#f8d7da',
	},
	statusText: {
		fontSize: 16,
		fontWeight: '600',
	},
	card: {
		backgroundColor: 'white',
		padding: 16,
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
		marginBottom: 12,
		color: '#333',
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
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	startButtonText: {
		color: 'white',
		fontWeight: '600',
	},
	endButton: {
		backgroundColor: '#dc3545',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	endButtonText: {
		color: 'white',
		fontWeight: '600',
	},
	disabledButton: {
		backgroundColor: '#ccc',
	},
	actionButton: {
		backgroundColor: '#17a2b8',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	actionButtonText: {
		color: 'white',
		fontWeight: '600',
	},
	testButton: {
		backgroundColor: '#6c757d',
		padding: 8,
		borderRadius: 6,
		marginTop: 8,
	},
	testButtonText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '500',
	},
	eventsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	clearButton: {
		backgroundColor: '#dc3545',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
	},
	clearButtonText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '500',
	},
	eventItem: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 6,
		marginBottom: 8,
		borderLeftWidth: 3,
		borderLeftColor: '#28a745',
	},
	eventType: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333',
		marginBottom: 4,
	},
	eventData: {
		fontSize: 12,
		color: '#666',
		fontFamily: 'monospace',
		marginBottom: 4,
	},
	eventTime: {
		fontSize: 11,
		color: '#999',
		textAlign: 'right',
	},
	moreEvents: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center',
		fontStyle: 'italic',
		marginTop: 8,
	},
	errorText: {
		fontSize: 12,
		color: '#dc3545',
		marginTop: 4,
		textAlign: 'center',
	},
	noEventsContainer: {
		padding: 16,
		alignItems: 'center',
	},
	noEventsText: {
		fontSize: 14,
		color: '#666',
		textAlign: 'center',
		fontStyle: 'italic',
	},
	debugText: {
		fontSize: 11,
		color: '#888',
		textAlign: 'center',
		marginTop: 4,
	},
});
