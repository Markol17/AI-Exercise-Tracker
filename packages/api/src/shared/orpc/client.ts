import { createORPCClient, onError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { RouterClient } from '@orpc/server';
import { AppRouter } from '../../server/router';

const REST_URL = process.env.EXPO_PUBLIC_REST_URL || 'http://localhost:3000/rpc';

function createApiLink() {
	const appLink = new RPCLink({
		url: REST_URL,
		headers: {
			'Content-Type': 'application/json',
		},
		interceptors: [
			onError((error) => {
				console.error('API Error:', error);
			}),
		],
	});
	return appLink;
}

export function createApiClient() {
	const client: RouterClient<AppRouter> = createORPCClient(createApiLink());
	return client;
}
