#!/usr/bin/env node

/**
 * Unified Task System Demo
 *
 * This script demonstrates the new consolidated task system that replaces
 * the separate Task and CognitiveItem systems.
 */

import {TaskFactory} from './src/modules/taskFactory';
import {TaskValidator} from './src/utils/taskValidator';

// Create a simple attention value
const attention = {
    priority: 0.8,
    durability: 0.6
};

console.log('=== Unified Task System Demo ===\n');

// 1. Create a basic task
console.log('1. Creating a basic task:');
const basicTask = TaskFactory.createTask('Analyze system performance', attention);
console.log('Created task:', basicTask.label);
console.log('Task type:', basicTask.type);
console.log('Task status:', basicTask.task_metadata?.status);
console.log('Task priority level:', basicTask.task_metadata?.priority_level);
console.log('');

// 2. Create a task with custom properties
console.log('2. Creating a task with custom properties:');
const customTask = TaskFactory.createTask(
    'Implement user authentication',
    attention,
    'high',
    {projectId: 'web-app-v2', team: 'backend'}
);

// Update the task with additional properties
if (customTask.task_metadata) {
    customTask.task_metadata.status = 'in_progress';
    customTask.task_metadata.dependencies = ['task-design-db-schema'];
    customTask.task_metadata.deadline = Date.now() + 86400000; // 1 day from now
    customTask.task_metadata.estimated_effort = 8;
    customTask.task_metadata.required_resources = ['database-access', 'auth-library'];
    customTask.task_metadata.outcomes = ['user-can-login', 'user-can-logout'];
    customTask.task_metadata.confidence = 0.9;
    customTask.task_metadata.tags = ['security', 'backend'];
    customTask.task_metadata.categories = ['authentication'];
    customTask.task_metadata.context = {reviewer: 'senior-developer'};
}

console.log('Created task:', customTask.label);
console.log('Task status:', customTask.task_metadata?.status);
console.log('Task priority level:', customTask.task_metadata?.priority_level);
console.log('Task deadline:', new Date(customTask.task_metadata?.deadline || 0).toISOString());
console.log('Task effort estimate:', customTask.task_metadata?.estimated_effort);
console.log('Task tags:', customTask.task_metadata?.tags);
console.log('');

// 3. Create a derived task
console.log('3. Creating a derived task:');
const derivedTask = TaskFactory.createDerivedTask(
    [basicTask.id, customTask.id],
    'Review authentication implementation',
    attention,
    'medium',
    {reviewer: 'senior-developer'}
);

console.log('Created derived task:', derivedTask.label);
console.log('Parent task IDs:', derivedTask.task_metadata?.dependencies);
console.log('Task categories:', derivedTask.task_metadata?.categories);
console.log('');

// 4. Validate tasks
console.log('4. Validating tasks:');
console.log('Basic task is valid:', TaskValidator.validateTask(basicTask));
console.log('Custom task is valid:', TaskValidator.validateTask(customTask));
console.log('Derived task is valid:', TaskValidator.validateTask(derivedTask));
console.log('');

// 5. Normalize a task with missing fields
console.log('5. Normalizing a task with missing fields:');
const incompleteTask: any = {
    id: 'incomplete-task',
    atom_id: 'atom1',
    label: 'Incomplete task',
    content: 'Incomplete task content',
    attention: {priority: 0.5, durability: 0.5},
    stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'demo'},
    type: 'TASK'
    // missing task_metadata, status, priority_level, etc.
};

console.log('Before normalization - has task_metadata:', !!incompleteTask.task_metadata);
const normalizedTask = TaskValidator.normalizeTask(incompleteTask);
console.log('After normalization - status:', normalizedTask.task_metadata?.status);
console.log('After normalization - priority level:', normalizedTask.task_metadata?.priority_level);
console.log('After normalization - subtasks:', normalizedTask.subtasks);
console.log('');

// 6. Create subtasks
console.log('6. Creating subtasks:');
const parentTask = TaskFactory.createTask('Implement REST API', attention, 'high');
const subtask1 = TaskFactory.createSubtask(parentTask.id, 'Design API endpoints', attention, 'medium');
const subtask2 = TaskFactory.createSubtask(parentTask.id, 'Implement controllers', attention, 'high');

console.log('Parent task:', parentTask.label);
console.log('Subtask 1:', subtask1.label);
console.log('Subtask 2:', subtask2.label);
console.log('Parent ID of subtask 1:', subtask1.parent_id);
console.log('');

console.log('=== Demo Complete ===');