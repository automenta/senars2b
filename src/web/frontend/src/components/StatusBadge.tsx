import React from 'react';
import { TaskStatus } from '../types';
import { FaHourglassHalf, FaBolt, FaCheck, FaPause, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import styles from './StatusBadge.module.css';

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; className: string }> = {
  PENDING: { icon: FaHourglassHalf, color: '#6c757d', className: styles.pending },
  IN_PROGRESS: { icon: FaBolt, color: '#0d6efd', className: styles.inProgress },
  COMPLETED: { icon: FaCheck, color: '#198754', className: styles.completed },
  PAUSED: { icon: FaPause, color: '#ffc107', className: styles.paused },
  FAILED: { icon: FaExclamationTriangle, color: '#dc3545', className: styles.failed },
  DEFERRED: { icon: FaPause, color: '#ffc107', className: styles.deferred },
  AWAITING_DEPENDENCIES: { icon: FaHourglassHalf, color: '#6c757d', className: styles.awaiting },
  DECOMPOSING: { icon: FaBolt, color: '#0d6efd', className: styles.decomposing },
  AWAITING_SUBTASKS: { icon: FaHourglassHalf, color: '#6c757d', className: styles.awaiting },
  READY_FOR_EXECUTION: { icon: FaBolt, color: '#0d6efd', className: styles.ready },
  completed: { icon: FaCheck, color: '#198754', className: styles.completed },
  failed: { icon: FaExclamationTriangle, color: '#dc3545', className: styles.failed },
  deferred: { icon: FaPause, color: '#ffc107', className: styles.deferred },
  pending: { icon: FaHourglassHalf, color: '#6c757d', className: styles.pending },
};

interface StatusBadgeProps {
  status: TaskStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || { icon: FaInfoCircle, color: '#6c757d', className: styles.default };
  const Icon = config.icon;

  return (
    <span className={`${styles.badge} ${config.className}`}>
      <Icon />
      {status}
    </span>
  );
};

export default StatusBadge;
