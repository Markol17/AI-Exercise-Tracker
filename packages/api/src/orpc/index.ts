import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import { os, type AnyRouter } from '@orpc/server';

export const procedure = os;

export type { AnyRouter, RouterClient };

export function createAPIClient<TRouter extends AnyRouter>(apiUrl: string): RouterClient<TRouter> {
	const link = new RPCLink({
		url: apiUrl,
		headers: {
			'Content-Type': 'application/json',
		},
	});

	const client: RouterClient<TRouter> = createORPCClient(link);
	return client;
}

export { createORPCClient } from '@orpc/client';
export { RPCLink } from '@orpc/client/fetch';
export { RPCHandler } from '@orpc/server/node';

export * from './contracts';
