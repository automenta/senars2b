import React, {useState, useRef, useEffect} from 'react';
import {FaTimes, FaPlus, FaRobot, FaUser} from 'react-icons/fa';
import {TaskPriority} from '../types';
import styles from './InlineAddTaskForm.module.css';

interface InlineAddTaskFormProps {
    onAddTask: (task: { title: string; description?: string; priority: TaskPriority; type: 'REGULAR' | 'AGENT' }) => void;
    onCancel?: () => void;
}

const InlineAddTaskForm: React.FC<InlineAddTaskFormProps> = ({onAddTask, onCancel}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [type, setType] = useState<'REGULAR' | 'AGENT'>('REGULAR');
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        titleInputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddTask({title: title.trim(), description: description.trim() || undefined, priority, type});
            setTitle('');
            setDescription('');
            setPriority('medium');
            setType('REGULAR');
        }
    };

    const handleCancel = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setType('REGULAR');
        if (onCancel) {
            onCancel();
        }
    };

    return (
        <div className={styles.overlay}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.header}>
                    <h3>Add New Task</h3>
                    <button type="button" className={styles.closeButton} onClick={handleCancel}>
                        <FaTimes/>
                    </button>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="title">Title *</label>
                    <input
                        ref={titleInputRef}
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add details..."
                        className={styles.textarea}
                        rows={3}
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
                        <label htmlFor="type">Type</label>
                        <div className={styles.typeButtons}>
                            <button
                                type="button"
                                className={`${styles.typeButton} ${type === 'REGULAR' ? styles.active : ''}`}
                                onClick={() => setType('REGULAR')}
                            >
                                <FaUser/> Regular
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeButton} ${type === 'AGENT' ? styles.active : ''}`}
                                onClick={() => setType('AGENT')}
                            >
                                <FaRobot/> Agent
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.submitButton} disabled={!title.trim()}>
                        <FaPlus/> Add Task
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InlineAddTaskForm;
