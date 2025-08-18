export interface Member {
  id: string;
  name: string;
  email?: string | null;
  enrolledAt?: Date | null;
  consentedAt?: Date | null;
  faceEmbedding?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  startedAt: Date;
  endedAt?: Date | null;
  memberId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackedPerson {
  trackId: string;
  memberId?: string;
  confidence?: number;
  boundingBox?: BoundingBox;
  keypoints?: Keypoint[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Keypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

export interface Exercise {
  name: string;
  category: 'upper' | 'lower' | 'full';
  muscleGroups: string[];
}

export interface RepCount {
  trackId: string;
  exercise: string;
  count: number;
  setNumber: number;
  timestamp: Date;
}

export interface Weight {
  id: string;
  sessionId: string;
  memberId?: string;
  setNumber: number;
  exercise: string;
  value: number;
  unit: 'lbs' | 'kg';
  source: 'manual' | 'vision' | 'sensor';
  confidence?: number;
  timestamp: Date;
}