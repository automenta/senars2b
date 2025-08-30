// Shared types between frontend and backend
export type TaskStatus =
    'pending'
    | 'awaiting_dependencies'
    | 'decomposing'
    | 'awaiting_subtasks'
    | 'ready_for_execution'
    | 'completed'
    | 'failed'
    | 'deferred';

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