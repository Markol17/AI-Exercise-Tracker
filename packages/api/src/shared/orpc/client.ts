import { createORPCClient, onError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { RouterClient } from '@orpc/server';
import { AppRouter } from '../../server/router';

const REST_URL = 'http://192.168.1.103:3000/rpc';

function createApiLink() {
	const appLink = new RPCLink({
		url: REST_URL,
		headers: {
			'Content-Type': 'application/json',
		},
		interceptors: [
			onError((error) => {
				console.error(error);
			}),
		],
	});
	return appLink;
}

export function createApiClient() {
	const client: RouterClient<AppRouter> = createORPCClient(createApiLink());
	return client;
}
