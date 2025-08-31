// Cognitive Core Constants
export const GOAL_ACHIEVED_THRESHOLD = 0.6; // Confidence threshold for a belief to satisfy a query goal
export const GOAL_ACHIEVED_PROBABILITY = 0.8; // Random probability for non-query goals (placeholder logic)
export const DECAY_CYCLE_INTERVAL = 100; // Number of items to process before running attention decay
export const MAX_CONTENT_LENGTH = 10000; // Maximum character length for content
export const CONTEXT_ITEM_COUNT = 10; // Number of context items to retrieve
export const DEFAULT_TRUST_SCORE = 0.5; // Default trust score for schemas without one
export const DEFAULT_QUERY_K = 10; // Default number of items to retrieve in queries

// World Model Constants
export const BELIEF_UPDATE_EVENT_PRIORITY = 0.8;
export const BELIEF_UPDATE_EVENT_DURABILITY = 0.5;
export const DEFAULT_SCHEMA_PRIORITY = 0.7;
export const DEFAULT_SCHEMA_DURABILITY = 0.6;
export const ANALOGY_HYPOTHESIS_PRIORITY = 0.7;
export const ANALOGY_HYPOTHESIS_DURABILITY = 0.6;
export const CAUSAL_INFERENCE_FREQUENCY = 0.8;
export const CAUSAL_INFERENCE_CONFIDENCE = 0.7;
export const CAUSAL_INFERENCE_PRIORITY = 0.6;
export const CAUSAL_INFERENCE_DURABILITY = 0.7;
export const COMPACTION_DURABILITY_THRESHOLD = 0.1;
export const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
export const CONFIDENCE_DISTRIBUTION_BIN_COUNT = 10;
export const STRUCTURAL_SIMILARITY_KEY_WEIGHT = 0.3;
export const STRUCTURAL_SIMILARITY_VALUE_WEIGHT = 0.7;

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

// Atom Metadata
export const META_TYPE_FACT = 'Fact';
export const META_TYPE_COGNITIVE_SCHEMA = 'CognitiveSchema';
export const SYSTEM_INTERNALS_DOMAIN = 'system_internals';

export const META_SOURCE_USER_INPUT = 'user_input';
export const META_SOURCE_SYSTEM = 'system';
