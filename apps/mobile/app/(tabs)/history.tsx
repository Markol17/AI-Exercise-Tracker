import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen() {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>History</Text>
			<Text style={styles.subtitle}>Session history will be displayed here</Text>
			<Text style={styles.note}>
				This screen will show past workout sessions, exercise history, and progress tracking.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#333',
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		marginBottom: 16,
		textAlign: 'center',
	},
	note: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		fontStyle: 'italic',
	},
});
