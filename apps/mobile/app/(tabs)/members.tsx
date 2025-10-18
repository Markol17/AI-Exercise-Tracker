import { useCreateMember, useMembers } from '@/hooks/api';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MembersScreen() {
	const [newMemberName, setNewMemberName] = useState('');
	const [selectedMember, setSelectedMember] = useState<any>(null);

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

	const startSession = () => {
		if (!selectedMember) {
			Alert.alert('Error', 'Please select a member first');
			return;
		}

		// Navigate to exercise selection screen first
		router.push({
			pathname: '/exercise-selection',
			params: {
				memberId: selectedMember.id,
				memberName: selectedMember.name,
			},
		});
	};

	return (
		<SafeAreaView style={styles.container}>
			<FlatList
				data={members}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={[styles.memberCard, selectedMember?.id === item.id && styles.selectedMemberCard]}
						onPress={() => setSelectedMember(item)}>
						<View style={styles.memberInfo}>
							<Text style={[styles.memberName, selectedMember?.id === item.id && styles.selectedMemberName]}>
								{item.name}
							</Text>
							{item.email && (
								<Text style={[styles.memberEmail, selectedMember?.id === item.id && styles.selectedMemberEmail]}>
									{item.email}
								</Text>
							)}
						</View>
						{selectedMember?.id === item.id && (
							<View style={styles.selectedIndicator}>
								<Text style={styles.selectedIndicatorText}>✓</Text>
							</View>
						)}
					</TouchableOpacity>
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

			{/* Start Session Button */}
			<View style={styles.bottomSection}>
				<TouchableOpacity
					style={[styles.startSessionBottomButton, !selectedMember && styles.startSessionBottomButtonDisabled]}
					onPress={startSession}
					disabled={!selectedMember}>
					<Text
						style={[
							styles.startSessionBottomButtonText,
							!selectedMember && styles.startSessionBottomButtonTextDisabled,
						]}>
						{selectedMember ? `Start Session with ${selectedMember.name}` : 'Select a member to start session'}
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
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
	selectedMemberCard: {
		backgroundColor: '#E3F2FD',
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
	selectedMemberName: {
		color: '#1976D2',
	},
	memberEmail: {
		fontSize: 14,
		color: '#666',
	},
	selectedMemberEmail: {
		color: '#1976D2',
	},
	selectedIndicator: {
		backgroundColor: '#4A90E2',
		borderRadius: 12,
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	selectedIndicatorText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 14,
	},
	enrollStatus: {
		fontSize: 12,
		color: '#4CAF50',
		marginTop: 4,
	},
	emptyText: {
		textAlign: 'center',
		padding: 32,
		color: '#666',
	},
	bottomSection: {
		backgroundColor: 'white',
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
	},
	startSessionBottomButton: {
		backgroundColor: '#4A90E2',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	startSessionBottomButtonDisabled: {
		backgroundColor: '#ccc',
	},
	startSessionBottomButtonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	},
	startSessionBottomButtonTextDisabled: {
		color: '#888',
	},
});
