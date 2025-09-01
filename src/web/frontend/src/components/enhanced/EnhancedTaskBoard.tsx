import React, {memo, useMemo, useCallback} from 'react';
import {Task, TaskStatus} from '../../types';
import EnhancedTaskCard from './EnhancedTaskCard';
import styles from './EnhancedTaskBoard.module.css';
import {FaPlus, FaTasks} from 'react-icons/fa';

interface EnhancedTaskBoardProps {
    tasks: Task[];
    sendMessage: (message: any) => void;
    onAddTask?: (status: TaskStatus) => void;
}

// Define columns for the board view based on task statuses
const columns: { id: TaskStatus, title: string, color: string }[] = [
    {id: 'pending', title: 'Pending', color: 'var(--color-pending)'},
    {id: 'awaiting_dependencies', title: 'Awaiting Dependencies', color: 'var(--color-awaiting)'},
    {id: 'decomposing', title: 'Decomposing', color: 'var(--color-decomposing)'},
    {id: 'awaiting_subtasks', title: 'Awaiting Subtasks', color: 'var(--color-awaiting)'},
    {id: 'ready_for_execution', title: 'Ready for Execution', color: 'var(--color-ready)'},
    {id: 'completed', title: 'Completed', color: 'var(--color-completed)'},
    {id: 'failed', title: 'Failed', color: 'var(--color-failed)'},
    {id: 'deferred', title: 'Deferred', color: 'var(--color-deferred)'}
];

const EnhancedTaskBoard: React.FC<EnhancedTaskBoardProps> = memo(({tasks, sendMessage, onAddTask}) => {
    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = {} as Record<TaskStatus, Task[]>;

        // Initialize empty arrays for each status
        columns.forEach(column => {
            grouped[column.id] = [];
        });

        // Group tasks
        tasks.forEach(task => {
            if (task.status in grouped) {
                grouped[task.status].push(task);
            }
        });

        return grouped;
    }, [tasks]);

    const handleAddTaskToColumn = useCallback((status: TaskStatus) => {
        if (onAddTask) {
            onAddTask(status);
        }
    }, [onAddTask]);

    const handleDelete = useCallback((taskId: string) => {
        sendMessage({
            type: 'DELETE_TASK',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handleComplete = useCallback((taskId: string) => {
        sendMessage({
            type: 'COMPLETE_TASK',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handlePause = useCallback((taskId: string) => {
        sendMessage({
            type: 'PAUSE_AGENT',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handleResume = useCallback((taskId: string) => {
        sendMessage({
            type: 'RESUME_AGENT',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    const handleStop = useCallback((taskId: string) => {
        sendMessage({
            type: 'FAIL_TASK',
            payload: {
                id: taskId
            },
        });
    }, [sendMessage]);

    return (
        <div className={styles.board}>
            {columns.map(column => (
                <div key={column.id} className={styles.column}>
                    <div
                        className={styles.columnHeader}
                        style={{borderBottomColor: column.color}}
                    >
                        <div className={styles.columnTitle}>
                            <h3>{column.title}</h3>
                            <span className={styles.taskCount}>{tasksByStatus[column.id].length}</span>
                        </div>
                        <button
                            className={styles.addColumnButton}
                            onClick={() => handleAddTaskToColumn(column.id)}
                            aria-label={`Add task to ${column.title}`}
                        >
                            <FaPlus/>
                        </button>
                    </div>
                    <div className={styles.taskList}>
                        {tasksByStatus[column.id].map(task => (
                            <EnhancedTaskCard
                                key={task.id}
                                task={task}
                                allFilteredTasks={tasks}
                                sendMessage={sendMessage}
                                onDelete={() => handleDelete(task.id)}
                                onComplete={() => handleComplete(task.id)}
                                onPause={() => handlePause(task.id)}
                                onResume={() => handleResume(task.id)}
                                onStop={() => handleStop(task.id)}
                            />
                        ))}
                        {tasksByStatus[column.id].length === 0 && (
                            <div className={styles.emptyColumn}>
                                <FaTasks className={styles.emptyIcon}/>
                                <p>No tasks in this column</p>
                                <button
                                    className={styles.addTaskButton}
                                    onClick={() => handleAddTaskToColumn(column.id)}
                                >
                                    Add Task
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
});

export default EnhancedTaskBoard;