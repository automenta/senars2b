import React, { useState } from 'react';
import { TaskPriority, TaskType } from '../types';
import styles from './InlineAddTaskForm.module.css';
import { FaTimes, FaPlus, FaRobot, FaUser } from 'react-icons/fa';

interface InlineAddTaskFormProps {
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: TaskPriority;
    type: TaskType;
  }) => void;
  onCancel: () => void;
}

const InlineAddTaskForm: React.FC<InlineAddTaskFormProps> = ({ onAddTask, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<TaskType>('REGULAR');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }
    
    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      type
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setType('REGULAR');
  };

  const priorityOptions = [
    { value: 'critical', label: 'Critical', color: 'var(--color-critical)' },
    { value: 'high', label: 'High', color: 'var(--color-high)' },
    { value: 'medium', label: 'Medium', color: 'var(--color-medium)' },
    { value: 'low', label: 'Low', color: 'var(--color-low)' }
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>
          <h2>Add New Task</h2>
          <button 
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Close form"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={styles.input}
              autoFocus
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={styles.select}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>Type</label>
              <div className={styles.typeButtons}>
                <button
                  type="button"
                  onClick={() => setType('REGULAR')}
                  className={`${styles.typeButton} ${type === 'REGULAR' ? styles.active : ''}`}
                >
                  <FaUser /> Regular
                </button>
                <button
                  type="button"
                  onClick={() => setType('AGENT')}
                  className={`${styles.typeButton} ${type === 'AGENT' ? styles.active : ''}`}
                >
                  <FaRobot /> Agent
                </button>
              </div>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={!title.trim()}
            >
              <FaPlus /> Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InlineAddTaskForm;