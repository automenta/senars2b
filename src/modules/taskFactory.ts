import { Task, AttentionValue, TruthValue, DerivationStamp } from '../interfaces/task';
import { v4 as uuidv4 } from 'uuid';

export class TaskFactory {
    static createTask(
        content: string,
        attention: AttentionValue,
        priority_level: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        metadata?: Record<string, any>
    ): Task {
        const id = uuidv4();
        const atom_id = uuidv4();
        
        return {
            id,
            atom_id,
            label: content,
            content,
            attention,
            type: 'TASK',
            status: 'pending',
            priority_level,
            subtasks: [],
            created_at: Date.now(),
            updated_at: Date.now(),
            metadata,
            stamp: {
                timestamp: Date.now(),
                parent_ids: [],
                schema_id: 'task-factory'
            }
        };
    }
    
    static createDerivedTask(
        parentIds: string[],
        content: string,
        attention: AttentionValue,
        priority_level: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        metadata?: Record<string, any>
    ): Task {
        const id = uuidv4();
        const atom_id = uuidv4();
        
        return {
            id,
            atom_id,
            label: content,
            content,
            attention,
            type: 'TASK',
            status: 'pending',
            priority_level,
            dependencies: parentIds,
            subtasks: [],
            created_at: Date.now(),
            updated_at: Date.now(),
            metadata,
            stamp: {
                timestamp: Date.now(),
                parent_ids: parentIds,
                schema_id: 'task-factory'
            }
        };
    }
    
    static createSubtask(
        parentId: string,
        content: string,
        attention: AttentionValue,
        priority_level: 'low' | 'medium' | 'high' | 'critical' = 'medium',
        metadata?: Record<string, any>
    ): Task {
        const id = uuidv4();
        const atom_id = uuidv4();
        
        return {
            id,
            atom_id,
            label: content,
            content,
            attention,
            type: 'TASK',
            status: 'pending',
            priority_level,
            parent_id: parentId,
            subtasks: [],
            created_at: Date.now(),
            updated_at: Date.now(),
            metadata,
            stamp: {
                timestamp: Date.now(),
                parent_ids: [parentId],
                schema_id: 'task-factory'
            }
        };
    }
}