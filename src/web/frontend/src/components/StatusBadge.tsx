import React from 'react';
import { TaskStatus } from '../types';
import {
  FaBolt,
  FaCheck,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaInfoCircle,
  FaPause,
  FaSpinner,
  FaPlay,
} from 'react-icons/fa';
import styles from './StatusBadge.module.css';
import { taskUtils } from '../utils/taskUtils';

const statusIconMap: Record<TaskStatus, React.ElementType> = {
  pending: FaHourglassHalf,
  awaiting_dependencies: FaPause,
  decomposing: FaSpinner,
  awaiting_subtasks: FaHourglassHalf,
  ready_for_execution: FaPlay,
  completed: FaCheck,
  failed: FaExclamationTriangle,
  deferred: FaPause,
};

interface StatusBadgeProps {
  status: TaskStatus;
  isProcessing?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isProcessing = false,
}) => {
  const Icon = statusIconMap[status] || FaInfoCircle;
  const statusText = taskUtils.getStatusText(status);
  const statusClass = taskUtils.getStatusClass(status);

  const badgeClassName = `${styles.badge} ${statusClass} ${isProcessing ? styles.processing : ''}`;

  return (
    <span className={badgeClassName} title={statusText}>
      <Icon className={styles.icon} />
      <span className={styles.text}>{statusText}</span>
    </span>
  );
};

export default StatusBadge;
