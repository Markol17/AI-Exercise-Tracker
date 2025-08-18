import type { Member } from '@vero/api/types/core';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStore } from '../../../mobile/stores/useStore';
import { useCreateMember, useEnrollMember, useMembers } from '../../src/hooks/api';

export default function MembersScreen() {
	const { setCurrentMember } = useStore();
	const [newMemberName, setNewMemberName] = useState('');

	// Use React Query hooks
	const { data: members = [], isLoading, error } = useMembers();
	const createMemberMutation = useCreateMember();
	const enrollMemberMutation = useEnrollMember();

	const createMember = async () => {
		if (!newMemberName.trim()) {
			Alert.alert('Error', 'Please enter a name');
			return;
		}

		try {
			await createMemberMutation.mutateAsync({ name: newMemberName });
			setNewMemberName('');
			Alert.alert('Success', 'Member created successfully');
		} catch (error) {
			Alert.alert('Error', 'Failed to create member');
		}
	};

	const selectMember = (member: Member) => {
		setCurrentMember(member);
		Alert.alert('Success', `Selected ${member.name}`);
		router.back();
	};

	const enrollIdentity = (member: Member) => {
		router.push(`/enrollment/${member.id}`);
	};

	return (
		<View style={styles.container}>
			<View style={styles.createSection}>
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
			</View>

			<FlatList
				data={members}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.memberCard}>
						<TouchableOpacity style={styles.memberInfo} onPress={() => selectMember(item)}>
							<Text style={styles.memberName}>{item.name}</Text>
							{item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
							{item.enrolledAt && <Text style={styles.enrollStatus}>✓ Identity Enrolled</Text>}
						</TouchableOpacity>
						<TouchableOpacity style={styles.enrollButton} onPress={() => enrollIdentity(item)}>
							<Text style={styles.enrollButtonText}>{item.enrolledAt ? 'Update' : 'Enroll'}</Text>
						</TouchableOpacity>
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
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
	},
	enrollButtonText: {
		color: 'white',
		fontWeight: '600',
	},
	emptyText: {
		textAlign: 'center',
		padding: 32,
		color: '#666',
	},
});
