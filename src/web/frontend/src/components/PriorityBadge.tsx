import React from 'react';
import { TaskPriority } from '../types';
import styles from './PriorityBadge.module.css';

const priorityConfig: Record<TaskPriority, { className: string }> = {
  low: { className: styles.low },
  medium: { className: styles.medium },
  high: { className: styles.high },
  critical: { className: styles.critical },
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = priorityConfig[priority] || { className: styles.low };

  return (
    <span className={`${styles.badge} ${config.className}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
