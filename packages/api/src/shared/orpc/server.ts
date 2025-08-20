import { os } from '@orpc/server';

export interface WSServerContext {
	// @ts-expect-error
	getAllClients: () => WebSocket[];
	broadcast: (message: string) => void;
	send: (message: string) => void;
	close: () => void;
	onOpen: () => void;
	onClose: () => void;
	onError: (error: Error) => void;
}

export const base = os.$context<WSServerContext>();
