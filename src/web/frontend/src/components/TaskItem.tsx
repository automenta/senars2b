import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Task} from '../types';
import {FaChevronDown, FaChevronRight, FaEdit, FaGripVertical, FaSave, FaStream, FaCommentAlt, FaCheckCircle, FaExclamationCircle} from 'react-icons/fa';
import TaskList from './TaskList';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import ProgressBar from './ProgressBar';
import TaskControls from './TaskControls';
import styles from './TaskItem.module.css';
import {useStore} from "../store";
import { taskUtils } from '../utils/taskUtils';

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
        return getPendingPrompts().some(p => p.taskId === task.id);
    }, [getPendingPrompts, task.id]);


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
                        onClick={handleToggleExpand}
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
                                    onChange={(e) => setEditedTitle(e.target.value)}
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
                                    onChange={(e) => setEditedDescription(e.target.value)}
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
                    <StatusBadge status={task.status} isProcessing={isProcessing} />
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
                                <FaCommentAlt />
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
                                <FaCheckCircle />
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
                                <FaExclamationCircle />
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
                    <ProgressBar percentage={task.completion_percentage}/>
                </div>
                {!isEditing && (
                    <div className={styles.controlsContainer}>
                        <motion.button
                            onClick={handleEdit}
                            className={`${styles.button} ${styles.editBtn}`}
                            title="Edit task"
                            aria-label="Edit task"
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.9}}
                        >
                            <FaEdit/>
                        </motion.button>
                        <TaskControls task={task} sendMessage={sendMessage}/>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {isExpanded && hasSubtasks && (
                    <motion.div 
                        className={styles.subTaskContainer}
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                        transition={{duration: 0.3}}
                    >
                        <TaskList tasks={subtasks} sendMessage={sendMessage} isSublist={true}/>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default TaskItem;
