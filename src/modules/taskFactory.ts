import { CognitiveItem, AttentionValue } from '../interfaces/types';
import { CognitiveItemFactory } from './cognitiveItemFactory';

/**
 * TaskFactory - Factory for creating task cognitive items
 * 
 * This factory creates tasks as specialized cognitive items, maintaining
 * compatibility with the unified cognitive architecture while providing
 * task-specific functionality.
 */
export class TaskFactory {
    /**
     * Create a task cognitive item
     * @param content The content of the task
     * @param attention The attention value for the task
     * @param priority_level The priority level of the task
     * @param metadata Optional metadata for the task
     * @returns A new task cognitive item
     */
    static createTask(
        content: string,
        attention: AttentionValue,
        priority_level: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        metadata?: Record<string, any>
    ): CognitiveItem {
        return CognitiveItemFactory.createTask(content, attention, {
            status: 'pending',
            priority_level,
            ...metadata
        });
    }
    
    /**
     * Create a derived task cognitive item
     * @param parentIds The IDs of the parent tasks
     * @param content The content of the task
     * @param attention The attention value for the task
     * @param priority_level The priority level of the task
     * @param metadata Optional metadata for the task
     * @returns A new derived task cognitive item
     */
    static createDerivedTask(
        parentIds: string[],
        content: string,
        attention: AttentionValue,
        priority_level: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        metadata?: Record<string, any>
    ): CognitiveItem {
        const task = CognitiveItemFactory.createTask(content, attention, {
            status: 'pending',
            priority_level,
            dependencies: parentIds,
            ...metadata
        });
        
        // Update the stamp to include parent IDs
        task.stamp.parent_ids = parentIds;
        task.stamp.schema_id = 'task-factory';
        
        return task;
    }
    
    /**
     * Create a subtask cognitive item
     * @param parentId The ID of the parent task
     * @param content The content of the task
     * @param attention The attention value for the task
     * @param priority_level The priority level of the task
     * @param metadata Optional metadata for the task
     * @returns A new subtask cognitive item
     */
    static createSubtask(
        parentId: string,
        content: string,
        attention: AttentionValue,
        priority_level: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        metadata?: Record<string, any>
    ): CognitiveItem {
        const task = CognitiveItemFactory.createTask(content, attention, {
            status: 'pending',
            priority_level,
            ...metadata
        });
        
        // Set parent relationship
        if (task.task_metadata) {
            task.task_metadata.parent_id = parentId;
        }
        task.stamp.parent_ids = [parentId];
        task.stamp.schema_id = 'task-factory';
        
        return task;
    }
}