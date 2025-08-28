import { CognitiveItem, TaskMetadata } from '../interfaces/types';

export class TaskValidator {
    static validateTask(task: CognitiveItem): boolean {
        // Check if the item is a task (has task_metadata)
        if (!task.task_metadata) {
            return false;
        }

        const metadata = task.task_metadata;
        
        // Validate status
        const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'deferred'];
        if (metadata.status && !validStatuses.includes(metadata.status)) {
            return false;
        }
        
        // Validate priority
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (metadata.priority && !validPriorities.includes(metadata.priority)) {
            return false;
        }
        
        // Validate dependencies (if present)
        if (metadata.dependencies && !Array.isArray(metadata.dependencies)) {
            return false;
        }
        
        // Validate deadline (if present)
        if (metadata.deadline && (typeof metadata.deadline !== 'number' || metadata.deadline < 0)) {
            return false;
        }
        
        // Validate estimated_effort (if present)
        if (metadata.estimated_effort && (typeof metadata.estimated_effort !== 'number' || metadata.estimated_effort < 0)) {
            return false;
        }
        
        // Validate confidence (if present)
        if (metadata.confidence && (typeof metadata.confidence !== 'number' || metadata.confidence < 0 || metadata.confidence > 1)) {
            return false;
        }
        
        // Validate tags (if present)
        if (metadata.tags && !Array.isArray(metadata.tags)) {
            return false;
        }
        
        // Validate categories (if present)
        if (metadata.categories && !Array.isArray(metadata.categories)) {
            return false;
        }
        
        // Validate context (if present)
        if (metadata.context && typeof metadata.context !== 'object') {
            return false;
        }
        
        return true;
    }
    
    static normalizeTask(task: CognitiveItem): CognitiveItem {
        // If it's not already a task, convert it
        if (!task.task_metadata) {
            task.task_metadata = {
                status: 'pending',
                priority: 'medium'
            };
        }
        
        const metadata = task.task_metadata;
        
        // Normalize status
        if (!metadata.status) {
            metadata.status = 'pending';
        }
        
        // Normalize priority
        if (!metadata.priority) {
            metadata.priority = 'medium';
        }
        
        // Normalize dependencies
        if (metadata.dependencies && !Array.isArray(metadata.dependencies)) {
            metadata.dependencies = [];
        }
        
        // Normalize tags
        if (metadata.tags && !Array.isArray(metadata.tags)) {
            metadata.tags = [];
        }
        
        // Normalize categories
        if (metadata.categories && !Array.isArray(metadata.categories)) {
            metadata.categories = [];
        }
        
        // Normalize context
        if (metadata.context && typeof metadata.context !== 'object') {
            metadata.context = {};
        }
        
        return task;
    }
}