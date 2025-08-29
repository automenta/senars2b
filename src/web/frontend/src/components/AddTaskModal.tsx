import React, { useState } from 'react';
import { TaskPriority } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: { title: string; description?: string; priority: TaskPriority, type: 'REGULAR' | 'AGENT' }) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [type, setType] = useState<'REGULAR' | 'AGENT'>('REGULAR');
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask({ title: title.trim(), description, priority, type });
      onClose(); // Close modal after adding
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setType('REGULAR');
      setShowDetails(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Task</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title"
            required
            style={{ padding: '0.5rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}
          />

          {showDetails && (
            <>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                style={{ padding: '0.5rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)', minHeight: '100px' }}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                style={{ padding: '0.5rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'REGULAR' | 'AGENT')}
                style={{ padding: '0.5rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}
              >
                <option value="REGULAR">Regular</option>
                <option value="AGENT">Agent</option>
              </select>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
            >
              {showDetails ? 'Hide Details' : 'Add Details'}
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer'
              }}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
