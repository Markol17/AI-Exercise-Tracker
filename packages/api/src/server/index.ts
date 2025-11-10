// NOTE: Be careful to only export types or functions that are safe to be used on the server.
export { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from '@orpc/json-schema';
export { OpenAPIHandler } from '@orpc/openapi/node';
export { onError } from '@orpc/server';
export { RPCHandler } from '@orpc/server/node';
export { RPCHandler as RPCHandlerWS } from '@orpc/server/ws';
export { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';

export { logger, loggingMiddleware } from './logger';
export * from './router';
export { initWebSocketServer } from './websocket';
