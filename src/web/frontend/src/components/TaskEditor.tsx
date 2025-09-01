import React, {useState, useEffect} from 'react';
import {Task, TaskPriority, TaskStatus} from '../types';
import styles from './TaskEditor.module.css';
import {FaTimes, FaSave, FaTrash} from 'react-icons/fa';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

interface TaskEditorProps {
    task: Task;
    onSave: (updatedTask: Task) => void;
    onDelete: (taskId: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

const TaskEditor: React.FC<TaskEditorProps> = ({task, onSave, onDelete, onClose, isOpen}) => {
    const [editedTask, setEditedTask] = useState<Task>({...task});
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setEditedTask({...task});
            setIsDeleting(false);
        }
    }, [isOpen, task]);

    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask(prev => ({...prev, [field]: value}));
    };

    const handleSave = () => {
        onSave(editedTask);
        onClose();
    };

    const handleDelete = () => {
        if (isDeleting) {
            onDelete(task.id);
            onClose();
        } else {
            setIsDeleting(true);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleting(false);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.editor} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Edit Task</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close editor">
                        <FaTimes/>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.field}>
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={editedTask.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={styles.input}
                            placeholder="Task title"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={editedTask.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className={styles.textarea}
                            placeholder="Task description"
                            rows={4}
                        />
                    </div>

                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label htmlFor="priority">Priority</label>
                            <div className={styles.prioritySelector}>
                                {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map(priority => (
                                    <button
                                        key={priority}
                                        className={`${styles.priorityButton} ${editedTask.priority === priority ? styles.selected : ''}`}
                                        onClick={() => handleChange('priority', priority)}
                                        aria-pressed={editedTask.priority === priority}
                                    >
                                        <PriorityBadge priority={priority}/>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="status">Status</label>
                            <div className={styles.statusSelector}>
                                {(['pending', 'awaiting_dependencies', 'decomposing', 'awaiting_subtasks', 'ready_for_execution', 'completed', 'failed', 'deferred'] as TaskStatus[]).map(status => (
                                    <button
                                        key={status}
                                        className={`${styles.statusButton} ${editedTask.status === status ? styles.selected : ''}`}
                                        onClick={() => handleChange('status', status)}
                                        aria-pressed={editedTask.status === status}
                                    >
                                        <StatusBadge status={status}/>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="type">Type</label>
                        <select
                            id="type"
                            value={editedTask.type}
                            onChange={(e) => handleChange('type', e.target.value as 'REGULAR' | 'AGENT')}
                            className={styles.select}
                        >
                            <option value="REGULAR">Regular</option>
                            <option value="AGENT">Agent</option>
                        </select>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.deleteSection}>
                        {isDeleting ? (
                            <div className={styles.deleteConfirmation}>
                                <p>Are you sure you want to delete this task?</p>
                                <div className={styles.deleteActions}>
                                    <button className={styles.confirmDeleteButton} onClick={handleDelete}>
                                        <FaTrash/> Yes, Delete
                                    </button>
                                    <button className={styles.cancelDeleteButton} onClick={handleCancelDelete}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className={styles.deleteButton} onClick={handleDelete} aria-label="Delete task">
                                <FaTrash/> Delete Task
                            </button>
                        )}
                    </div>
                    <div className={styles.saveSection}>
                        <button className={styles.saveButton} onClick={handleSave} aria-label="Save changes">
                            <FaSave/> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskEditor;