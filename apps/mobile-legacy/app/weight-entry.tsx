import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRecordWeight } from '../src/hooks/api';

export default function WeightEntryScreen() {
	const { sessionId, exercise, setNumber } = useLocalSearchParams();
	const [weight, setWeight] = useState('');
	const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');

	const recordWeightMutation = useRecordWeight();

	const saveWeight = async () => {
		const weightValue = parseFloat(weight);
		if (isNaN(weightValue) || weightValue <= 0) {
			Alert.alert('Error', 'Please enter a valid weight');
			return;
		}

		try {
			await recordWeightMutation.mutateAsync({
				sessionId: sessionId as string,
				setNumber: parseInt(setNumber as string),
				exercise: exercise as string,
				value: weightValue,
				unit,
				source: 'manual',
			});
			Alert.alert('Success', 'Weight recorded successfully');
			router.back();
		} catch (error) {
			Alert.alert('Error', 'Failed to record weight');
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Enter Weight</Text>
				<Text style={styles.exercise}>{exercise}</Text>
				<Text style={styles.setInfo}>Set {setNumber}</Text>

				<TextInput
					style={styles.input}
					placeholder='Enter weight'
					keyboardType='numeric'
					value={weight}
					onChangeText={setWeight}
				/>

				<View style={styles.unitSelector}>
					<TouchableOpacity
						style={[styles.unitButton, unit === 'lbs' && styles.unitActive]}
						onPress={() => setUnit('lbs')}>
						<Text style={[styles.unitText, unit === 'lbs' && styles.unitActiveText]}>lbs</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.unitButton, unit === 'kg' && styles.unitActive]}
						onPress={() => setUnit('kg')}>
						<Text style={[styles.unitText, unit === 'kg' && styles.unitActiveText]}>kg</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity style={styles.saveButton} onPress={saveWeight} disabled={recordWeightMutation.isPending}>
					<Text style={styles.saveButtonText}>{recordWeightMutation.isPending ? 'Saving...' : 'Save Weight'}</Text>
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
		padding: 20,
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	exercise: {
		fontSize: 20,
		color: '#4A90E2',
		marginBottom: 5,
	},
	setInfo: {
		fontSize: 16,
		color: '#666',
		marginBottom: 30,
	},
	input: {
		width: '100%',
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		padding: 15,
		fontSize: 24,
		textAlign: 'center',
		marginBottom: 20,
	},
	unitSelector: {
		flexDirection: 'row',
		marginBottom: 30,
	},
	unitButton: {
		paddingHorizontal: 30,
		paddingVertical: 10,
		borderWidth: 1,
		borderColor: '#ddd',
		backgroundColor: 'white',
	},
	unitActive: {
		backgroundColor: '#4A90E2',
		borderColor: '#4A90E2',
	},
	unitText: {
		fontSize: 18,
		color: '#666',
	},
	unitActiveText: {
		color: 'white',
	},
	saveButton: {
		backgroundColor: '#28a745',
		paddingHorizontal: 40,
		paddingVertical: 15,
		borderRadius: 8,
		minWidth: 200,
		alignItems: 'center',
	},
	saveButtonText: {
		color: 'white',
		fontSize: 18,
		fontWeight: '600',
	},
});
