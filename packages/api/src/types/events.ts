export type EventType = 
  | 'person_detected'
  | 'person_lost'
  | 'exercise_started'
  | 'exercise_ended'
  | 'rep_completed'
  | 'set_completed'
  | 'identity_matched'
  | 'weight_detected'
  | 'zone_entered'
  | 'zone_exited';

export interface BaseEvent {
  id: string;
  type: EventType;
  sessionId: string;
  timestamp: Date;
  source: 'perception' | 'manual' | 'system';
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface PersonDetectedEvent extends BaseEvent {
  type: 'person_detected';
  trackId: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PersonLostEvent extends BaseEvent {
  type: 'person_lost';
  trackId: string;
}

export interface ExerciseStartedEvent extends BaseEvent {
  type: 'exercise_started';
  trackId: string;
  exercise: string;
  setNumber: number;
}

export interface ExerciseEndedEvent extends BaseEvent {
  type: 'exercise_ended';
  trackId: string;
  exercise: string;
  setNumber: number;
  totalReps: number;
}

export interface RepCompletedEvent extends BaseEvent {
  type: 'rep_completed';
  trackId: string;
  exercise: string;
  repNumber: number;
  setNumber: number;
  quality?: 'good' | 'partial' | 'poor';
}

export interface SetCompletedEvent extends BaseEvent {
  type: 'set_completed';
  trackId: string;
  exercise: string;
  setNumber: number;
  totalReps: number;
  weight?: number;
  weightUnit?: 'lbs' | 'kg';
}

export interface IdentityMatchedEvent extends BaseEvent {
  type: 'identity_matched';
  trackId: string;
  memberId: string;
  confidence: number;
}

export interface WeightDetectedEvent extends BaseEvent {
  type: 'weight_detected';
  value: number;
  unit: 'lbs' | 'kg';
  equipment?: string;
  confidence: number;
}

export type VeroEvent = 
  | PersonDetectedEvent
  | PersonLostEvent
  | ExerciseStartedEvent
  | ExerciseEndedEvent
  | RepCompletedEvent
  | SetCompletedEvent
  | IdentityMatchedEvent
  | WeightDetectedEvent;