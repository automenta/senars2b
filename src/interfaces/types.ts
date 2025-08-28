export interface SemanticAtom {
    id: string;                // Unique identifier
    content: any;              // Natural language content or object (changed from string)
    embedding: number[];       // Semantic vector representation
    creationTime: number;      // Timestamp of creation (added)
    lastAccessTime: number;    // Timestamp of last access (added)
    meta: Record<string, any>; // Metadata (added)
}

export interface TruthValue {
    frequency: number;         // Evidence frequency (0.0 to 1.0)
    confidence: number;        // Evidence amount (0.0 to 1.0)
}

export interface AttentionValue {
    priority: number;          // Current importance (0.0 to 1.0)
    durability: number;        // Persistence of importance (0.0 to 1.0)
}

export interface DerivationStamp {
    timestamp: number;
    parent_ids: string[];
    schema_id: string;
    module?: string;
}

// Task-specific metadata that extends CognitiveItem
export interface TaskMetadata {
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
    completion_percentage?: number; // 0-100
    group_id?: string; // Identifier for grouping related tasks
}

export interface CognitiveItem {
    id: string;                // Unique identifier
    atom_id: string;           // Reference to SemanticAtom (added)
    type: 'BELIEF' | 'GOAL' | 'QUERY' | 'EVENT' | 'TASK'; // Item category (added TASK)
    label: string;             // Natural language representation (made required)
    content?: any;             // Content of the item (added for tasks)
    truth?: TruthValue;        // Truth value for beliefs
    attention: AttentionValue; // Attention value for goals (made non-optional)
    meta?: Record<string, any>; // Metadata (domain, source, etc.)
    goal_parent_id?: string;   // Parent goal ID (added)
    goal_status?: "active" | "blocked" | "achieved" | "failed";
    stamp: DerivationStamp;    // Derivation stamp (added)
    payload?: Record<string, any>; // Payload for events/actions (added)
    
    // Task-specific properties (only used when type is 'TASK')
    task_metadata?: TaskMetadata;
    
    // Task relationships (only used when type is 'TASK')
    parent_id?: string;        // Parent task ID
    subtasks?: string[];       // Subtask IDs
    
    // Task timestamps (only used when type is 'TASK')
    created_at?: number;       // Creation timestamp
    updated_at?: number;       // Last update timestamp
}