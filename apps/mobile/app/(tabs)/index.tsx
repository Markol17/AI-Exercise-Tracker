import { useCreateSession, useEndSession } from '@/hooks/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
	// TODO: Replace with proper state management (not Zustand)
	// This will be implemented with better auth in the @vero/auth package
	const [currentSession, setCurrentSession] = useState<any>(null);
	const [currentMember, setCurrentMember] = useState<any>(null);
	const [wsConnected, setWsConnected] = useState<boolean>(false);

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
				<View style={[styles.statusCard, wsConnected ? styles.connected : styles.disconnected]}>
					<Text style={styles.statusText}>{wsConnected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
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
});
