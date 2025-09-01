import React, {useState, useCallback} from 'react';
import {Task, TaskPriority} from '../../types';
import EnhancedTaskEntity from './EnhancedTaskEntity';
import styles from './TaskPrioritization.module.css';
import {crdtTaskManager} from '../../crdtTaskManager';
import {FaArrowUp, FaArrowDown, FaSave, FaTimes, FaGripLines} from 'react-icons/fa';

interface TaskPrioritizationViewProps {
    tasks: Task[];
    onClose: () => void;
    onSave: () => void;
}

const TaskPrioritizationView: React.FC<TaskPrioritizationViewProps> = ({
                                                                           tasks,
                                                                           onClose,
                                                                           onSave
                                                                       }) => {
    const [prioritizedTasks, setPrioritizedTasks] = useState<Task[]>([...tasks]);
    const [isSaving, setIsSaving] = useState(false);

    const moveTask = useCallback((dragIndex: number, hoverIndex: number) => {
        setPrioritizedTasks(prev => {
            const newTasks = [...prev];
            const draggedTask = newTasks[dragIndex];
            newTasks.splice(dragIndex, 1);
            newTasks.splice(hoverIndex, 0, draggedTask);
            return newTasks;
        });
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, hoverIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIndex !== hoverIndex) {
            moveTask(dragIndex, hoverIndex);
        }
    }, [moveTask]);

    const moveTaskUp = useCallback((index: number) => {
        if (index > 0) {
            moveTask(index, index - 1);
        }
    }, [moveTask]);

    const moveTaskDown = useCallback((index: number) => {
        if (index < prioritizedTasks.length - 1) {
            moveTask(index, index + 1);
        }
    }, [moveTask, prioritizedTasks.length]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);

        // Update task priorities based on their position
        try {
            for (let i = 0; i < prioritizedTasks.length; i++) {
                const task = prioritizedTasks[i];
                let newPriority: TaskPriority = 'low';

                // Assign priority based on position
                if (i < prioritizedTasks.length * 0.1) {
                    newPriority = 'critical';
                } else if (i < prioritizedTasks.length * 0.3) {
                    newPriority = 'high';
                } else if (i < prioritizedTasks.length * 0.6) {
                    newPriority = 'medium';
                }

                // Update via CRDT manager
                if (task.priority !== newPriority) {
                    crdtTaskManager.updateTask(task.id, {priority: newPriority});
                }
            }

            onSave();
        } catch (error) {
            console.error('Error saving priorities:', error);
        } finally {
            setIsSaving(false);
        }
    }, [prioritizedTasks, onSave]);

    return (
        <div className={styles.overlay}>
            <div className={styles.prioritizationView}>
                <div className={styles.header}>
                    <h2>Task Prioritization</h2>
                    <p>Drag and drop tasks to reorder by priority, or use the arrow buttons</p>
                </div>

                <div className={styles.priorityLegend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.critical}`}></div>
                        <span>Critical (Top 10%)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.high}`}></div>
                        <span>High (Next 20%)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.medium}`}></div>
                        <span>Medium (Next 30%)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.legendColor} ${styles.low}`}></div>
                        <span>Low (Bottom 40%)</span>
                    </div>
                </div>

                <div className={styles.taskList}>
                    {prioritizedTasks.map((task, index) => (
                        <div
                            key={task.id}
                            className={styles.taskItem}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                        >
                            <div className={styles.dragHandle}>
                                <FaGripLines className={styles.dragIcon}/>
                            </div>

                            <div className={styles.taskContent}>
                                <EnhancedTaskEntity
                                    task={task}
                                    isDraggable={false}
                                    hasSubtasks={task.subtasks && task.subtasks.length > 0}
                                />
                            </div>

                            <div className={styles.taskActions}>
                                <button
                                    className={styles.actionButton}
                                    onClick={() => moveTaskUp(index)}
                                    disabled={index === 0}
                                    aria-label="Move up"
                                >
                                    <FaArrowUp/>
                                </button>
                                <button
                                    className={styles.actionButton}
                                    onClick={() => moveTaskDown(index)}
                                    disabled={index === prioritizedTasks.length - 1}
                                    aria-label="Move down"
                                >
                                    <FaArrowDown/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        <FaTimes/> Cancel
                    </button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <FaSave/> {isSaving ? 'Saving...' : 'Save Priorities'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskPrioritizationView;