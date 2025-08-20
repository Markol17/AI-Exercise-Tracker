import { createORPCClient, DynamicLink, onError } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { RPCLink as RPCLinkWS } from '@orpc/client/websocket';
import { AnyRouter, RouterClient } from '@orpc/server';

const REST_URL = 'http://192.168.1.103:3000/rpc';
const WS_URL = 'ws://192.168.1.103:3001';

export enum ClientType {
	REST,
	WS,
}

export interface ClientContext {
	type: ClientType;
}

let restLink: RPCLink<ClientContext> | null = null;
let wsLink: RPCLinkWS<ClientContext> | null = null;

function createRestLink() {
	if (!restLink) {
		restLink = new RPCLink({
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
	}
	return restLink;
}

function createWebSocketLink() {
	if (!wsLink) {
		// @ts-expect-error
		const websocket = new WebSocket(WS_URL);
		wsLink = new RPCLinkWS({
			websocket,
			interceptors: [
				onError((error) => {
					console.error(error);
				}),
			],
		});
	}
	return wsLink;
}

export function createAPIClient<TRouter extends AnyRouter>() {
	const dynamicLink = new DynamicLink<ClientContext>((options) => {
		if (options.context.type === ClientType.REST) {
			return createRestLink();
		}
		return createWebSocketLink();
	});
	const client: RouterClient<TRouter, ClientContext> = createORPCClient(dynamicLink);
	return client;
}

export function cleanupConnections() {
	if (wsLink) {
		wsLink = null;
	}
	if (restLink) {
		restLink = null;
	}
}
