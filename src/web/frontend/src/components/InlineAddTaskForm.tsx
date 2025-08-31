import React, { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import styles from './InlineAddTaskForm.module.css';
import { TaskPriority } from '../types';

interface InlineAddTaskFormProps {
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: TaskPriority;
    type: 'REGULAR' | 'AGENT';
  }) => void;
}

const InlineAddTaskForm: React.FC<InlineAddTaskFormProps> = ({ onAddTask }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      priority: 'medium', // Default priority
      type: 'REGULAR', // Default type
    });

    setTitle('');
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <FaPlus className={styles.icon} />
      <input
        type="text"
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
        aria-label="Add a new task"
      />
      <button type="submit" className={styles.button} disabled={!title.trim()}>
        Add Task
      </button>
    </form>
  );
};

export default InlineAddTaskForm;
