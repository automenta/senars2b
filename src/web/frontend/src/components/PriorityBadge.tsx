import React from 'react';
import { TaskPriority } from '../types';
import styles from './PriorityBadge.module.css';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
    critical: { 
      label: 'Critical', 
      className: styles.critical 
    },
    high: { 
      label: 'High', 
      className: styles.high 
    },
    medium: { 
      label: 'Medium', 
      className: styles.medium 
    },
    low: { 
      label: 'Low', 
      className: styles.low 
    }
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`${styles.priorityBadge} ${config.className}`}>
      {config.label}
    </span>
  );
};

export default PriorityBadge;