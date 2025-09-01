import {z} from 'zod';
import {CognitiveItem, TaskMetadata, TaskStatus} from '../interfaces/types';
import {TaskPriority} from '../interfaces/sharedTypes';

const taskStatusSchema = z.enum(['pending', 'awaiting_dependencies', 'decomposing', 'awaiting_subtasks', 'ready_for_execution', 'completed', 'failed', 'deferred']);
const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

const taskMetadataSchema = z.object({
    status: taskStatusSchema.default('pending'),
    priority_level: taskPrioritySchema.default('medium'),
    dependencies: z.array(z.string()).default([]),
    deadline: z.number().min(0).optional(),
    estimated_effort: z.number().min(0).optional(),
    required_resources: z.array(z.string()).default([]),
    outcomes: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1).optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    context: z.record(z.any()).default({}),
    completion_percentage: z.number().min(0).max(100).optional(),
    group_id: z.string().optional(),
    parent_id: z.string().optional(),
    subtasks: z.array(z.string()).default([]),
});

const attentionValueSchema = z.object({
    priority: z.number().min(0).max(1),
    durability: z.number().min(0).max(1),
});

const truthValueSchema = z.object({
    frequency: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
});

const derivationStampSchema = z.object({
    timestamp: z.number(),
    parent_ids: z.array(z.string()),
    schema_id: z.string(),
    module: z.string().optional(),
});

const cognitiveItemSchema = z.object({
    id: z.string(),
    atom_id: z.string(),
    label: z.string(),
    created_at: z.number().default(() => Date.now()),
    updated_at: z.number().default(() => Date.now()),
    type: z.literal('TASK'),
    task_metadata: taskMetadataSchema,
    attention: attentionValueSchema,
    stamp: derivationStampSchema,
    // Add other CognitiveItem fields to make the schema complete
    content: z.any().optional(),
    truth: truthValueSchema.optional(),
    meta: z.record(z.any()).optional(),
    goal_parent_id: z.string().optional(),
    goal_status: z.enum(["active", "blocked", "achieved", "failed"]).optional(),
    payload: z.record(z.any()).optional(),
});

/**
 * A type guard to check if a CognitiveItem is a well-formed Task.
 * @param item The CognitiveItem to check.
 * @returns True if the item is a Task, false otherwise.
 */
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK'; task_metadata: TaskMetadata } {
    return item.type === 'TASK' && item.task_metadata !== undefined;
}

/**
 * Provides utility methods for validating and normalizing Task cognitive items.
 * Ensures that tasks conform to the required structure and contain valid data.
 */
export class TaskValidator {
    /**
     * Validates a CognitiveItem to ensure it is a structurally sound task.
     * @param task The CognitiveItem to validate.
     * @returns True if the task is valid, false otherwise.
     */
    static validateTask(task: CognitiveItem): boolean {
        const result = cognitiveItemSchema.safeParse(task);
        return result.success;
    }

    /**
     * Normalizes a CognitiveItem to ensure it has all the necessary properties for a task.
     * It sets default values for missing fields and ensures correct data types.
     * @param task The CognitiveItem to normalize.
     * @returns A normalized task CognitiveItem.
     */
    static normalizeTask(task: CognitiveItem): CognitiveItem {
        // If it's not a task, we convert it by adding the minimum required metadata.
        if (!isTask(task)) {
            task.type = 'TASK';
            task.task_metadata = {
                status: 'pending',
                priority_level: 'medium',
            };
        }

        // Now, parse with Zod to apply all defaults and validate.
        // This will throw an error if the basic structure is still wrong.
        return cognitiveItemSchema.parse(task);
    }
}