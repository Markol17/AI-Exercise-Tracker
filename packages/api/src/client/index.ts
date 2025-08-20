// NOTE: Be careful to only export types or functions that are safe to be used on the client.
import { InferRouterInputs, InferRouterOutputs } from '@orpc/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { AppRouter } from '../server/router';
import { createApiClient } from '../shared/orpc/client';

const apiClient = createApiClient();
export const reactQueryApiClient = createTanstackQueryUtils(apiClient);
export type AppRouterInput = InferRouterInputs<AppRouter>;
export type AppRouterOutput = InferRouterOutputs<AppRouter>;
