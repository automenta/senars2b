import { CognitiveItem } from '../interfaces/types';

// Type guard to check if a CognitiveItem is a Task
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK' } {
    return item.type === 'TASK' && item.task_metadata !== undefined;
}

export class TaskValidator {
    static validateTask(task: CognitiveItem): boolean {
        // Check if it's actually a task
        if (!isTask(task)) {
            return false;
        }

        // Validate required fields
        if (!task.id || !task.atom_id || !task.label) {
            return false;
        }

        // Validate task metadata
        if (!task.task_metadata) {
            return false;
        }

        // Validate status
        const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'deferred'];
        if (!validStatuses.includes(task.task_metadata.status)) {
            return false;
        }

        // Validate priority level
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(task.task_metadata.priority_level)) {
            return false;
        }

        // Validate dependencies (if present)
        if (task.task_metadata.dependencies && !Array.isArray(task.task_metadata.dependencies)) {
            return false;
        }

        // Validate deadline (if present)
        if (task.task_metadata.deadline && (typeof task.task_metadata.deadline !== 'number' || task.task_metadata.deadline < 0)) {
            return false;
        }

        // Validate estimated_effort (if present)
        if (task.task_metadata.estimated_effort && (typeof task.task_metadata.estimated_effort !== 'number' || task.task_metadata.estimated_effort < 0)) {
            return false;
        }

        // Validate confidence (if present)
        if (task.task_metadata.confidence && (typeof task.task_metadata.confidence !== 'number' || task.task_metadata.confidence < 0 || task.task_metadata.confidence > 1)) {
            return false;
        }

        // Validate tags (if present)
        if (task.task_metadata.tags && !Array.isArray(task.task_metadata.tags)) {
            return false;
        }

        // Validate categories (if present)
        if (task.task_metadata.categories && !Array.isArray(task.task_metadata.categories)) {
            return false;
        }

        // Validate context (if present)
        if (task.task_metadata.context && typeof task.task_metadata.context !== 'object') {
            return false;
        }

        // Validate timestamps
        if (typeof task.created_at !== 'number' || typeof task.updated_at !== 'number') {
            return false;
        }

        return true;
    }

    static normalizeTask(task: CognitiveItem): CognitiveItem {
        // Check if it's actually a task
        if (!isTask(task)) {
            // If it's not a task but we're trying to normalize it as one, convert it
            if (!task.task_metadata) {
                task.task_metadata = {
                    status: 'pending',
                    priority_level: 'medium'
                };
            }
        }

        // Ensure task metadata exists
        if (!task.task_metadata) {
            task.task_metadata = {
                status: 'pending',
                priority_level: 'medium'
            };
        }

        // Ensure required fields in task metadata
        if (!task.task_metadata.status) {
            task.task_metadata.status = 'pending';
        }

        if (!task.task_metadata.priority_level) {
            task.task_metadata.priority_level = 'medium';
        }

        if (!task.subtasks) {
            task.subtasks = [];
        }

        if (!task.created_at) {
            task.created_at = Date.now();
        }

        if (!task.updated_at) {
            task.updated_at = Date.now();
        }

        // Normalize dependencies
        if (task.task_metadata.dependencies && !Array.isArray(task.task_metadata.dependencies)) {
            task.task_metadata.dependencies = [];
        }

        // Normalize tags
        if (task.task_metadata.tags && !Array.isArray(task.task_metadata.tags)) {
            task.task_metadata.tags = [];
        }

        // Normalize categories
        if (task.task_metadata.categories && !Array.isArray(task.task_metadata.categories)) {
            task.task_metadata.categories = [];
        }

        // Normalize context
        if (task.task_metadata.context && typeof task.task_metadata.context !== 'object') {
            task.task_metadata.context = {};
        }

        return task;
    }
}