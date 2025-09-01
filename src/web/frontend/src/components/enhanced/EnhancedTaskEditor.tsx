import React, {useState, useEffect, useCallback} from 'react';
import {Task, TaskPriority, TaskStatus} from '../types';
import styles from './TaskEditor.module.css';
import {
    FaTimes,
    FaSave,
    FaTrash,
    FaTag,
    FaCalendarAlt,
    FaClock,
    FaUser
} from 'react-icons/fa';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import {crdtTaskManager} from '../crdtTaskManager';

interface EnhancedTaskEditorProps {
    task: Task;
    onSave: (updatedTask: Task) => void;
    onDelete: (taskId: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

const EnhancedTaskEditor: React.FC<EnhancedTaskEditorProps> = ({task, onSave, onDelete, onClose, isOpen}) => {
    const [editedTask, setEditedTask] = useState<Task>({...task});
    const [isDeleting, setIsDeleting] = useState(false);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (isOpen) {
            setEditedTask({...task});
            setIsDeleting(false);
            setNewTag('');
        }
    }, [isOpen, task]);

    const handleChange = (field: keyof Task, value: any) => {
        setEditedTask(prev => ({...prev, [field]: value}));
    };

    const handleMetadataChange = (field: string, value: any) => {
        setEditedTask(prev => ({
            ...prev,
            task_metadata: {
                ...prev.task_metadata,
                [field]: value
            }
        }));
    };

    const handleSave = useCallback(() => {
        // Update via CRDT manager for proper synchronization
        crdtTaskManager.updateTask(editedTask.id, editedTask);
        onSave(editedTask);
        onClose();
    }, [editedTask, onSave, onClose]);

    const handleDelete = useCallback(() => {
        if (isDeleting) {
            // Delete via CRDT manager for proper synchronization
            crdtTaskManager.removeTask(task.id);
            onDelete(task.id);
            onClose();
        } else {
            setIsDeleting(true);
        }
    }, [isDeleting, task.id, onDelete, onClose]);

    const handleCancelDelete = useCallback(() => {
        setIsDeleting(false);
    }, []);

    const addTag = useCallback(() => {
        if (newTag.trim() && editedTask.task_metadata) {
            const currentTags = editedTask.task_metadata.tags || [];
            if (!currentTags.includes(newTag.trim())) {
                handleMetadataChange('tags', [...currentTags, newTag.trim()]);
                setNewTag('');
            }
        }
    }, [newTag, editedTask.task_metadata]);

    const removeTag = useCallback((tagToRemove: string) => {
        if (editedTask.task_metadata && editedTask.task_metadata.tags) {
            const updatedTags = editedTask.task_metadata.tags.filter(tag => tag !== tagToRemove);
            handleMetadataChange('tags', updatedTags);
        }
    }, [editedTask.task_metadata]);

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
                                {([
                                    'pending',
                                    'awaiting_dependencies',
                                    'decomposing',
                                    'awaiting_subtasks',
                                    'ready_for_execution',
                                    'completed',
                                    'failed',
                                    'deferred'
                                ] as TaskStatus[]).map(status => (
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

                    {/* Extended metadata fields */}
                    <div className={styles.metadataSection}>
                        <h3>Metadata</h3>

                        <div className={styles.field}>
                            <label htmlFor="deadline">
                                <FaCalendarAlt/> Deadline
                            </label>
                            <input
                                id="deadline"
                                type="date"
                                value={editedTask.task_metadata?.deadline ?
                                    new Date(editedTask.task_metadata.deadline).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleMetadataChange('deadline',
                                    e.target.value ? new Date(e.target.value).getTime() : undefined)}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="estimated_effort">
                                <FaClock/> Estimated Effort (hours)
                            </label>
                            <input
                                id="estimated_effort"
                                type="number"
                                value={editedTask.task_metadata?.estimated_effort || ''}
                                onChange={(e) => handleMetadataChange('estimated_effort',
                                    e.target.value ? parseFloat(e.target.value) : undefined)}
                                className={styles.input}
                                min="0"
                                step="0.5"
                            />
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="assignee">
                                <FaUser/> Assignee
                            </label>
                            <input
                                id="assignee"
                                type="text"
                                value={editedTask.task_metadata?.context?.assignee || ''}
                                onChange={(e) => handleMetadataChange('context', {
                                    ...editedTask.task_metadata?.context,
                                    assignee: e.target.value
                                })}
                                className={styles.input}
                                placeholder="Assignee name"
                            />
                        </div>

                        <div className={styles.field}>
                            <label>
                                <FaTag/> Tags
                            </label>
                            <div className={styles.tagsContainer}>
                                {editedTask.task_metadata?.tags?.map((tag, index) => (
                                    <span key={index} className={styles.tag}>
                                        {tag}
                                        <button
                                            className={styles.removeTagButton}
                                            onClick={() => removeTag(tag)}
                                            aria-label={`Remove tag ${tag}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <div className={styles.addTagContainer}>
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                        className={styles.tagInput}
                                        placeholder="Add a tag"
                                    />
                                    <button
                                        className={styles.addTagButton}
                                        onClick={addTag}
                                        aria-label="Add tag"
                                    >
                                        <FaTag/> Add
                                    </button>
                                </div>
                            </div>
                        </div>
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

export default EnhancedTaskEditor;