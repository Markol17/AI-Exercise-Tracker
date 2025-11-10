import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
	const startNewSession = () => {
		router.push('/exercise-selection');
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.content}>
				{/* Quick Start */}
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Quick Start</Text>
					<Text style={styles.cardDescription}>Start a live workout session with AI pose detection</Text>
					<TouchableOpacity style={styles.startButton} onPress={startNewSession}>
						<Text style={styles.startButtonText}>Start New Session</Text>
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
	featuresList: {
		gap: 8,
	},
	feature: {
		fontSize: 14,
		color: '#555',
		lineHeight: 20,
	},
});
