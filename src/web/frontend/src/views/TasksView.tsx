import React from 'react';
import TaskList from '../components/TaskList';
import { Task } from '../types';

interface TasksViewProps {
  tasks: Task[];
  sendMessage: (message: any) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  sendMessage,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}) => {
  const filteredTasks = tasks
    .filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(task =>
      statusFilter === 'ALL' ? true : task.status.toUpperCase() === statusFilter
    );

  return (
    <div>
      <div className="task-filters" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flexGrow: 1, padding: '0.75rem', border: '1px solid var(--color-card-border)', borderRadius: 'var(--border-radius)' }}
        />
        <div className="status-filters" style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'PENDING', 'COMPLETED', 'FAILED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--color-card-border)',
                backgroundColor: statusFilter === status ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === status ? 'white' : 'var(--color-foreground)',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <TaskList tasks={filteredTasks} sendMessage={sendMessage} />
    </div>
  );
};

export default TasksView;
