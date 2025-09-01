import React, {useState, useCallback} from 'react';
import {Task, TaskPriority} from '../../types';
import styles from './TaskPrioritization.module.css';
import {FaGripVertical, FaExclamationCircle, FaCheck} from 'react-icons/fa';

interface TaskPrioritizationProps {
    tasks: Task[];
    onSavePriorities: (priorities: { taskId: string; priority: TaskPriority }[]) => void;
    onCancel: () => void;
}

const TaskPrioritization: React.FC<TaskPrioritizationProps> = ({tasks, onSavePriorities, onCancel}) => {
    const [prioritizedTasks, setPrioritizedTasks] = useState<Task[]>([...tasks]);
    const [saved, setSaved] = useState(false);

    const moveTask = useCallback((dragIndex: number, hoverIndex: number) => {
        setPrioritizedTasks(prev => {
            const newTasks = [...prev];
            const draggedTask = newTasks[dragIndex];
            newTasks.splice(dragIndex, 1);
            newTasks.splice(hoverIndex, 0, draggedTask);
            return newTasks;
        });
    }, []);

    const getPriorityForPosition = (index: number): TaskPriority => {
        const total = prioritizedTasks.length;
        if (total === 0) return 'medium';

        const ratio = index / total;
        if (ratio < 0.2) return 'critical';
        if (ratio < 0.4) return 'high';
        if (ratio < 0.6) return 'medium';
        if (ratio < 0.8) return 'low';
        return 'low';
    };

    const handleSave = useCallback(() => {
        const priorities = prioritizedTasks.map((task, index) => ({
            taskId: task.id,
            priority: getPriorityForPosition(index)
        }));
        onSavePriorities(priorities);
        setSaved(true);
    }, [prioritizedTasks, onSavePriorities]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Task Prioritization</h2>
                <p>Drag and drop tasks to reorder them by priority</p>
            </div>

            <div className={styles.priorityLegend}>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.critical}`}></div>
                    <span>Critical</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.high}`}></div>
                    <span>High</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.medium}`}></div>
                    <span>Medium</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.low}`}></div>
                    <span>Low</span>
                </div>
            </div>

            <div className={styles.taskList}>
                {prioritizedTasks.map((task, index) => {
                    const priority = getPriorityForPosition(index);
                    return (
                        <TaskPriorityItem
                            key={task.id}
                            task={task}
                            priority={priority}
                            index={index}
                            moveTask={moveTask}
                        />
                    );
                })}
            </div>

            <div className={styles.actions}>
                <button className={styles.cancelButton} onClick={onCancel}>
                    Cancel
                </button>
                <button className={styles.saveButton} onClick={handleSave} disabled={saved}>
                    {saved ? (
                        <>
                            <FaCheck/> Saved!
                        </>
                    ) : (
                        'Save Priorities'
                    )}
                </button>
            </div>
        </div>
    );
};

interface TaskPriorityItemProps {
    task: Task;
    priority: TaskPriority;
    index: number;
    moveTask: (dragIndex: number, hoverIndex: number) => void;
}

const TaskPriorityItem: React.FC<TaskPriorityItemProps> = ({task, priority, index, moveTask}) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = React.useRef<HTMLDivElement>(null);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', index.toString());
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIndex !== index) {
            moveTask(dragIndex, index);
        }
        setIsDragging(false);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            ref={dragRef}
            className={`${styles.taskItem} ${styles[priority]} ${isDragging ? styles.dragging : ''}`}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.dragHandle}>
                <FaGripVertical/>
            </div>
            <div className={styles.taskContent}>
                <h3 className={styles.taskTitle}>{task.title}</h3>
                <p className={styles.taskDescription}>{task.description}</p>
            </div>
            <div className={styles.priorityIndicator}>
                <FaExclamationCircle/>
                <span className={styles.priorityText}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
            </div>
        </div>
    );
};

export default TaskPrioritization;