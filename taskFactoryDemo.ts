#!/usr/bin/env node

/**
 * Task Factory Demo
 *
 * This script demonstrates the new task factory functionality implemented in Phase 1.
 * It shows how to create tasks with the TaskFactory and validate them with TaskValidator.
 */

import {TaskFactory} from './src/modules/taskFactory';
import {TaskValidator} from './src/utils/taskValidator';

// Create a simple attention value
const attention = {
    priority: 0.8,
    durability: 0.6
};

console.log('=== Task Factory Demo ===\n');

// 1. Create a basic task
console.log('1. Creating a basic task:');
const basicTask = TaskFactory.createTask('Analyze system performance', attention);
console.log('Created task:', basicTask.label);
console.log('Task type:', basicTask.type);
console.log('Task status:', basicTask.goal_status);
console.log('Task has metadata:', !!basicTask.task_metadata);
console.log('');

// 2. Create a task with metadata
console.log('2. Creating a task with metadata:');
const taskWithMetadata = TaskFactory.createTask(
    'Implement user authentication',
    attention,
    'high',
    {
        projectId: 'web-app-v2',
        team: 'backend'
    }
);

console.log('Created task:', taskWithMetadata.label);
console.log('Task status:', taskWithMetadata.task_metadata?.status);
console.log('Task priority level:', taskWithMetadata.task_metadata?.priority_level);
console.log('Task deadline:', new Date(taskWithMetadata.task_metadata?.deadline || 0).toISOString());
console.log('Task effort estimate:', taskWithMetadata.task_metadata?.estimated_effort);
console.log('Task tags:', taskWithMetadata.task_metadata?.tags);
console.log('');

// 3. Create a derived task
console.log('3. Creating a derived task:');
const derivedTask = TaskFactory.createDerivedTask(
    [basicTask.id, taskWithMetadata.id],
    'Review authentication implementation',
    attention,
    {
        status: 'pending',
        priority: 'medium',
        dependencies: [taskWithMetadata.id],
        categories: ['code-review'],
        context: {reviewer: 'senior-developer'}
    }
);

console.log('Created derived task:', derivedTask.label);
console.log('Parent task IDs:', derivedTask.stamp.parent_ids);
console.log('Task categories:', derivedTask.task_metadata?.categories);
console.log('');

// 4. Validate tasks
console.log('4. Validating tasks:');
console.log('Basic task is valid (as general CognitiveItem):', !!basicTask.id && !!basicTask.type);
console.log('Task with metadata is valid (as Task):', TaskValidator.validateTask(taskWithMetadata));
console.log('Derived task is valid (as Task):', TaskValidator.validateTask(derivedTask));
console.log('Basic task is valid (as Task):', TaskValidator.validateTask(basicTask));
console.log('');

// 5. Normalize a task without metadata
console.log('5. Normalizing a task without metadata:');
const normalizedTask = TaskValidator.normalizeTask({...basicTask});
console.log('Normalized task has metadata:', !!normalizedTask.task_metadata);
console.log('Normalized task status:', normalizedTask.task_metadata?.status);
console.log('Normalized task priority:', normalizedTask.task_metadata?.priority);

console.log('\n=== Demo Complete ===');