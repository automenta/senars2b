import {v4 as uuidv4} from 'uuid';
import {
    AttentionValue,
    CognitiveItem,
    SemanticAtom,
    TruthValue
} from '@/interfaces/types';
import {CognitiveSchema, WorldModel} from '@/core/worldModel';

/**
 * Creates a basic CognitiveItem with default values
 * @param overrides Partial CognitiveItem properties to override defaults
 * @returns A new CognitiveItem with default values and any provided overrides
 */
export function createCognitiveItem(overrides: Partial<CognitiveItem> = {}): CognitiveItem {
    return {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        label: 'Test Item', // Added default label
        attention: {priority: 0.5, durability: 0.7},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: uuidv4()},
        ...overrides
    };
}

/**
 * Creates a CognitiveItem of type TASK
 * @param overrides Partial CognitiveItem properties to override defaults
 * @returns A new CognitiveItem of type TASK with default properties and any provided overrides
 */
import { TaskMetadata } from '@/interfaces/types';

export function createTaskItem(overrides: Partial<CognitiveItem> = {}): CognitiveItem {
    const defaultTaskMetadata: TaskMetadata = {
        status: 'pending',
        priority_level: 'medium',
    };

    const taskMetadata = overrides.task_metadata
        ? { ...defaultTaskMetadata, ...overrides.task_metadata }
        : defaultTaskMetadata;

    return createCognitiveItem({
        type: 'TASK',
        label: 'Test task',
        task_metadata: taskMetadata,
        ...overrides
    });
}

/**
 * Creates a CognitiveItem with truth values (for beliefs)
 * @param overrides Partial CognitiveItem properties to override defaults
 * @returns A new CognitiveItem of type BELIEF with default truth values and any provided overrides
 */
export function createBeliefItem(overrides: Partial<CognitiveItem> = {}): CognitiveItem {
    return createCognitiveItem({
        type: 'BELIEF',
        truth: {frequency: 0.8, confidence: 0.9},
        ...overrides
    });
}

/**
 * Creates a CognitiveItem with goal status (for goals)
 * @param overrides Partial CognitiveItem properties to override defaults
 * @returns A new CognitiveItem of type GOAL with default properties and any provided overrides
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
 * @param overrides Partial AttentionValue properties to override defaults
 * @returns A new AttentionValue with default values and any provided overrides
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
 * @param overrides Partial TruthValue properties to override defaults
 * @returns A new TruthValue with default values and any provided overrides
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
 * @param overrides Partial CognitiveSchema properties to override defaults
 * @returns A new CognitiveSchema with a jest mock function for apply and any provided overrides
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
 * @param overrides Partial SemanticAtom properties to override defaults
 * @returns A new SemanticAtom with default values and any provided overrides
 */
export function createSemanticAtom(overrides: Partial<SemanticAtom> = {}): SemanticAtom {
    return {
        id: uuidv4(),
        content: 'Test content',
        embedding: Array(768).fill(0.5),
        creationTime: Date.now(), // Added
        lastAccessTime: Date.now(), // Added
        meta: {
            type: 'Fact',
            source: 'test',
            timestamp: new Date().toISOString(),
            trust_score: 0.8
        },
        ...overrides
    };
}

/**
 * Creates basic Cognitive metadata
 * @param overrides Partial metadata properties to override defaults
 * @returns A new metadata object with default values and any provided overrides
 */
export function createCognitiveMetadata(overrides: Record<string, any> = {}): Record<string, any> {
    return {
        domain: 'test',
        source: 'test_source',
        trust_score: 0.8,
        ...overrides
    };
}