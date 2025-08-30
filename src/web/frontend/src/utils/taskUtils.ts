import { Task, TaskPriority, TaskStatus } from '../types';

// Utility functions for task operations
export const taskUtils = {
    // Calculate task progress based on subtasks
    calculateProgress: (task: Task, allTasks: Task[]): number => {
        if (!task.subtasks || task.subtasks.length === 0) {
            return task.completion_percentage || 0;
        }
        
        const subtaskObjects = allTasks.filter(t => task.subtasks.includes(t.id));
        if (subtaskObjects.length === 0) return 0;
        
        const totalProgress = subtaskObjects.reduce((sum, subtask) => {
            return sum + (subtask.completion_percentage || 0);
        }, 0);
        
        return Math.round(totalProgress / subtaskObjects.length);
    },
    
    // Check if task is completed
    isCompleted: (task: Task): boolean => {
        return task.status === 'COMPLETED' || task.status === 'completed';
    },
    
    // Check if task is failed
    isFailed: (task: Task): boolean => {
        return task.status === 'FAILED' || task.status === 'failed';
    },
    
    // Check if task is in progress
    isInProgress: (task: Task): boolean => {
        return task.status === 'IN_PROGRESS';
    },
    
    // Get status display text
    getStatusText: (status: TaskStatus): string => {
        const statusMap: Record<TaskStatus, string> = {
            'PENDING': 'Pending',
            'IN_PROGRESS': 'In Progress',
            'COMPLETED': 'Completed',
            'PAUSED': 'Paused',
            'FAILED': 'Failed',
            'AWAITING_DEPENDENCIES': 'Awaiting Dependencies',
            'DECOMPOSING': 'Decomposing',
            'AWAITING_SUBTASKS': 'Awaiting Subtasks',
            'READY_FOR_EXECUTION': 'Ready for Execution',
            'DEFERRED': 'Deferred',
            'completed': 'Completed',
            'failed': 'Failed',
            'deferred': 'Deferred',
            'pending': 'Pending'
        };
        
        return statusMap[status] || status;
    },
    
    // Get priority display text
    getPriorityText: (priority: TaskPriority): string => {
        const priorityMap: Record<TaskPriority, string> = {
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Critical'
        };
        
        return priorityMap[priority] || priority;
    },
    
    // Get priority color class
    getPriorityClass: (priority: TaskPriority): string => {
        return `priority-${priority}`;
    },
    
    // Get status color class
    getStatusClass: (status: TaskStatus): string => {
        const statusClassMap: Record<TaskStatus, string> = {
            'PENDING': 'status-pending',
            'IN_PROGRESS': 'status-in-progress',
            'COMPLETED': 'status-completed',
            'PAUSED': 'status-paused',
            'FAILED': 'status-failed',
            'AWAITING_DEPENDENCIES': 'status-awaiting-dependencies',
            'DECOMPOSING': 'status-decomposing',
            'AWAITING_SUBTASKS': 'status-awaiting-subtasks',
            'READY_FOR_EXECUTION': 'status-ready-for-execution',
            'DEFERRED': 'status-deferred',
            'completed': 'status-completed',
            'failed': 'status-failed',
            'deferred': 'status-deferred',
            'pending': 'status-pending'
        };
        
        return statusClassMap[status] || `status-${status.toLowerCase()}`;
    },
    
    // Sort tasks by priority
    sortByPriority: (tasks: Task[], ascending: boolean = false): Task[] => {
        const priorityOrder: Record<TaskPriority, number> = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1,
        };
        
        return [...tasks].sort((a, b) => {
            const priorityA = priorityOrder[a.priority] || 0;
            const priorityB = priorityOrder[b.priority] || 0;
            
            return ascending ? priorityA - priorityB : priorityB - priorityA;
        });
    },
    
    // Sort tasks by status
    sortByStatus: (tasks: Task[]): Task[] => {
        const statusOrder: Record<TaskStatus, number> = {
            'PENDING': 1,
            'pending': 1,
            'AWAITING_DEPENDENCIES': 2,
            'DECOMPOSING': 3,
            'AWAITING_SUBTASKS': 4,
            'READY_FOR_EXECUTION': 5,
            'IN_PROGRESS': 6,
            'PAUSED': 7,
            'DEFERRED': 8,
            'deferred': 8,
            'COMPLETED': 9,
            'completed': 9,
            'FAILED': 10,
            'failed': 10
        };
        
        return [...tasks].sort((a, b) => {
            const statusA = statusOrder[a.status] || 0;
            const statusB = statusOrder[b.status] || 0;
            
            return statusA - statusB;
        });
    },
    
    // Filter tasks by status
    filterByStatus: (tasks: Task[], status: TaskStatus | 'ALL'): Task[] => {
        if (status === 'ALL') return tasks;
        return tasks.filter(task => task.status === status);
    },
    
    // Filter tasks by type
    filterByType: (tasks: Task[], type: 'REGULAR' | 'AGENT' | 'ALL'): Task[] => {
        if (type === 'ALL') return tasks;
        return tasks.filter(task => task.type === type);
    },
    
    // Search tasks by title or description
    searchTasks: (tasks: Task[], searchTerm: string): Task[] => {
        if (!searchTerm) return tasks;
        
        const term = searchTerm.toLowerCase();
        return tasks.filter(task => 
            task.title.toLowerCase().includes(term) || 
            (task.description && task.description.toLowerCase().includes(term))
        );
    }
};