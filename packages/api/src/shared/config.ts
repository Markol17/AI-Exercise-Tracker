const DEFAULT_API_URL = 'http://localhost:3000/api';

// TODO: Improve this with env validation. Use t3-env
export const getApiUrl = (): string => {
	if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}

	if (typeof process !== 'undefined' && process.env?.API_URL) {
		return process.env.API_URL;
	}

	return DEFAULT_API_URL;
};
