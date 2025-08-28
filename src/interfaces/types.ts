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

export interface DerivationStamp { // Added
    timestamp: number;
    parent_ids: string[];
    schema_id: string;
    module?: string;
}

export interface TaskMetadata {
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred';
    priority: 'low' | 'medium' | 'high' | 'critical';
    dependencies?: string[]; // Array of task IDs
    deadline?: number; // Timestamp
    estimated_effort?: number;
    required_resources?: string[];
    outcomes?: string[];
    confidence?: number; // 0.0 to 1.0
    tags?: string[];
    categories?: string[];
    context?: Record<string, any>;
}

export interface CognitiveItem {
    id: string;                // Unique identifier
    atom_id: string;           // Reference to SemanticAtom (added)
    type: 'BELIEF' | 'GOAL' | 'QUERY' | 'EVENT'; // Item category
    label: string;             // Natural language representation (made required)
    truth?: TruthValue;        // Truth value for beliefs
    attention: AttentionValue; // Attention value for goals (made non-optional)
    meta?: Record<string, any>; // Metadata (domain, source, etc.)
    goal_parent_id?: string;   // Parent goal ID (added)
    goal_status?: "active" | "blocked" | "achieved" | "failed";
    stamp: DerivationStamp;    // Derivation stamp (added)
    payload?: Record<string, any>; // Payload for events/actions (added)
    task_metadata?: TaskMetadata; // Task-specific metadata
}