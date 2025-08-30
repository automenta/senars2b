import {CognitiveItem} from './types';

// Task is now simply a type alias for CognitiveItem with type 'TASK'
export type Task = CognitiveItem & { type: 'TASK' };

// Re-export the base interfaces to avoid circular dependencies
export type {AttentionValue, TruthValue, DerivationStamp} from './types';