import React, {memo, useCallback, useEffect, useRef, useState} from 'react';
import {Task} from '../../types';
import {FaGripVertical, FaCheck, FaEdit, FaTrash, FaPlay, FaPause, FaStop} from 'react-icons/fa';
import styles from './TaskEntity.module.css';
import {useTaskActions} from '../../hooks/useTaskActions';

interface TaskEntityProps {
    task: Task;
    isSelected?: boolean;
    isEditing?: boolean;
    isDraggable?: boolean;
    onEditStart?: (taskId: string) => void;
    onEditEnd?: (taskId: string) => void;
    onToggleSelect?: (taskId: string) => void;
    onDragStart?: (e: React.DragEvent, taskId: string) => void;
    onDragOver?: (e: React.DragEvent, taskId: string) => void;
    onDrop?: (e: React.DragEvent, taskId: string) => void;
}

const TaskEntity: React.FC<TaskEntityProps> = memo(({
                                                        task,
                                                        isSelected = false,
                                                        isEditing = false,
                                                        isDraggable = false,
                                                        onEditStart,
                                                        onEditEnd,
                                                        onToggleSelect,
                                                        onDragStart,
                                                        onDragOver,
                                                        onDrop
                                                    }) => {
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDescription, setEditedDescription] = useState(task.description || '');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const {updateTask, deleteTask, completeTask, pauseTask, resumeTask, failTask} = useTaskActions();

    const isAgentTask = task.type === 'AGENT';
    const isCompleted = task.status === 'completed';
    const isFailed = task.status === 'failed';
    const isDeferred = task.status === 'deferred';

    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

    const handleEditStart = useCallback(() => {
        if (onEditStart) {
            onEditStart(task.id);
        }
    }, [onEditStart, task.id]);

    const handleEditSave = useCallback(() => {
        if (editedTitle.trim() !== task.title || editedDescription !== (task.description || '')) {
            updateTask(task.id, {
                title: editedTitle.trim(),
                description: editedDescription
            });
        }
        if (onEditEnd) {
            onEditEnd(task.id);
        }
    }, [editedTitle, editedDescription, task, updateTask, onEditEnd]);

    const handleEditCancel = useCallback(() => {
        setEditedTitle(task.title);
        setEditedDescription(task.description || '');
        if (onEditEnd) {
            onEditEnd(task.id);
        }
    }, [task, onEditEnd]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleEditSave();
        }
        if (e.key === 'Escape') {
            handleEditCancel();
        }
    }, [handleEditSave, handleEditCancel]);

    const handleToggleSelectClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleSelect) {
            onToggleSelect(task.id);
        }
    }, [onToggleSelect, task.id]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        deleteTask(task.id);
    }, [deleteTask, task.id]);

    const handleComplete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        completeTask(task.id);
    }, [completeTask, task.id]);

    const handlePause = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        pauseTask(task.id);
    }, [pauseTask, task.id]);

    const handleResume = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        resumeTask(task.id);
    }, [resumeTask, task.id]);

    const handleFail = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        failTask(task.id);
    }, [failTask, task.id]);

    const handleDragStartInternal = useCallback((e: React.DragEvent) => {
        if (isDraggable && onDragStart) {
            onDragStart(e, task.id);
        }
    }, [isDraggable, onDragStart, task.id]);

    const handleDragOverInternal = useCallback((e: React.DragEvent) => {
        if (onDragOver) {
            onDragOver(e, task.id);
        }
    }, [onDragOver, task.id]);

    const handleDropInternal = useCallback((e: React.DragEvent) => {
        if (onDrop) {
            onDrop(e, task.id);
        }
    }, [onDrop, task.id]);

    const entityClasses = [
        styles.taskEntity,
        isSelected ? styles.selected : '',
        isEditing ? styles.editing : '',
        isCompleted ? styles.completed : '',
        isFailed ? styles.completed : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            className={entityClasses}
            draggable={isDraggable}
            onDragStart={handleDragStartInternal}
            onDragOver={handleDragOverInternal}
            onDrop={handleDropInternal}
            onClick={handleToggleSelectClick}
        >
            <div className={styles.taskEntityHeader}>
                {isDraggable && (
                    <div className={styles.dragHandle} aria-label="Drag to reorder">
                        <FaGripVertical/>
                    </div>
                )}

                <div
                    className={`${styles.checkbox} ${isCompleted ? styles.checked : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isCompleted) {
                            // Reopen task if completed
                            updateTask(task.id, {status: 'pending'});
                        } else {
                            completeTask(task.id);
                        }
                    }}
                >
                    {isCompleted && <FaCheck/>}
                </div>

                <div className={styles.taskTitle}>
                    {isEditing ? (
                        <div className={styles.editing}>
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={styles.titleInput}
                                placeholder="Task title"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <textarea
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={styles.descriptionInput}
                                placeholder="Task description"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSave();
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#4a6cf7',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditCancel();
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#f0f0f0',
                                        color: '#333',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>{task.title}</div>
                            <div className={styles.taskDescription}>
                                {task.description || <span className={styles.emptyDescription}>No description</span>}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.taskMeta}>
                <div className={`${styles.priorityBadge} ${styles[task.priority]}`}>
                    {task.priority}
                </div>
                <div className={`${styles.statusBadge} ${styles[task.status]}`}>
                    {task.status.replace('_', ' ')}
                </div>
            </div>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressBarFill}
                    style={{width: `${task.completion_percentage || 0}%`}}
                />
            </div>

            {!isEditing && (
                <div className={styles.taskActions}>
                    <button
                        className={`${styles.actionButton} ${styles.edit}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart();
                        }}
                        aria-label="Edit task"
                    >
                        <FaEdit/>
                    </button>

                    {isAgentTask ? (
                        <>
                            {task.status === 'deferred' || task.status === 'paused' ? (
                                <button
                                    className={`${styles.actionButton} ${styles.complete}`}
                                    onClick={handleResume}
                                    aria-label="Resume task"
                                >
                                    <FaPlay/>
                                </button>
                            ) : (
                                <button
                                    className={`${styles.actionButton} ${styles.edit}`}
                                    onClick={handlePause}
                                    aria-label="Pause task"
                                >
                                    <FaPause/>
                                </button>
                            )}
                            <button
                                className={`${styles.actionButton} ${styles.delete}`}
                                onClick={handleFail}
                                aria-label="Stop task"
                            >
                                <FaStop/>
                            </button>
                        </>
                    ) : (
                        <button
                            className={`${styles.actionButton} ${styles.complete}`}
                            onClick={handleComplete}
                            aria-label="Complete task"
                        >
                            <FaCheck/>
                        </button>
                    )}

                    <button
                        className={`${styles.actionButton} ${styles.delete}`}
                        onClick={handleDelete}
                        aria-label="Delete task"
                    >
                        <FaTrash/>
                    </button>
                </div>
            )}
        </div>
    );
});

export default TaskEntity;