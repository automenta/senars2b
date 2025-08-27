import { v4 as uuidv4 } from 'uuid';
import {
  CognitiveItem,
  AttentionValue,
  TruthValue,
  CognitiveSchema,
  SemanticAtom
} from '../../dist/types';

/**
 * Creates a basic CognitiveItem with default values
 */
export function createCognitiveItem(overrides: Partial<CognitiveItem> = {}): CognitiveItem {
  return {
    id: uuidv4(),
    atom_id: uuidv4(),
    type: 'BELIEF',
    attention: { priority: 0.5, durability: 0.7 },
    stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() },
    ...overrides
  };
}

/**
 * Creates a CognitiveItem with truth values (for beliefs)
 */
export function createBeliefItem(overrides: Partial<CognitiveItem> = {}): CognitiveItem {
  return createCognitiveItem({
    type: 'BELIEF',
    truth: { frequency: 0.8, confidence: 0.9 },
    ...overrides
  });
}

/**
 * Creates a CognitiveItem with goal status (for goals)
 */
export function createGoalItem(overrides: Partial<CognitiveItem> = {}): CognitiveItem {
  return createCognitiveItem({
    type: 'GOAL',
    goal_status: 'active',
    label: 'Test goal',
    ...overrides
  });
}

/**
 * Creates a basic AttentionValue
 */
export function createAttentionValue(overrides: Partial<AttentionValue> = {}): AttentionValue {
  return {
    priority: 0.5,
    durability: 0.7,
    ...overrides
  };
}

/**
 * Creates a basic TruthValue
 */
export function createTruthValue(overrides: Partial<TruthValue> = {}): TruthValue {
  return {
    frequency: 0.8,
    confidence: 0.9,
    ...overrides
  };
}

/**
 * Creates a mock CognitiveSchema
 */
export function createMockSchema(overrides: Partial<CognitiveSchema> = {}): CognitiveSchema {
  return {
    atom_id: uuidv4(),
    apply: jest.fn(),
    ...overrides
  };
}

/**
 * Creates a SemanticAtom
 */
export function createSemanticAtom(overrides: Partial<SemanticAtom> = {}): SemanticAtom {
  return {
    id: uuidv4(),
    content: 'Test content',
    embedding: Array(768).fill(0.5),
    meta: {
      type: 'Fact',
      source: 'test',
      timestamp: new Date().toISOString(),
      trust_score: 0.8
    },
    ...overrides
  };
}