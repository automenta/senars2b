import { TaskStatus, TaskPriority, Task as SharedTask } from '../../../interfaces/sharedTypes';

// Export shared types
export type { TaskStatus, TaskPriority };

// Extend shared task type for frontend-specific properties if needed
export interface Task extends SharedTask {
    // Add any frontend-specific properties here if needed
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
