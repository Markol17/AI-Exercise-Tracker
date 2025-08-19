// NOTE: Be careful to only export types or functions that are safe to be used on the server.
export { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from '@orpc/json-schema';
export { OpenAPIHandler } from '@orpc/openapi/node';
export { RPCHandler } from '@orpc/server/node';
export { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';

export * from './router';
