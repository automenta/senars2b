import React, {useCallback} from 'react';
import {Task, TaskPriority, TaskStatus} from '../../types';
import {useTaskActions} from '../../hooks/useTaskActions';
import styles from './TaskContextMenu.module.css';
import {
    FaEdit,
    FaTrash,
    FaCheck,
    FaPause,
    FaPlay,
    FaStop,
    FaClone,
    FaArrowUp,
    FaArrowDown,
    FaTag,
    FaCalendarAlt
} from 'react-icons/fa';

interface TaskContextMenuProps {
    task: Task;
    onClose: () => void;
    onEdit: () => void;
    onClone: () => void;
    position: { x: number; y: number };
}

const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
                                                             task,
                                                             onClose,
                                                             onEdit,
                                                             onClone,
                                                             position
                                                         }) => {
    const {
        updateTask,
        deleteTask,
        completeTask,
        pauseTask,
        resumeTask,
        failTask
    } = useTaskActions();

    const handleDelete = useCallback(() => {
        deleteTask(task.id);
        onClose();
    }, [deleteTask, task.id, onClose]);

    const handleComplete = useCallback(() => {
        completeTask(task.id);
        onClose();
    }, [completeTask, task.id, onClose]);

    const handlePause = useCallback(() => {
        pauseTask(task.id);
        onClose();
    }, [pauseTask, task.id, onClose]);

    const handleResume = useCallback(() => {
        resumeTask(task.id);
        onClose();
    }, [resumeTask, task.id, onClose]);

    const handleFail = useCallback(() => {
        failTask(task.id);
        onClose();
    }, [failTask, task.id, onClose]);

    const handlePriorityChange = useCallback((priority: TaskPriority) => {
        updateTask(task.id, {priority});
        onClose();
    }, [updateTask, task.id, onClose]);

    const handleStatusChange = useCallback((status: TaskStatus) => {
        updateTask(task.id, {status});
        onClose();
    }, [updateTask, task.id, onClose]);

    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest(`.${styles.contextMenu}`)) {
            onClose();
        }
    }, [onClose]);

    React.useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <div
            className={styles.contextMenu}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`
            }}
        >
            <div className={styles.menuSection}>
                <button className={styles.menuItem} onClick={onEdit}>
                    <FaEdit className={styles.menuIcon}/>
                    Edit Task
                </button>
                <button className={styles.menuItem} onClick={onClone}>
                    <FaClone className={styles.menuIcon}/>
                    Clone Task
                </button>
            </div>

            <div className={styles.menuDivider}/>

            <div className={styles.menuSection}>
                {task.type === 'AGENT' ? (
                    <>
                        {task.status === 'deferred' || task.status === 'paused' ? (
                            <button className={styles.menuItem} onClick={handleResume}>
                                <FaPlay className={styles.menuIcon}/>
                                Resume
                            </button>
                        ) : (
                            <button className={styles.menuItem} onClick={handlePause}>
                                <FaPause className={styles.menuIcon}/>
                                Pause
                            </button>
                        )}
                        <button className={styles.menuItem} onClick={handleFail}>
                            <FaStop className={styles.menuIcon}/>
                            Stop
                        </button>
                    </>
                ) : (
                    <button className={styles.menuItem} onClick={handleComplete}>
                        <FaCheck className={styles.menuIcon}/>
                        Complete
                    </button>
                )}
                <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleDelete}>
                    <FaTrash className={styles.menuIcon}/>
                    Delete
                </button>
            </div>

            <div className={styles.menuDivider}/>

            <div className={styles.menuSection}>
                <div className={styles.menuLabel}>Priority</div>
                <div className={styles.priorityOptions}>
                    {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map(priority => (
                        <button
                            key={priority}
                            className={`${styles.priorityOption} ${styles[priority]} ${
                                task.priority === priority ? styles.selected : ''
                            }`}
                            onClick={() => handlePriorityChange(priority)}
                        >
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.menuDivider}/>

            <div className={styles.menuSection}>
                <div className={styles.menuLabel}>Status</div>
                <div className={styles.statusOptions}>
                    {([
                        'pending',
                        'awaiting_dependencies',
                        'decomposing',
                        'awaiting_subtasks',
                        'ready_for_execution',
                        'completed',
                        'failed',
                        'deferred'
                    ] as TaskStatus[]).map(status => (
                        <button
                            key={status}
                            className={`${styles.statusOption} ${
                                task.status === status ? styles.selected : ''
                            }`}
                            onClick={() => handleStatusChange(status)}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskContextMenu;