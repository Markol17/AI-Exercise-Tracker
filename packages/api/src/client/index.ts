import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { AppRouter } from '../server/router';
import { getApiUrl } from '../shared/config';
import { createAPIClient } from '../shared/orpc/orpc';

export const apiClient = createAPIClient<AppRouter>(getApiUrl());
export const reactQueryApiClient = createTanstackQueryUtils(apiClient);
