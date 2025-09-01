import React, {useMemo} from 'react';
import {Task, TaskStatus} from '../../types';
import EnhancedTaskEntity from './EnhancedTaskEntity';
import styles from './TaskBoard.module.css';

interface TaskBoardProps {
    tasks: Task[];
    selectedTaskId: string | null;
    onTaskSelect: (taskId: string | null) => void;
    onTaskEditStart: (taskId: string) => void;
    onTaskEditEnd: (taskId: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({
                                                 tasks,
                                                 selectedTaskId,
                                                 onTaskSelect,
                                                 onTaskEditStart,
                                                 onTaskEditEnd
                                             }) => {
    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const groups: Record<TaskStatus, Task[]> = {
            'pending': [],
            'awaiting_dependencies': [],
            'decomposing': [],
            'awaiting_subtasks': [],
            'ready_for_execution': [],
            'completed': [],
            'failed': [],
            'deferred': []
        };

        tasks.forEach(task => {
            groups[task.status].push(task);
        });

        return groups;
    }, [tasks]);

    const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
        {status: 'pending', title: 'To Do', color: '#f0f0f0'},
        {status: 'awaiting_dependencies', title: 'Blocked', color: '#fff8e6'},
        {status: 'decomposing', title: 'Planning', color: '#e3f2fd'},
        {status: 'awaiting_subtasks', title: 'Waiting', color: '#fce4ec'},
        {status: 'ready_for_execution', title: 'In Progress', color: '#e8f5e9'},
        {status: 'completed', title: 'Done', color: '#e6f4ea'},
        {status: 'failed', title: 'Failed', color: '#fce8e6'},
        {status: 'deferred', title: 'Deferred', color: '#fef7e0'}
    ];

    return (
        <div className={styles.taskBoard}>
            {statusColumns.map(column => (
                <div
                    key={column.status}
                    className={styles.column}
                    style={{'--column-bg': column.color} as React.CSSProperties}
                >
                    <div className={styles.columnHeader}>
                        <h3 className={styles.columnTitle}>
                            {column.title}
                            <span className={styles.taskCount}>
                ({tasksByStatus[column.status].length})
              </span>
                        </h3>
                    </div>
                    <div className={styles.columnContent}>
                        {tasksByStatus[column.status].map(task => (
                            <EnhancedTaskEntity
                                key={task.id}
                                task={task}
                                isSelected={selectedTaskId === task.id}
                                isEditing={false}
                                isDraggable={true}
                                hasSubtasks={task.subtasks && task.subtasks.length > 0}
                                onEditStart={onTaskEditStart}
                                onEditEnd={onTaskEditEnd}
                                onToggleSelect={onTaskSelect}
                            />
                        ))}
                        {tasksByStatus[column.status].length === 0 && (
                            <div className={styles.emptyColumn}>
                                <p>No tasks</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TaskBoard;