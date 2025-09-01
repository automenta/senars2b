import React, {memo, useMemo} from 'react';
import {Task, TaskStatus} from '../types';
import TaskCard from './TaskCard';
import styles from './BoardView.module.css';

interface BoardViewProps {
    tasks: Task[];
    sendMessage: (message: any) => void;
}

// Define columns for the board view based on task statuses
const columns: { id: TaskStatus, title: string }[] = [
    {id: 'pending', title: 'Pending'},
    {id: 'awaiting_dependencies', title: 'Awaiting Dependencies'},
    {id: 'decomposing', title: 'Decomposing'},
    {id: 'awaiting_subtasks', title: 'Awaiting Subtasks'},
    {id: 'ready_for_execution', title: 'Ready for Execution'},
    {id: 'completed', title: 'Completed'},
    {id: 'failed', title: 'Failed'},
    {id: 'deferred', title: 'Deferred'}
];

const BoardView: React.FC<BoardViewProps> = memo(({tasks, sendMessage}) => {
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

    return (
        <div className={styles.board}>
            {columns.map(column => (
                <div key={column.id} className={styles.column}>
                    <div className={styles.columnHeader}>
                        <h3>{column.title}</h3>
                        <span className={styles.taskCount}>{tasksByStatus[column.id].length}</span>
                    </div>
                    <div className={styles.taskList}>
                        {tasksByStatus[column.id].map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                allFilteredTasks={tasks}
                                sendMessage={sendMessage}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
});

export default BoardView;