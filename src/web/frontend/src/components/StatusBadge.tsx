import React from 'react';
import {TaskStatus} from '../types';
import {
    FaCheck,
    FaExclamationTriangle,
    FaHourglassHalf,
    FaInfoCircle,
    FaPause,
    FaSpinner,
    FaPlay
} from 'react-icons/fa';
import styles from './StatusBadge.module.css';

// Local utility functions for status operations
const getStatusText = (status: TaskStatus): string => {
    const statusMap: Record<TaskStatus, string> = {
        'pending': 'Pending',
        'awaiting_dependencies': 'Awaiting Dependencies',
        'decomposing': 'Decomposing',
        'awaiting_subtasks': 'Awaiting Subtasks',
        'ready_for_execution': 'Ready for Execution',
        'completed': 'Completed',
        'failed': 'Failed',
        'deferred': 'Deferred',
    };

    return statusMap[status] || status;
};

const getStatusClass = (status: TaskStatus): string => {
    const statusClassMap: Record<TaskStatus, string> = {
        'pending': 'status-pending',
        'awaiting_dependencies': 'status-awaiting-dependencies',
        'decomposing': 'status-decomposing',
        'awaiting_subtasks': 'status-awaiting-subtasks',
        'ready_for_execution': 'status-ready-for-execution',
        'completed': 'status-completed',
        'failed': 'status-failed',
        'deferred': 'status-deferred',
    };

    return statusClassMap[status] || `status-${status}`;
};

const statusIconMap: Record<TaskStatus, React.ElementType> = {
    'pending': FaHourglassHalf,
    'awaiting_dependencies': FaPause,
    'decomposing': FaSpinner,
    'awaiting_subtasks': FaHourglassHalf,
    'ready_for_execution': FaPlay,
    'completed': FaCheck,
    'failed': FaExclamationTriangle,
    'deferred': FaPause,
};

interface StatusBadgeProps {
    status: TaskStatus;
    isProcessing?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({status, isProcessing = false}) => {
    const Icon = statusIconMap[status] || FaInfoCircle;
    const statusText = getStatusText(status);
    const statusClass = getStatusClass(status);

    const badgeClassName = `${styles.badge} ${statusClass} ${isProcessing ? styles.processing : ''}`;

    return (
        <span className={badgeClassName} title={statusText}>
            <Icon className={styles.icon}/>
            <span className={styles.text}>{statusText}</span>
        </span>
    );
};

export default StatusBadge;
