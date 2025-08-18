import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { AppRouter } from 'src/router/root';
import { createAPIClient } from '..';

const DEFAULT_API_URL = 'http://localhost:3000/api';

// TODO: Improve this with env validation. Use t3-env
const getApiUrl = () => {
	if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
		return process.env.EXPO_PUBLIC_API_URL;
	}

	if (typeof process !== 'undefined' && process.env?.API_URL) {
		return process.env.API_URL;
	}

	return DEFAULT_API_URL;
};

export const apiClient = createAPIClient<AppRouter>(getApiUrl());
export const reactQueryApiClient = createTanstackQueryUtils(apiClient);
