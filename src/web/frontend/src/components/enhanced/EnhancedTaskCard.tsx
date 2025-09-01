import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Task} from '../../types';
import {
    FaChevronDown,
    FaChevronRight,
    FaEdit,
    FaSave,
    FaGripVertical,
    FaStream,
    FaCommentAlt,
    FaCheckCircle,
    FaExclamationCircle,
    FaTrash,
    FaPlay,
    FaPause,
    FaStop
} from 'react-icons/fa';
import StatusBadge from '../StatusBadge';
import PriorityBadge from '../PriorityBadge';
import ProgressBar from '../ProgressBar';
import styles from './EnhancedTaskCard.module.css';
import {useStore} from "../../store";
import {taskUtils} from '../../utils/taskUtils';

interface EnhancedTaskCardProps {
    task: Task;
    allFilteredTasks: Task[];
    isDraggable?: boolean;
    isSelected?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: (e: React.MouseEvent) => void;
    onEdit?: () => void;
    onSave?: (title: string, description: string) => void;
    onCancelEdit?: () => void;
    onDelete?: (taskId: string) => void;
    onComplete?: (taskId: string) => void;
    onPause?: (taskId: string) => void;
    onResume?: (taskId: string) => void;
    onStop?: (taskId: string) => void;
    onTitleChange?: (title: string) => void;
    onDescriptionChange?: (description: string) => void;
    editedTitle?: string;
    editedDescription?: string;
    isEditing?: boolean;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = memo(({
                                                                    task,
                                                                    allFilteredTasks,
                                                                    isDraggable = false,
                                                                    isSelected = false,
                                                                    isExpanded = false,
                                                                    onToggleExpand,
                                                                    onEdit,
                                                                    onSave,
                                                                    onCancelEdit,
                                                                    onDelete,
                                                                    onComplete,
                                                                    onPause,
                                                                    onResume,
                                                                    onStop,
                                                                    onTitleChange,
                                                                    onDescriptionChange,
                                                                    editedTitle = task.title,
                                                                    editedDescription = task.description || '',
                                                                    isEditing = false
                                                                }) => {
    const getPendingPrompts = useStore(state => state.getPendingPrompts);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        if (isEditing) {
            titleInputRef.current?.focus();
        }
    }, [isEditing]);

    const isDimmed = taskUtils.isCompleted(task) || taskUtils.isFailed(task);
    const isProcessing = taskUtils.isInProgress(task);
    const isAgentTask = task.type === 'AGENT';

    const subtasks = useMemo(
        () => allFilteredTasks.filter(t => t.parent_id === task.id),
        [allFilteredTasks, task.id]
    );

    const hasSubtasks = subtasks.length > 0;

    const hasPendingPrompt = useMemo(() => {
        return getPendingPrompts().some(p => p.taskId === task.id);
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

    const handleDelete = () => {
        if (onDelete) {
            onDelete(task.id);
        }
    };

    const handleComplete = () => {
        if (onComplete) {
            onComplete(task.id);
        }
    };

    const handlePause = () => {
        if (onPause) {
            onPause(task.id);
        }
    };

    const handleResume = () => {
        if (onResume) {
            onResume(task.id);
        }
    };

    const handleStop = () => {
        if (onStop) {
            onStop(task.id);
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
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
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
                <AnimatePresence>
                    {showActions && !isEditing && (
                        <motion.div
                            className={styles.controlsContainer}
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: 10}}
                            transition={{duration: 0.2}}
                        >
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
                            {isAgentTask ? (
                                <>
                                    {task.status === 'deferred' || task.status === 'paused' ? (
                                        <motion.button
                                            onClick={handleResume}
                                            className={`${styles.button} ${styles.actionBtn}`}
                                            title="Resume task"
                                            aria-label="Resume task"
                                            whileHover={{scale: 1.1}}
                                            whileTap={{scale: 0.9}}
                                        >
                                            <FaPlay/>
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            onClick={handlePause}
                                            className={`${styles.button} ${styles.actionBtn}`}
                                            title="Pause task"
                                            aria-label="Pause task"
                                            whileHover={{scale: 1.1}}
                                            whileTap={{scale: 0.9}}
                                        >
                                            <FaPause/>
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={handleStop}
                                        className={`${styles.button} ${styles.actionBtn}`}
                                        title="Stop task"
                                        aria-label="Stop task"
                                        whileHover={{scale: 1.1}}
                                        whileTap={{scale: 0.9}}
                                    >
                                        <FaStop/>
                                    </motion.button>
                                </>
                            ) : (
                                <motion.button
                                    onClick={handleComplete}
                                    className={`${styles.button} ${styles.actionBtn}`}
                                    title="Complete task"
                                    aria-label="Complete task"
                                    whileHover={{scale: 1.1}}
                                    whileTap={{scale: 0.9}}
                                >
                                    <FaCheckCircle/>
                                </motion.button>
                            )}
                            <motion.button
                                onClick={handleDelete}
                                className={`${styles.button} ${styles.deleteBtn}`}
                                title="Delete task"
                                aria-label="Delete task"
                                whileHover={{scale: 1.1}}
                                whileTap={{scale: 0.9}}
                            >
                                <FaTrash/>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});

export default EnhancedTaskCard;