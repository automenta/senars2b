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
        expect(task.type).toBe('GOAL');
        expect(task.label).toBe(content);
        expect(task.attention.priority).toBe(0.8);
        expect(task.attention.durability).toBe(0.6);
        expect(task.goal_status).toBe('active');
    });

    it('should create a task with metadata', () => {
        const content = 'Test task with metadata';
        const taskMetadata = {
            status: 'pending' as const,
            priority: 'high' as const,
            dependencies: ['task1', 'task2'],
            deadline: Date.now() + 86400000, // 1 day from now
            estimated_effort: 5,
            required_resources: ['resource1', 'resource2'],
            outcomes: ['outcome1'],
            confidence: 0.9,
            tags: ['tag1', 'tag2'],
            categories: ['category1'],
            context: { projectId: 'project1' }
        };

        const task = TaskFactory.createTask(content, mockAttention, taskMetadata);
        
        expect(task.task_metadata).toBeDefined();
        expect(task.task_metadata?.status).toBe('pending');
        expect(task.task_metadata?.priority).toBe('high');
        expect(task.task_metadata?.dependencies).toEqual(['task1', 'task2']);
        expect(task.task_metadata?.deadline).toBeGreaterThan(Date.now());
        expect(task.task_metadata?.estimated_effort).toBe(5);
        expect(task.task_metadata?.required_resources).toEqual(['resource1', 'resource2']);
        expect(task.task_metadata?.outcomes).toEqual(['outcome1']);
        expect(task.task_metadata?.confidence).toBe(0.9);
        expect(task.task_metadata?.tags).toEqual(['tag1', 'tag2']);
        expect(task.task_metadata?.categories).toEqual(['category1']);
        expect(task.task_metadata?.context).toEqual({ projectId: 'project1' });
    });

    it('should create a derived task', () => {
        const parentIds = ['parent1', 'parent2'];
        const content = 'Derived task';
        const task = TaskFactory.createDerivedTask(parentIds, content, mockAttention);
        
        expect(task).toBeDefined();
        expect(task.type).toBe('GOAL');
        expect(task.label).toBe(content);
        expect(task.stamp.parent_ids).toEqual(parentIds);
        expect(task.goal_status).toBe('active');
    });
});

describe('TaskValidator', () => {
    it('should validate a valid task', () => {
        const validTask: any = {
            id: 'task1',
            atom_id: 'atom1',
            type: 'GOAL',
            label: 'Valid task',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            goal_status: 'active',
            task_metadata: {
                status: 'pending',
                priority: 'high',
                dependencies: ['task2'],
                deadline: Date.now() + 86400000,
                estimated_effort: 5,
                required_resources: ['resource1'],
                outcomes: ['outcome1'],
                confidence: 0.9,
                tags: ['tag1'],
                categories: ['category1'],
                context: { projectId: 'project1' }
            }
        };

        expect(TaskValidator.validateTask(validTask)).toBe(true);
    });

    it('should invalidate a task with invalid status', () => {
        const invalidTask: any = {
            id: 'task1',
            atom_id: 'atom1',
            type: 'GOAL',
            label: 'Invalid task',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            goal_status: 'active',
            task_metadata: {
                status: 'invalid_status',
                priority: 'high'
            }
        };

        expect(TaskValidator.validateTask(invalidTask)).toBe(false);
    });

    it('should invalidate a task with invalid priority', () => {
        const invalidTask: any = {
            id: 'task1',
            atom_id: 'atom1',
            type: 'GOAL',
            label: 'Invalid task',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            goal_status: 'active',
            task_metadata: {
                status: 'pending',
                priority: 'invalid_priority'
            }
        };

        expect(TaskValidator.validateTask(invalidTask)).toBe(false);
    });

    it('should normalize a task without metadata', () => {
        const task: any = {
            id: 'task1',
            atom_id: 'atom1',
            type: 'GOAL',
            label: 'Task to normalize',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            goal_status: 'active'
        };

        const normalizedTask = TaskValidator.normalizeTask(task);
        
        expect(normalizedTask.task_metadata).toBeDefined();
        expect(normalizedTask.task_metadata?.status).toBe('pending');
        expect(normalizedTask.task_metadata?.priority).toBe('medium');
    });

    it('should normalize a task with partial metadata', () => {
        const task: any = {
            id: 'task1',
            atom_id: 'atom1',
            type: 'GOAL',
            label: 'Task to normalize',
            attention: { priority: 0.8, durability: 0.6 },
            stamp: { timestamp: Date.now(), parent_ids: [], schema_id: 'test' },
            goal_status: 'active',
            task_metadata: {
                status: 'in_progress'
                // priority is missing
            }
        };

        const normalizedTask = TaskValidator.normalizeTask(task);
        
        expect(normalizedTask.task_metadata?.status).toBe('in_progress');
        expect(normalizedTask.task_metadata?.priority).toBe('medium'); // should be defaulted
    });
});