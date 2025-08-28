import { TaskFactory } from '../../src/modules/taskFactory';
import { TaskValidator } from '../../src/utils/taskValidator';
import { AttentionValue } from '../../src/interfaces/types';

describe('TaskFactory', () => {
    const mockAttention: AttentionValue = {
        priority: 0.8,
        durability: 0.6
    };

    it('should create a task with basic properties', () => {
        const content = 'Test task';
        const task = TaskFactory.createTask(content, mockAttention);
        
        expect(task).toBeDefined();
        expect(task.type).toBe('TASK');
        expect(task.label).toBe(content);
        expect(task.content).toBe(content);
        expect(task.attention.priority).toBe(0.8);
        expect(task.attention.durability).toBe(0.6);
        expect(task.task_metadata?.status).toBe('pending');
        expect(task.task_metadata?.priority_level).toBe('medium');
    });

    it('should create a task with custom priority', () => {
        const content = 'High priority task';
        const task = TaskFactory.createTask(content, mockAttention, 'high');
        
        expect(task.task_metadata?.priority_level).toBe('high');
    });

    it('should create a derived task', () => {
        const parentIds = ['parent1', 'parent2'];
        const content = 'Derived task';
        const task = TaskFactory.createDerivedTask(parentIds, content, mockAttention, 'critical');
        
        expect(task).toBeDefined();
        expect(task.type).toBe('TASK');
        expect(task.label).toBe(content);
        expect(task.task_metadata?.dependencies).toEqual(parentIds);
        expect(task.task_metadata?.priority_level).toBe('critical');
    });

    it('should create a subtask', () => {
        const parentId = 'parent1';
        const content = 'Subtask';
        const task = TaskFactory.createSubtask(parentId, content, mockAttention, 'low');
        
        expect(task).toBeDefined();
        expect(task.type).toBe('TASK');
        expect(task.label).toBe(content);
        expect(task.parent_id).toBe(parentId);
        expect(task.task_metadata?.priority_level).toBe('low');
    });
});

describe('TaskValidator', () => {
    it('should validate a valid task', () => {
        const validTask: any = {
            id: 'task1',
            atom_id: 'atom1',
            label: 'Valid task',
            content: 'Valid task content',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            type: 'TASK',
            task_metadata: {
                status: 'pending',
                priority_level: 'high',
                dependencies: ['task2'],
                deadline: Date.now() + 86400000,
                estimated_effort: 5,
                required_resources: ['resource1'],
                outcomes: ['outcome1'],
                confidence: 0.9,
                tags: ['tag1'],
                categories: ['category1'],
                context: { projectId: 'project1' }
            },
            subtasks: [],
            created_at: Date.now(),
            updated_at: Date.now()
        };

        expect(TaskValidator.validateTask(validTask)).toBe(true);
    });

    it('should invalidate a task with missing required fields', () => {
        const invalidTask: any = {
            id: 'task1',
            // missing atom_id, label, content
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            type: 'TASK',
            task_metadata: {
                status: 'pending',
                priority_level: 'high'
            }
        };

        expect(TaskValidator.validateTask(invalidTask)).toBe(false);
    });

    it('should invalidate a task with invalid status', () => {
        const invalidTask: any = {
            id: 'task1',
            atom_id: 'atom1',
            label: 'Invalid task',
            content: 'Invalid task content',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            type: 'TASK',
            task_metadata: {
                status: 'invalid_status',
                priority_level: 'high'
            }
        };

        expect(TaskValidator.validateTask(invalidTask)).toBe(false);
    });

    it('should normalize a task with missing fields', () => {
        const task: any = {
            id: 'task1',
            atom_id: 'atom1',
            label: 'Task to normalize',
            content: 'Task content',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            type: 'TASK'
            // missing task_metadata, status, priority_level, etc.
        };

        const normalizedTask = TaskValidator.normalizeTask(task);
        
        expect(normalizedTask.task_metadata?.status).toBe('pending');
        expect(normalizedTask.task_metadata?.priority_level).toBe('medium');
        expect(normalizedTask.subtasks).toEqual([]);
    });
});