export const EXERCISES = {
	SQUAT: {
		name: 'squat',
		category: 'lower' as const,
		muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
	},
	BENCH_PRESS: {
		name: 'bench_press',
		category: 'upper' as const,
		muscleGroups: ['chest', 'triceps', 'shoulders'],
	},
	DEADLIFT: {
		name: 'deadlift',
		category: 'full' as const,
		muscleGroups: ['back', 'glutes', 'hamstrings', 'core'],
	},
	SHOULDER_PRESS: {
		name: 'shoulder_press',
		category: 'upper' as const,
		muscleGroups: ['shoulders', 'triceps'],
	},
	BICEP_CURL: {
		name: 'bicep_curl',
		category: 'upper' as const,
		muscleGroups: ['biceps'],
	},
} as const;

export const POSE_KEYPOINTS = [
	'nose',
	'left_eye',
	'right_eye',
	'left_ear',
	'right_ear',
	'left_shoulder',
	'right_shoulder',
	'left_elbow',
	'right_elbow',
	'left_wrist',
	'right_wrist',
	'left_hip',
	'right_hip',
	'left_knee',
	'right_knee',
	'left_ankle',
	'right_ankle',
] as const;

export const CONFIDENCE_THRESHOLDS = {
	IDENTITY_MATCH: 0.85,
	EXERCISE_DETECTION: 0.7,
	POSE_KEYPOINT: 0.5,
	WEIGHT_VISION: 0.6,
} as const;

export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;
