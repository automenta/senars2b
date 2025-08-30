import React, {memo, useEffect, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {Task} from '../types';
import {FaChevronDown, FaChevronRight, FaEdit, FaGripVertical, FaSave, FaStream} from 'react-icons/fa';
import TaskList from './TaskList';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProgressBar from './ProgressBar';
import TaskControls from './TaskControls';
import styles from './TaskItem.module.css';

interface TaskItemProps {
    task: Task;
    allFilteredTasks: Task[];
    sendMessage: (message: any) => void;
    isDraggable?: boolean;
    isSelected?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = memo(({
                                                    task,
                                                    allFilteredTasks,
                                                    sendMessage,
                                                    isDraggable = false,
                                                    isSelected = false
                                                }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDescription, setEditedDescription] = useState(task.description || '');

    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            titleInputRef.current?.focus();
        }
    }, [isEditing]);

    const isDimmed = ['COMPLETED', 'FAILED'].includes(task.status.toUpperCase());
    const isProcessing = task.status === 'IN_PROGRESS';

    // Memoize subtasks calculation
    const subtasks = React.useMemo(
        () => allFilteredTasks.filter(t => t.parent_id === task.id),
        [allFilteredTasks, task.id]
    );

    const hasSubtasks = subtasks.length > 0;

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasSubtasks) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        sendMessage({
            type: 'UPDATE_TASK',
            payload: {
                id: task.id,
                title: editedTitle,
                description: editedDescription,
            },
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedTitle(task.title);
        setEditedDescription(task.description || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && isEditing) {
            handleSave();
        }
        if (e.key === 'Escape' && isEditing) {
            handleCancelEdit();
        }
    };

    const itemClassName = `${styles.item} ${isDimmed ? styles.dimmed : ''} ${isEditing ? styles.editing : ''} ${isSelected ? styles.selected : ''} ${isProcessing ? styles.processing : ''}`;

    return (
        <motion.div
            className={styles.container}
            layout
            initial={{opacity: 0, y: -20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, transition: {duration: 0.2}}}
        >
            <div className={itemClassName}>
                <div className={styles.mainInfo}>
                    {isDraggable && (
                        <span className={styles.dragHandle} aria-label="Drag to reorder">
                            <FaGripVertical/>
                        </span>
                    )}
                    <button
                        onClick={handleToggleExpand}
                        className={styles.expandBtn}
                        disabled={!hasSubtasks || isEditing}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                    >
                        {hasSubtasks ? (
                            isExpanded ? <FaChevronDown/> : <FaChevronRight/>
                        ) : (
                            <span className={styles.expandPlaceholder}/>
                        )}
                    </button>
                    <div className={styles.titleAndDescription}>
                        {isEditing ? (
                            <>
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={styles.titleInput}
                                    placeholder="Task title"
                                    aria-label="Edit task title"
                                />
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={styles.descriptionInput}
                                    placeholder="Task description"
                                    rows={3}
                                    aria-label="Edit task description"
                                />
                                <div className={styles.editActions}>
                                    <button
                                        onClick={handleSave}
                                        className={`${styles.button} ${styles.saveBtn}`}
                                        title="Save"
                                        aria-label="Save changes"
                                    >
                                        <FaSave/> Save
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className={`${styles.button} ${styles.cancelBtn}`}
                                        title="Cancel"
                                        aria-label="Cancel changes"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className={styles.title}>{task.title}</h3>
                                <p className={styles.description}>
                                    {task.description || <span className={styles.noDescription}>No description</span>}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.metaInfo}>
                    <StatusBadge status={task.status}/>
                    <PriorityBadge priority={task.priority}/>
                    {hasSubtasks && (
                        <div className={styles.subtaskIndicator} title={`${subtasks.length} subtasks`}>
                            <FaStream/> {subtasks.length}
                        </div>
                    )}
                </div>
                <div className={styles.progressContainer}>
                    <ProgressBar percentage={task.completion_percentage}/>
                </div>
                {!isEditing && (
                    <div className={styles.controlsContainer}>
                        <button
                            onClick={handleEdit}
                            className={`${styles.button} ${styles.editBtn}`}
                            title="Edit task"
                            aria-label="Edit task"
                        >
                            <FaEdit/>
                        </button>
                        <TaskControls task={task} sendMessage={sendMessage}/>
                    </div>
                )}
            </div>
            {isExpanded && hasSubtasks && (
                <div className={styles.subTaskContainer}>
                    <TaskList tasks={subtasks} sendMessage={sendMessage} isSublist={true}/>
                </div>
            )}
        </motion.div>
    );
});

export default TaskItem;
