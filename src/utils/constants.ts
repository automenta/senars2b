// Cognitive Core Constants
export const GOAL_ACHIEVED_THRESHOLD = 0.6; // Confidence threshold for a belief to satisfy a query goal
export const GOAL_ACHIEVED_PROBABILITY = 0.8; // Random probability for non-query goals (placeholder logic)
export const DECAY_CYCLE_INTERVAL = 100; // Number of items to process before running attention decay
export const MAX_CONTENT_LENGTH = 10000; // Maximum character length for content

// Task Manager Constants
export const TASK_PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const TASK_PRIORITY_VALUES = {
  [TASK_PRIORITY_LEVELS.LOW]: 0.25,
  [TASK_PRIORITY_LEVELS.MEDIUM]: 0.5,
  [TASK_PRIORITY_LEVELS.HIGH]: 0.75,
  [TASK_PRIORITY_LEVELS.CRITICAL]: 1.0,
} as const;

export const DEFAULT_TASK_DURABILITY = 0.5;

// System Information
export const SYSTEM_VERSION = '1.0.0';
