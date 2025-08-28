export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'FAILED' | 'AWAITING_DEPENDENCIES' | 'DECOMPOSING' | 'AWAITING_SUBTASKS' | 'READY_FOR_EXECUTION' | 'DEFERRED';

export interface Task {
  id: string;
  type: 'REGULAR' | 'AGENT';
  title: string;
  description?: string;
  status: TaskStatus;
}
