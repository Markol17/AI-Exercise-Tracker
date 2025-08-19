const DEFAULT_API_URL = 'http://localhost:3000/rpc';

// TODO: Improve this with env validation. Use t3-env
export const getApiUrl = (): string => {
	if (process.env?.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}

	if (process.env?.API_URL) {
		return process.env.API_URL;
	}

	return DEFAULT_API_URL;
};
