import {CognitiveItem, TaskMetadata, TaskStatus} from '../interfaces/types';
import { TaskPriority } from '../interfaces/sharedTypes';

/**
 * A type guard to check if a CognitiveItem is a well-formed Task.
 * @param item The CognitiveItem to check.
 * @returns True if the item is a Task, false otherwise.
 */
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK'; task_metadata: TaskMetadata } {
    return item.type === 'TASK' && item.task_metadata !== undefined;
}

const VALID_STATUSES: TaskStatus[] = ['pending', 'awaiting_dependencies', 'decomposing', 'awaiting_subtasks', 'ready_for_execution', 'completed', 'failed', 'deferred'];
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical'];

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
        // Check if the item is a task with required properties
        if (!isTask(task) || !task.id || !task.atom_id || !task.label || typeof task.created_at !== 'number' || typeof task.updated_at !== 'number') {
            return false;
        }

        // Validate task metadata
        const metadata = task.task_metadata;
        
        // Validate status
        if (!VALID_STATUSES.includes(metadata.status)) {
            return false;
        }
        
        // Validate priority level
        if (!VALID_PRIORITIES.includes(metadata.priority_level)) {
            return false;
        }
        
        // Validate optional fields if present
        if (metadata.deadline !== undefined && (typeof metadata.deadline !== 'number' || metadata.deadline < 0)) {
            return false;
        }
        
        if (metadata.estimated_effort !== undefined && (typeof metadata.estimated_effort !== 'number' || metadata.estimated_effort < 0)) {
            return false;
        }
        
        if (metadata.confidence !== undefined && (typeof metadata.confidence !== 'number' || metadata.confidence < 0 || metadata.confidence > 1)) {
            return false;
        }
        
        if (metadata.completion_percentage !== undefined && (typeof metadata.completion_percentage !== 'number' || metadata.completion_percentage < 0 || metadata.completion_percentage > 100)) {
            return false;
        }
        
        // Validate array fields
        if (metadata.dependencies !== undefined && !Array.isArray(metadata.dependencies)) {
            return false;
        }
        
        if (metadata.tags !== undefined && !Array.isArray(metadata.tags)) {
            return false;
        }
        
        if (metadata.categories !== undefined && !Array.isArray(metadata.categories)) {
            return false;
        }
        
        if (metadata.outcomes !== undefined && !Array.isArray(metadata.outcomes)) {
            return false;
        }
        
        if (metadata.required_resources !== undefined && !Array.isArray(metadata.required_resources)) {
            return false;
        }
        
        if (metadata.subtasks !== undefined && !Array.isArray(metadata.subtasks)) {
            return false;
        }
        
        // Validate context if present
        if (metadata.context !== undefined && (typeof metadata.context !== 'object' || metadata.context === null || Array.isArray(metadata.context))) {
            return false;
        }
        
        // Validate string fields
        if (metadata.group_id !== undefined && typeof metadata.group_id !== 'string') {
            return false;
        }
        
        if (metadata.parent_id !== undefined && typeof metadata.parent_id !== 'string') {
            return false;
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
        // If it's not a task, we convert it by adding the minimum required metadata.
        if (!isTask(task)) {
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

        // Ensure array fields are arrays
        metadata.dependencies = Array.isArray(metadata.dependencies) ? metadata.dependencies : [];
        metadata.tags = Array.isArray(metadata.tags) ? metadata.tags : [];
        metadata.categories = Array.isArray(metadata.categories) ? metadata.categories : [];
        metadata.outcomes = Array.isArray(metadata.outcomes) ? metadata.outcomes : [];
        metadata.required_resources = Array.isArray(metadata.required_resources) ? metadata.required_resources : [];
        metadata.subtasks = Array.isArray(metadata.subtasks) ? metadata.subtasks : [];

        // Ensure timestamps exist
        const now = Date.now();
        task.created_at = task.created_at ?? now;
        task.updated_at = task.updated_at ?? task.created_at;

        // Ensure context is an object
        if (typeof metadata.context !== 'object' || metadata.context === null || Array.isArray(metadata.context)) {
            metadata.context = {};
        }

        return task;
    }
}