// NOTE: Be careful to only export types or functions that are safe to be used on the client.
import { InferRouterInputs, InferRouterOutputs } from '@orpc/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { AppRouter } from '../server/router';
import { createAPIClient } from '../shared/orpc/client';

const apiClient = createAPIClient<AppRouter>();
export const reactQueryApiClient = createTanstackQueryUtils(apiClient);
export type RouterInput = InferRouterInputs<AppRouter>;
export type RouterOutput = InferRouterOutputs<AppRouter>;
export { RPCLink as RPCLinkWS } from '@orpc/client/websocket';
export { cleanupConnections, ClientType } from '../shared/orpc/client';
