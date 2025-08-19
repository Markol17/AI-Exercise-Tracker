import { createORPCClient, onError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import { type AnyRouter } from '@orpc/server';

export type { AnyRouter, RouterClient };

export function createAPIClient<TRouter extends AnyRouter>(apiUrl: string): RouterClient<TRouter> {
	const link = new RPCLink({
		url: apiUrl,
		headers: {
			'Content-Type': 'application/json',
		},
		interceptors: [
			onError((error) => {
				console.error(error);
			}),
		],
	});

	const client: RouterClient<TRouter> = createORPCClient(link);
	return client;
}
