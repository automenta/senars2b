import { TaskValidator } from '../../src/utils/taskValidator';
import { CognitiveItem, TaskMetadata, AttentionValue } from '../../src/interfaces/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to create a base for cognitive items
const createBaseItem = (): Partial<CognitiveItem> => ({
    id: uuidv4(),
    atom_id: uuidv4(),
    label: 'Test Task',
    attention: { priority: 0.5, durability: 0.5 } as AttentionValue,
    created_at: Date.now(),
    updated_at: Date.now(),
    stamp: { parent_ids: [], schema_id: 'test', timestamp: Date.now() }
});

// Helper to create a valid task with full metadata
const createValidTask = (overrides: Partial<CognitiveItem> = {}, metadataOverrides: Partial<TaskMetadata> = {}): CognitiveItem => {
    const baseItem = createBaseItem();
    const task: CognitiveItem = {
        ...baseItem,
        type: 'TASK',
        task_metadata: {
            status: 'pending',
            priority_level: 'medium',
            dependencies: [],
            tags: [],
            categories: [],
            ...metadataOverrides,
        },
        ...overrides,
    } as CognitiveItem;
    return task;
};

describe('TaskValidator', () => {
    describe('validateTask', () => {
        it('should return true for a valid minimal task', () => {
            const task = createValidTask();
            expect(TaskValidator.validateTask(task)).toBe(true);
        });

        it('should return true for a valid task with all metadata fields', () => {
            const task = createValidTask({}, {
                deadline: Date.now() + 100000,
                estimated_effort: 5,
                confidence: 0.8,
                context: { project: 'Senars3' },
                completion_percentage: 25,
                group_id: 'group-1'
            });
            expect(TaskValidator.validateTask(task)).toBe(true);
        });

        it('should return false for an item that is not a task', () => {
            const item = createBaseItem() as CognitiveItem;
            item.type = 'BELIEF';
            expect(TaskValidator.validateTask(item)).toBe(false);
        });

        it('should return false if required fields like id are missing', () => {
            const task = createValidTask({ id: undefined });
            expect(TaskValidator.validateTask(task)).toBe(false);
        });

        it('should return false for an invalid status', () => {
            const task = createValidTask({}, { status: 'invalid_status' as any });
            expect(TaskValidator.validateTask(task)).toBe(false);
        });

        it('should return false for an invalid priority level', () => {
            const task = createValidTask({}, { priority_level: 'invalid_priority' as any });
            expect(TaskValidator.validateTask(task)).toBe(false);
        });

        it('should return false for a non-array dependencies field', () => {
            const task = createValidTask({}, { dependencies: 'not-an-array' as any });
            expect(TaskValidator.validateTask(task)).toBe(false);
        });

        it('should return false for a negative deadline', () => {
            const task = createValidTask({}, { deadline: -100 });
            expect(TaskValidator.validateTask(task)).toBe(false);
        });

        it('should return false for a confidence value greater than 1', () => {
            const task = createValidTask({}, { confidence: 1.1 });
            expect(TaskValidator.validateTask(task)).toBe(false);
        });

        it('should return false for a completion percentage less than 0', () => {
            const task = createValidTask({}, { completion_percentage: -10 });
            expect(TaskValidator.validateTask(task)).toBe(false);
        });
    });

    describe('normalizeTask', () => {
        it('should convert a non-task item into a default task', () => {
            const item = { ...createBaseItem(), type: 'BELIEF' } as CognitiveItem;
            const normalized = TaskValidator.normalizeTask(item);

            expect(normalized.type).toBe('TASK');
            expect(normalized.task_metadata).toBeDefined();
            expect(normalized.task_metadata?.status).toBe('pending');
            expect(normalized.task_metadata?.priority_level).toBe('medium');
        });

        it('should populate missing defaultable fields on a partial task', () => {
            const task = createValidTask();
            // Simulate a missing property to test normalization
            (task.task_metadata as any).status = undefined;
            delete task.subtasks; // 'subtasks' is optional, so delete is fine here

            const normalized = TaskValidator.normalizeTask(task);

            expect(normalized.task_metadata?.status).toBe('pending');
            expect(normalized.subtasks).toEqual([]);
        });

        it('should not overwrite existing valid data', () => {
            const task = createValidTask({}, { status: 'completed', priority_level: 'high' });
            task.subtasks = ['subtask-1'];
            const normalized = TaskValidator.normalizeTask(task);

            expect(normalized.task_metadata?.status).toBe('completed');
            expect(normalized.task_metadata?.priority_level).toBe('high');
            expect(normalized.subtasks).toEqual(['subtask-1']);
        });

        it('should ensure array fields are arrays', () => {
            const task = createValidTask({}, { tags: 'not-an-array' as any });
            const normalized = TaskValidator.normalizeTask(task);
            expect(normalized.task_metadata?.tags).toEqual([]);
        });

        it('should ensure context is an object', () => {
            const task = createValidTask({}, { context: 'not-an-object' as any });
            const normalized = TaskValidator.normalizeTask(task);
            expect(normalized.task_metadata?.context).toEqual({});
        });

        it('should add timestamps if they are missing', () => {
            const task = createValidTask();
            delete task.created_at;
            delete task.updated_at;

            const normalized = TaskValidator.normalizeTask(task);

            expect(normalized.created_at).toBeDefined();
            expect(typeof normalized.created_at).toBe('number');
            expect(normalized.updated_at).toBeDefined();
            expect(typeof normalized.updated_at).toBe('number');
        });
    });
});
