import { AppRouter } from 'src/router/root';
import { createAPIClient } from '..';

// Default API URL - can be overridden via environment variables
const DEFAULT_API_URL = 'http://localhost:3000/api';

// Get API URL from environment or use default
const getApiUrl = () => {
	// For React Native/Expo
	if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}

	// For Node.js server
	if (typeof process !== 'undefined' && process.env?.API_URL) {
		return process.env.API_URL;
	}

	return DEFAULT_API_URL;
};

export const api = createAPIClient<AppRouter>(getApiUrl());
export type ApiClient = typeof api;
