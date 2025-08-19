// NOTE: Be careful to only export types or functions that are safe to be used on the client.
import { InferRouterInputs, InferRouterOutputs } from '@orpc/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { AppRouter } from '../server/router';
import { getApiUrl } from '../shared/config';
import { createAPIClient } from '../shared/orpc/orpc';

export const apiClient = createAPIClient<AppRouter>(getApiUrl());
export const reactQueryApiClient = createTanstackQueryUtils(apiClient);
export type RouterInput = InferRouterInputs<AppRouter>;
export type RouterOutput = InferRouterOutputs<AppRouter>;
