import { z } from 'zod';

// User schemas
export const getOrCreateUserSchema = z.object({
	fingerprint: z.string(),
});

// Session schemas
export const createSessionSchema = z.object({
	userId: z.string(),
});

export const endSessionSchema = z.object({
	sessionId: z.string(),
});

export const getSessionsByUserSchema = z.object({
	userId: z.string(),
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

// Response schemas
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
	z.object({
		items: z.array(itemSchema),
		limit: z.number(),
		offset: z.number(),
		total: z.number(),
	});

export const successResponseSchema = z.object({
	success: z.boolean(),
});

// Health schema
export const healthResponseSchema = z.object({
	status: z.string(),
	timestamp: z.date(),
	version: z.string(),
});

// Simple string ID schema for common use cases
export const stringIdSchema = z.string();

export const allContracts = {
	getOrCreateUserSchema,
	createSessionSchema,
	endSessionSchema,
	getSessionsByUserSchema,
	successResponseSchema,
	healthResponseSchema,
	stringIdSchema,
};
