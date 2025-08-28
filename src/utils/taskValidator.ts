import { Task } from '../interfaces/task';

export class TaskValidator {
    static validateTask(task: Task): boolean {
        // Validate required fields
        if (!task.id || !task.atom_id || !task.label || !task.content) {
            return false;
        }

        // Validate status
        const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'deferred'];
        if (!validStatuses.includes(task.status)) {
            return false;
        }

        // Validate priority level
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(task.priority_level)) {
            return false;
        }

        // Validate dependencies (if present)
        if (task.dependencies && !Array.isArray(task.dependencies)) {
            return false;
        }

        // Validate deadline (if present)
        if (task.deadline && (typeof task.deadline !== 'number' || task.deadline < 0)) {
            return false;
        }

        // Validate estimated_effort (if present)
        if (task.estimated_effort && (typeof task.estimated_effort !== 'number' || task.estimated_effort < 0)) {
            return false;
        }

        // Validate confidence (if present)
        if (task.confidence && (typeof task.confidence !== 'number' || task.confidence < 0 || task.confidence > 1)) {
            return false;
        }

        // Validate tags (if present)
        if (task.tags && !Array.isArray(task.tags)) {
            return false;
        }

        // Validate categories (if present)
        if (task.categories && !Array.isArray(task.categories)) {
            return false;
        }

        // Validate context (if present)
        if (task.context && typeof task.context !== 'object') {
            return false;
        }

        // Validate timestamps
        if (typeof task.created_at !== 'number' || typeof task.updated_at !== 'number') {
            return false;
        }

        return true;
    }

    static normalizeTask(task: Task): Task {
        // Ensure required fields
        if (!task.status) {
            task.status = 'pending';
        }

        if (!task.priority_level) {
            task.priority_level = 'medium';
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
        if (task.dependencies && !Array.isArray(task.dependencies)) {
            task.dependencies = [];
        }

        // Normalize tags
        if (task.tags && !Array.isArray(task.tags)) {
            task.tags = [];
        }

        // Normalize categories
        if (task.categories && !Array.isArray(task.categories)) {
            task.categories = [];
        }

        // Normalize context
        if (task.context && typeof task.context !== 'object') {
            task.context = {};
        }

        return task;
    }
}