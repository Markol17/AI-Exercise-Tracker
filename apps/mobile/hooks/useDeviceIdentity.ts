import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { useEffect, useState } from 'react';

const FINGERPRINT_KEY = '@device_fingerprint';
const USER_ID_KEY = '@user_id';

interface DeviceIdentity {
	fingerprint: string;
	userId: string | null;
	isLoading: boolean;
}

async function generateFingerprint(): Promise<string> {
	const deviceInfo = {
		deviceName: Device.deviceName,
		brand: Device.brand,
		manufacturer: Device.manufacturer,
		modelName: Device.modelName,
		osName: Device.osName,
		osVersion: Device.osVersion,
		osBuildId: Device.osBuildId,
		platformApiLevel: Device.platformApiLevel,
		deviceYearClass: Device.deviceYearClass,
		installationId: Application.applicationId,
		timestamp: Date.now().toString(),
	};

	const deviceString = JSON.stringify(deviceInfo);

	const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, deviceString);

	return hash;
}

async function getOrCreateFingerprint(): Promise<string> {
	try {
		const storedFingerprint = await AsyncStorage.getItem(FINGERPRINT_KEY);

		if (storedFingerprint) {
			return storedFingerprint;
		}

		const newFingerprint = await generateFingerprint();

		await AsyncStorage.setItem(FINGERPRINT_KEY, newFingerprint);

		return newFingerprint;
	} catch (error) {
		console.error('Error getting/creating fingerprint:', error);
		throw error;
	}
}

async function getUserId(): Promise<string | null> {
	try {
		return await AsyncStorage.getItem(USER_ID_KEY);
	} catch (error) {
		console.error('Error getting user ID:', error);
		return null;
	}
}

async function setUserId(userId: string): Promise<void> {
	try {
		await AsyncStorage.setItem(USER_ID_KEY, userId);
	} catch (error) {
		console.error('Error setting user ID:', error);
		throw error;
	}
}

export function useDeviceIdentity(): DeviceIdentity {
	const [fingerprint, setFingerprint] = useState<string>('');
	const [userId, setUserIdState] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function initializeIdentity() {
			try {
				const [fp, uid] = await Promise.all([getOrCreateFingerprint(), getUserId()]);

				setFingerprint(fp);
				setUserIdState(uid);
			} catch (error) {
				console.error('Error initializing device identity:', error);
			} finally {
				setIsLoading(false);
			}
		}

		initializeIdentity();
	}, []);

	return {
		fingerprint,
		userId,
		isLoading,
	};
}

export async function persistUserId(userId: string): Promise<void> {
	await setUserId(userId);
}
