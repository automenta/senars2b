import { Task, TaskPriority, TaskStatus } from '../types';

// Utility functions for task operations
export const taskUtils = {
  // Calculate task progress based on subtasks
  calculateProgress: (task: Task, allTasks: Task[]): number => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.completion_percentage || 0;
    }

    const subtaskObjects = allTasks.filter((t) => task.subtasks.includes(t.id));
    if (subtaskObjects.length === 0) return 0;

    const totalProgress = subtaskObjects.reduce((sum, subtask) => {
      return sum + (subtask.completion_percentage || 0);
    }, 0);

    return Math.round(totalProgress / subtaskObjects.length);
  },

  // Check if task is completed
  isCompleted: (task: Task): boolean => {
    return task.status === 'completed';
  },

  // Check if task is failed
  isFailed: (task: Task): boolean => {
    return task.status === 'failed';
  },

  // Check if task is in progress
  isInProgress: (task: Task): boolean => {
    // A task is "in progress" if it's in an active, non-terminal state.
    return ['decomposing', 'awaiting_subtasks', 'ready_for_execution'].includes(
      task.status
    );
  },

  // Get status display text
  getStatusText: (status: TaskStatus): string => {
    const statusMap: Record<TaskStatus, string> = {
      pending: 'Pending',
      awaiting_dependencies: 'Awaiting Dependencies',
      decomposing: 'Decomposing',
      awaiting_subtasks: 'Awaiting Subtasks',
      ready_for_execution: 'Ready for Execution',
      completed: 'Completed',
      failed: 'Failed',
      deferred: 'Deferred',
    };

    return statusMap[status] || status;
  },

  // Get priority display text
  getPriorityText: (priority: TaskPriority): string => {
    const priorityMap: Record<TaskPriority, string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
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
      pending: 'status-pending',
      awaiting_dependencies: 'status-awaiting-dependencies',
      decomposing: 'status-decomposing',
      awaiting_subtasks: 'status-awaiting-subtasks',
      ready_for_execution: 'status-ready-for-execution',
      completed: 'status-completed',
      failed: 'status-failed',
      deferred: 'status-deferred',
    };

    return statusClassMap[status] || `status-${status.toLowerCase()}`;
  },

  // Sort tasks by priority
  sortByPriority: (tasks: Task[], ascending: boolean = false): Task[] => {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
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
      pending: 1,
      awaiting_dependencies: 2,
      decomposing: 3,
      awaiting_subtasks: 4,
      ready_for_execution: 5,
      deferred: 6,
      completed: 7,
      failed: 8,
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
    return tasks.filter((task) => task.status === status);
  },

  // Filter tasks by type
  filterByType: (tasks: Task[], type: 'REGULAR' | 'AGENT' | 'ALL'): Task[] => {
    if (type === 'ALL') return tasks;
    return tasks.filter((task) => task.type === type);
  },

  // Search tasks by title or description
  searchTasks: (tasks: Task[], searchTerm: string): Task[] => {
    if (!searchTerm) return tasks;

    const term = searchTerm.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term))
    );
  },
};
