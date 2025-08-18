import { Member, Session, Weight } from './core';
import { VeroEvent } from './events';

export interface CreateMemberInput {
  name: string;
  email?: string;
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
}

export interface EnrollIdentityInput {
  memberId: string;
  photoData: string;
  consent: boolean;
}

export interface CreateSessionInput {
  memberId?: string;
  metadata?: Record<string, any>;
}

export interface EndSessionInput {
  sessionId: string;
}

export interface RecordWeightInput {
  sessionId: string;
  memberId?: string;
  setNumber: number;
  exercise: string;
  value: number;
  unit: 'lbs' | 'kg';
}

export interface IngestEventInput {
  events: Omit<VeroEvent, 'id'>[];
  authToken?: string;
}

export interface GetSessionEventsInput {
  sessionId: string;
  eventTypes?: string[];
  limit?: number;
  offset?: number;
}

export interface GetMemberHistoryInput {
  memberId: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface RealtimeSubscription {
  sessionId?: string;
  memberId?: string;
  eventTypes?: string[];
}