import React, {memo, useCallback, useState, useEffect} from 'react';
import {Task, TaskPriority, TaskStatus} from '../../types';
import {useTaskActions} from '../../hooks/useTaskActions';
import styles from './TaskEditor.module.css';

interface TaskEditorProps {
    task?: Task;
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<Task>) => void;
    allTasks?: Task[];
}

const TaskEditor: React.FC<TaskEditorProps> = memo(({task, isOpen, onClose, onSave, allTasks = []}) => {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
    const [status, setStatus] = useState<TaskStatus>(task?.status || 'pending');
    const [parentId, setParentId] = useState(task?.parent_id || '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const {deleteTask} = useTaskActions();

    // Reset form when task changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle(task?.title || '');
            setDescription(task?.description || '');
            setPriority(task?.priority || 'medium');
            setStatus(task?.status || 'pending');
            setParentId(task?.parent_id || '');
            setErrors({});
        }
    }, [task, isOpen]);

    const validateForm = useCallback(() => {
        const newErrors: Record<string, string> = {};
        
        if (!title.trim()) {
            newErrors.title = 'Title is required';
        }
        
        if (parentId && !allTasks.some(t => t.id === parentId)) {
            newErrors.parentId = 'Selected parent task does not exist';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [title, parentId, allTasks]);

    const handleSave = useCallback(() => {
        if (validateForm()) {
            onSave({
                title: title.trim(),
                description: description.trim(),
                priority,
                status,
                parent_id: parentId || undefined
            });
        }
    }, [title, description, priority, status, parentId, onSave, validateForm]);

    const handleDelete = useCallback(() => {
        if (task?.id) {
            deleteTask(task.id);
            onClose();
        }
    }, [task, deleteTask, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSave();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    }, [handleSave, onClose]);

    if (!isOpen) return null;

    // Filter out current task and its subtasks from parent options
    const getParentOptions = () => {
        if (!task) return allTasks;
        
        const excludeIds = new Set([task.id, ...task.subtasks]);
        return allTasks.filter(t => !excludeIds.has(t.id));
    };

    const parentOptions = getParentOptions();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.editor} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{task ? 'Edit Task' : 'New Task'}</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="title">Title *</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Task title"
                            className={`${styles.input} ${errors.title ? styles.error : ''}`}
                        />
                        {errors.title && <div className={styles.errorMessage}>{errors.title}</div>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Task description"
                            className={styles.textarea}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="priority">Priority</label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className={styles.select}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className={styles.select}
                            >
                                <option value="pending">Pending</option>
                                <option value="awaiting_dependencies">Awaiting Dependencies</option>
                                <option value="decomposing">Decomposing</option>
                                <option value="awaiting_subtasks">Awaiting Subtasks</option>
                                <option value="ready_for_execution">Ready for Execution</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="deferred">Deferred</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="parentId">Parent Task</label>
                        <select
                            id="parentId"
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className={`${styles.select} ${errors.parentId ? styles.error : ''}`}
                        >
                            <option value="">None</option>
                            {parentOptions.map(parentTask => (
                                <option key={parentTask.id} value={parentTask.id}>
                                    {parentTask.title}
                                </option>
                            ))}
                        </select>
                        {errors.parentId && <div className={styles.errorMessage}>{errors.parentId}</div>}
                    </div>
                </div>

                <div className={styles.actions}>
                    {task && (
                        <button
                            className={`${styles.button} ${styles.deleteButton}`}
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    )}
                    <div className={styles.primaryActions}>
                        <button
                            className={`${styles.button} ${styles.cancelButton}`}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className={`${styles.button} ${styles.saveButton}`}
                            onClick={handleSave}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default TaskEditor;