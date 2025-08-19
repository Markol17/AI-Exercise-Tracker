import { z } from 'zod';

// Member schemas
export const createMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});

export const updateMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const enrollIdentitySchema = z.object({
  memberId: z.string(),
  photoData: z.string(),
  consent: z.boolean(),
});

export const listMembersSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
}).optional();

// Session schemas
export const createSessionSchema = z.object({
  memberId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const endSessionSchema = z.object({
  sessionId: z.string(),
});

export const getSessionsByMemberSchema = z.object({
  memberId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const getSessionEventsSchema = z.object({
  sessionId: z.string(),
  eventTypes: z.array(z.string()).optional(),
  limit: z.number().min(1).max(200).default(100),
  offset: z.number().min(0).default(0),
});

// Event schemas
export const eventSchema = z.object({
  type: z.string(),
  sessionId: z.string(),
  timestamp: z.date().optional(),
  source: z.enum(['perception', 'manual', 'system']),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional(),
});

export const ingestEventsSchema = z.object({
  events: z.array(eventSchema),
  authToken: z.string().optional(),
});

export const getRecentEventsSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
});

// Weight schemas
export const recordWeightSchema = z.object({
  sessionId: z.string(),
  memberId: z.string().optional(),
  setNumber: z.number().min(1),
  exercise: z.string(),
  value: z.number().positive(),
  unit: z.enum(['lbs', 'kg']),
  source: z.enum(['manual', 'vision', 'sensor']).default('manual'),
  confidence: z.number().min(0).max(1).optional(),
});

export const getWeightsByMemberSchema = z.object({
  memberId: z.string(),
  exercise: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const updateWeightSchema = z.object({
  id: z.string(),
  value: z.number().positive().optional(),
  unit: z.enum(['lbs', 'kg']).optional(),
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