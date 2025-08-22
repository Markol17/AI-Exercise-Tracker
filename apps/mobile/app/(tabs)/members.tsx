import { useCreateMember, useMembers } from '@/hooks/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MembersScreen() {
	const [newMemberName, setNewMemberName] = useState('');

	// Use React Query hooks
	const { data: membersData, isLoading, error } = useMembers();
	const members = membersData?.items || [];
	const createMemberMutation = useCreateMember();
	// const enrollMemberMutation = useEnrollMember();

	// const enrollMember = async (member: AppRouterOutput['members']['create']) => {
	// 	await enrollMemberMutation.mutateAsync({ memberId: member.id, photoData: '', consent: true });
	// };

	const createMember = async () => {
		if (!newMemberName.trim()) {
			Alert.alert('Error', 'Please enter a name');
			return;
		}

		try {
			await createMemberMutation.mutateAsync({ name: newMemberName });
			setNewMemberName('');
			Alert.alert('Success', 'Member created successfully');
		} catch {
			Alert.alert('Error', 'Failed to create member');
		}
	};

	const startSession = (member: any) => {
		// Navigate to exercise selection screen first
		router.push({
			pathname: '/exercise-selection',
			params: {
				memberId: member.id,
				memberName: member.name,
			},
		});
	};

	return (
		<View style={styles.container}>
			<FlatList
				data={members}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.memberCard}>
						<View style={styles.memberInfo}>
							<Text style={styles.memberName}>{item.name}</Text>
							{item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
						</View>
						<View style={styles.buttonContainer}>
							{/* <TouchableOpacity style={styles.enrollButton} onPress={() => enrollMember(item)}>
								<Text style={styles.enrollButtonText}>{item.enrolledAt ? 'Update' : 'Enroll'}</Text>
							</TouchableOpacity> */}
							<TouchableOpacity style={styles.startSessionButton} onPress={() => startSession(item)}>
								<Text style={styles.startSessionButtonText}>Start Session</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}
				ListEmptyComponent={
					<Text style={styles.emptyText}>
						{isLoading ? 'Loading members...' : error ? 'Failed to load members' : 'No members yet'}
					</Text>
				}
				refreshing={isLoading}
				onRefresh={() => {
					// React Query will automatically refetch when we invalidate
				}}
			/>
			{/* <View style={styles.createSection}>
				<TextInput
					style={styles.input}
					placeholder='Enter member name'
					value={newMemberName}
					onChangeText={setNewMemberName}
				/>
				<TouchableOpacity style={styles.createButton} onPress={createMember} disabled={createMemberMutation.isPending}>
					<Text style={styles.createButtonText}>
						{createMemberMutation.isPending ? 'Creating...' : 'Create Member'}
					</Text>
				</TouchableOpacity>
			</View> */}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	createSection: {
		backgroundColor: 'white',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
	},
	createButton: {
		backgroundColor: '#4A90E2',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	createButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	},
	memberCard: {
		backgroundColor: 'white',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 8,
	},
	memberInfo: {
		flex: 1,
	},
	memberName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	memberEmail: {
		fontSize: 14,
		color: '#666',
	},
	enrollStatus: {
		fontSize: 12,
		color: '#4CAF50',
		marginTop: 4,
	},
	enrollButton: {
		backgroundColor: '#28a745',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 6,
	},
	enrollButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 12,
	},
	startSessionButton: {
		backgroundColor: '#4A90E2',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 6,
	},
	startSessionButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 12,
	},
	emptyText: {
		textAlign: 'center',
		padding: 32,
		color: '#666',
	},
});
