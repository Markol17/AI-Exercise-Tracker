import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function EnrollmentScreen() {
	const { memberId } = useLocalSearchParams();
	const [loading, setLoading] = useState(false);

	const enrollIdentity = async () => {
		try {
			setLoading(true);
			// TODO: Implement camera and face enrollment using @vero/api hooks
			// const enrollMutation = useEnrollMember();
			// await enrollMutation.mutateAsync({ memberId: memberId as string, imageData: '' });
			Alert.alert('Success', 'Identity enrolled successfully');
			router.back();
		} catch (error) {
			Alert.alert('Error', 'Failed to enroll identity');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Enroll Identity</Text>
				<Text style={styles.subtitle}>Member ID: {memberId}</Text>

				<View style={styles.cameraPlaceholder}>
					<Text style={styles.cameraText}>Camera view will be here</Text>
					<Text style={styles.cameraSubtext}>
						Integration with camera and face recognition will be implemented here
					</Text>
				</View>

				<TouchableOpacity style={styles.enrollButton} onPress={enrollIdentity} disabled={loading}>
					<Text style={styles.enrollButtonText}>{loading ? 'Enrolling...' : 'Take Photo & Enroll'}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
					<Text style={styles.cancelButtonText}>Cancel</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: 'center',
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
		marginBottom: 32,
	},
	cameraPlaceholder: {
		width: 300,
		height: 400,
		backgroundColor: '#ddd',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 32,
		padding: 20,
	},
	cameraText: {
		fontSize: 16,
		color: '#666',
		fontWeight: '600',
		marginBottom: 10,
	},
	cameraSubtext: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		fontStyle: 'italic',
	},
	enrollButton: {
		backgroundColor: '#28a745',
		paddingHorizontal: 40,
		paddingVertical: 15,
		borderRadius: 8,
		minWidth: 200,
		alignItems: 'center',
		marginBottom: 16,
	},
	enrollButtonText: {
		color: 'white',
		fontSize: 18,
		fontWeight: '600',
	},
	cancelButton: {
		backgroundColor: '#6c757d',
		paddingHorizontal: 40,
		paddingVertical: 15,
		borderRadius: 8,
		minWidth: 200,
		alignItems: 'center',
	},
	cancelButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
