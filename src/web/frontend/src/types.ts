// Task is now simply a type alias for CognitiveItem with type 'TASK'
export type {Task} from '../../../interfaces/task';
export type {TaskStatus, TaskPriority} from '../../../interfaces/sharedTypes';

// Re-export the base interfaces to avoid circular dependencies
export type {AttentionValue, TruthValue, DerivationStamp} from '../../../interfaces/types';

// Stats panel types
export interface TaskStatistics {
    total: number;
    pending: number;
    awaiting_dependencies: number;
    decomposing: number;
    awaiting_subtasks: number;
    ready_for_execution: number;
    completed: number;
    failed: number;
    deferred: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    timestamp: number;
}

export type PromptType = 'text_input' | 'multiple_choice' | 'confirmation';
export type PromptStatus = 'pending' | 'answered' | 'dismissed';

export interface Prompt {
    id: string;
    taskId: string;
    message: string;
    type: PromptType;
    options?: string[]; // For 'multiple_choice'
    status: PromptStatus;
    timestamp: number;
}