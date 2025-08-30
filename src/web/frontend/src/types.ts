export type TaskStatus =
    'PENDING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'PAUSED'
    | 'FAILED'
    | 'AWAITING_DEPENDENCIES'
    | 'DECOMPOSING'
    | 'AWAITING_SUBTASKS'
    | 'READY_FOR_EXECUTION'
    | 'DEFERRED'
    | 'completed'
    | 'failed'
    | 'deferred'
    | 'pending';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
    id: string;
    type: 'REGULAR' | 'AGENT';
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    completion_percentage?: number;
    parent_id?: string;
    subtasks: string[];
    creation_time?: number;
}

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
