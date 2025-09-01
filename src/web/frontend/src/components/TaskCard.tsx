import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {motion} from 'framer-motion';
import {Task} from '../types';
import {
    FaChevronDown,
    FaChevronRight,
    FaEdit,
    FaGripVertical,
    FaSave,
    FaStream,
    FaCommentAlt,
    FaCheckCircle,
    FaExclamationCircle
} from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProgressBar from './ProgressBar';
import styles from './TaskCard.module.css';
import {useStore} from "../store";
import {taskUtils} from '../utils/taskUtils';

interface TaskCardProps {
    task: Task;
    allFilteredTasks: Task[];
    isDraggable?: boolean;
    isSelected?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: (e: React.MouseEvent) => void;
    onEdit?: () => void;
    onSave?: (title: string, description: string) => void;
    onCancelEdit?: () => void;
    onTitleChange?: (title: string) => void;
    onDescriptionChange?: (description: string) => void;
    editedTitle?: string;
    editedDescription?: string;
    isEditing?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = memo(({
                                                    task,
                                                    allFilteredTasks,
                                                    isDraggable = false,
                                                    isSelected = false,
                                                    isExpanded = false,
                                                    onToggleExpand,
                                                    onEdit,
                                                    onSave,
                                                    onCancelEdit,
                                                    onTitleChange,
                                                    onDescriptionChange,
                                                    editedTitle = task.title,
                                                    editedDescription = task.description || '',
                                                    isEditing = false
                                                }) => {
    const getPendingPrompts = useStore(state => state.getPendingPrompts);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            titleInputRef.current?.focus();
        }
    }, [isEditing]);

    const isDimmed = taskUtils.isCompleted(task) || taskUtils.isFailed(task);
    const isProcessing = taskUtils.isInProgress(task);

    const subtasks = useMemo(
        () => allFilteredTasks.filter(t => t.parent_id === task.id),
        [allFilteredTasks, task.id]
    );

    const hasSubtasks = subtasks.length > 0;

    const hasPendingPrompt = useMemo(() => {
        // Safely call getPendingPrompts if it's a function
        if (typeof getPendingPrompts === 'function') {
            try {
                return getPendingPrompts().some(p => p.taskId === task.id);
            } catch (error) {
                console.error('Error getting pending prompts:', error);
                return false;
            }
        }
        return false;
    }, [getPendingPrompts, task.id]);

    const handleSave = () => {
        if (onSave) {
            onSave(editedTitle, editedDescription);
        }
    };

    const handleCancelEdit = () => {
        if (onCancelEdit) {
            onCancelEdit();
        }
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
            whileHover={{y: -2}}
            transition={{duration: 0.2}}
        >
            <div className={itemClassName}>
                <div className={styles.mainInfo}>
                    {isDraggable && (
                        <motion.span
                            className={styles.dragHandle}
                            aria-label="Drag to reorder"
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.9}}
                        >
                            <FaGripVertical/>
                        </motion.span>
                    )}
                    <motion.button
                        onClick={onToggleExpand}
                        className={styles.expandBtn}
                        disabled={!hasSubtasks || isEditing}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                        whileHover={{scale: 1.1}}
                        whileTap={{scale: 0.9}}
                    >
                        {hasSubtasks ? (
                            isExpanded ? <FaChevronDown/> : <FaChevronRight/>
                        ) : (
                            <span className={styles.expandPlaceholder}/>
                        )}
                    </motion.button>
                    <div className={styles.titleAndDescription}>
                        {isEditing ? (
                            <>
                                <motion.input
                                    ref={titleInputRef}
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={styles.titleInput}
                                    placeholder="Task title"
                                    aria-label="Edit task title"
                                    initial={{scale: 0.95}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.2}}
                                />
                                <motion.textarea
                                    value={editedDescription}
                                    onChange={(e) => onDescriptionChange && onDescriptionChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={styles.descriptionInput}
                                    placeholder="Task description"
                                    rows={3}
                                    aria-label="Edit task description"
                                    initial={{scale: 0.95}}
                                    animate={{scale: 1}}
                                    transition={{duration: 0.2}}
                                />
                                <div className={styles.editActions}>
                                    <motion.button
                                        onClick={handleSave}
                                        className={`${styles.button} ${styles.saveBtn}`}
                                        title="Save"
                                        aria-label="Save changes"
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                    >
                                        <FaSave/> Save
                                    </motion.button>
                                    <motion.button
                                        onClick={handleCancelEdit}
                                        className={`${styles.button} ${styles.cancelBtn}`}
                                        title="Cancel"
                                        aria-label="Cancel changes"
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </>
                        ) : (
                            <>
                                <motion.h3
                                    className={styles.title}
                                    whileHover={{x: 5}}
                                    transition={{duration: 0.2}}
                                >
                                    {task.title}
                                </motion.h3>
                                <motion.p
                                    className={styles.description}
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    transition={{duration: 0.3}}
                                >
                                    {task.description || <span className={styles.noDescription}>No description</span>}
                                </motion.p>
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.metaInfo}>
                    <StatusBadge status={task.status} isProcessing={isProcessing}/>
                    <PriorityBadge priority={task.priority}/>
                    <div className={styles.indicators}>
                        {hasPendingPrompt && (
                            <motion.div
                                className={styles.promptIndicator}
                                title="Action required"
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                whileHover={{scale: 1.2}}
                            >
                                <FaCommentAlt/>
                            </motion.div>
                        )}
                        {taskUtils.isCompleted(task) && (
                            <motion.div
                                className={styles.completionIndicator}
                                title="Task completed"
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                whileHover={{scale: 1.2}}
                            >
                                <FaCheckCircle/>
                            </motion.div>
                        )}
                        {taskUtils.isFailed(task) && (
                            <motion.div
                                className={styles.failureIndicator}
                                title="Task failed"
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                whileHover={{scale: 1.2}}
                            >
                                <FaExclamationCircle/>
                            </motion.div>
                        )}
                        {hasSubtasks && (
                            <motion.div
                                className={styles.subtaskIndicator}
                                title={`${subtasks.length} subtasks`}
                                whileHover={{scale: 1.1}}
                            >
                                <FaStream/> {subtasks.length}
                            </motion.div>
                        )}
                    </div>
                </div>
                <div className={styles.progressContainer}>
                    <ProgressBar percentage={task.completion_percentage || 0}/>
                </div>
                {!isEditing && onEdit && (
                    <div className={styles.controlsContainer}>
                        <motion.button
                            onClick={onEdit}
                            className={`${styles.button} ${styles.editBtn}`}
                            title="Edit task"
                            aria-label="Edit task"
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.9}}
                        >
                            <FaEdit/>
                        </motion.button>
                        {/* TaskControls will be added here by the parent component */}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

export default TaskCard;