import React, {memo, useCallback, useState} from 'react';
import {Task} from '../../types';
import TaskEntity from './TaskEntity';
import {useTaskActions} from '../../hooks/useTaskActions';
import styles from './TaskEditor.module.css';

interface TaskEditorProps {
    task?: Task;
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<Task>) => void;
}

const TaskEditor: React.FC<TaskEditorProps> = memo(({task, isOpen, onClose, onSave}) => {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [priority, setPriority] = useState(task?.priority || 'medium');
    const [status, setStatus] = useState(task?.status || 'pending');
    const {deleteTask} = useTaskActions();

    const handleSave = useCallback(() => {
        onSave({
            title: title.trim(),
            description: description.trim(),
            priority,
            status
        });
    }, [title, description, priority, status, onSave]);

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
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Task title"
                            className={styles.input}
                        />
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
                                onChange={(e) => setPriority(e.target.value as any)}
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
                                onChange={(e) => setStatus(e.target.value as any)}
                                className={styles.select}
                            >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="deferred">Deferred</option>
                            </select>
                        </div>
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