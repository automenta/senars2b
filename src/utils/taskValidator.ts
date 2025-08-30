import {CognitiveItem, TaskMetadata, TaskStatus} from '../interfaces/types';

/**
 * A type guard to check if a CognitiveItem is a well-formed Task.
 * @param item The CognitiveItem to check.
 * @returns True if the item is a Task, false otherwise.
 */
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK'; task_metadata: TaskMetadata } {
    return item.type === 'TASK' && item.task_metadata !== undefined;
}

const VALID_STATUSES: TaskStatus[] = ['pending', 'awaiting_dependencies', 'decomposing', 'awaiting_subtasks', 'ready_for_execution', 'completed', 'failed', 'deferred'];
const VALID_PRIORITIES: Array<TaskMetadata['priority_level']> = ['low', 'medium', 'high', 'critical'];

/**
 * A map of validation rules for each field in TaskMetadata.
 * This allows for a data-driven and easily extensible validation approach.
 */
const metadataValidationRules: { [K in keyof TaskMetadata]?: (value: any) => boolean } = {
    status: (value: any) => VALID_STATUSES.includes(value),
    priority_level: (value: any) => VALID_PRIORITIES.includes(value),
    dependencies: (value: any) => Array.isArray(value),
    deadline: (value: any) => typeof value === 'number' && value >= 0,
    estimated_effort: (value: any) => typeof value === 'number' && value >= 0,
    confidence: (value: any) => typeof value === 'number' && value >= 0 && value <= 1,
    tags: (value: any) => Array.isArray(value),
    categories: (value: any) => Array.isArray(value),
    context: (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value),
    completion_percentage: (value: any) => typeof value === 'number' && value >= 0 && value <= 100,
    group_id: (value: any) => typeof value === 'string',
    subtasks: (value: any) => Array.isArray(value),
};

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
        if (!isTask(task) || !task.id || !task.atom_id || !task.label || typeof task.created_at !== 'number' || typeof task.updated_at !== 'number') {
            return false;
        }

        for (const key in metadataValidationRules) {
            const metadataKey = key as keyof TaskMetadata;
            const rule = metadataValidationRules[metadataKey];
            const value = task.task_metadata[metadataKey];

            if (value !== undefined && rule && !rule(value)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Normalizes a CognitiveItem to ensure it has all the necessary properties for a task.
     * It sets default values for missing fields and ensures correct data types.
     * @param task The CognitiveItem to normalize.
     * @returns A normalized task CognitiveItem.
     */
    static normalizeTask(task: CognitiveItem): CognitiveItem {
        if (!isTask(task)) {
            // If it's not a task, we convert it by adding the minimum required metadata.
            task.type = 'TASK';
            task.task_metadata = {
                status: 'pending',
                priority_level: 'medium',
            };
        }

        const metadata = task.task_metadata!;

        // Set default values for core metadata
        metadata.status = metadata.status ?? 'pending';
        metadata.priority_level = metadata.priority_level ?? 'medium';

        // Normalize fields that should be arrays, replacing them if they are not.
        const normalizeArray = (value: unknown): any[] => Array.isArray(value) ? value : [];

        metadata.dependencies = normalizeArray(metadata.dependencies);
        metadata.tags = normalizeArray(metadata.tags);
        metadata.categories = normalizeArray(metadata.categories);
        metadata.outcomes = normalizeArray(metadata.outcomes);
        metadata.required_resources = normalizeArray(metadata.required_resources);
        metadata.subtasks = normalizeArray(metadata.subtasks);

        // Ensure timestamps exist
        task.created_at = task.created_at ?? Date.now();
        task.updated_at = task.updated_at ?? task.created_at;

        // Ensure context is an object
        if (typeof metadata.context !== 'object' || metadata.context === null || Array.isArray(metadata.context)) {
            metadata.context = {};
        }

        return task;
    }
}