import React from 'react';
import { TaskStatus } from '../types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: TaskStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
    pending: { 
      label: 'Pending', 
      className: styles.pending 
    },
    awaiting_dependencies: { 
      label: 'Awaiting Dependencies', 
      className: styles.awaitingDependencies 
    },
    decomposing: { 
      label: 'Decomposing', 
      className: styles.decomposing 
    },
    awaiting_subtasks: { 
      label: 'Awaiting Subtasks', 
      className: styles.awaitingSubtasks 
    },
    ready_for_execution: { 
      label: 'Ready for Execution', 
      className: styles.readyForExecution 
    },
    completed: { 
      label: 'Completed', 
      className: styles.completed 
    },
    failed: { 
      label: 'Failed', 
      className: styles.failed 
    },
    deferred: { 
      label: 'Deferred', 
      className: styles.deferred 
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`${styles.statusBadge} ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;