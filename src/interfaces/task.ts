import { AttentionValue as BaseAttentionValue, TruthValue as BaseTruthValue, DerivationStamp as BaseDerivationStamp } from './types';

export interface Task {
    id: string;
    atom_id: string;
    label: string;
    content: any;
    attention: AttentionValue;
    truth?: TruthValue;
    stamp: DerivationStamp;
    type: 'TASK';
    
    // Task-specific properties
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred';
    priority_level: 'low' | 'medium' | 'high' | 'critical';
    dependencies?: string[]; // Array of task IDs
    deadline?: number; // Timestamp
    estimated_effort?: number;
    required_resources?: string[];
    outcomes?: string[];
    confidence?: number; // 0.0 to 1.0
    tags?: string[];
    categories?: string[];
    context?: Record<string, any>;
    
    // Relationships
    parent_id?: string;
    subtasks: string[];
    
    // Metadata
    created_at: number;
    updated_at: number;
    metadata?: Record<string, any>;
}

// Re-export the base interfaces to avoid circular dependencies
export type AttentionValue = BaseAttentionValue;
export type TruthValue = BaseTruthValue;
export type DerivationStamp = BaseDerivationStamp;