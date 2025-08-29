import React from 'react';
import TaskList from '../components/TaskList';
import { useStore } from '../store';
import styles from './TasksView.module.css';

interface TasksViewProps {
  sendMessage: (message: any) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ sendMessage }) => {
  const {
    tasks,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
  } = useStore();

  const filteredTasks = tasks
    .filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(task =>
      statusFilter === 'ALL' ? true : task.status.toUpperCase() === statusFilter
    );

  return (
    <div>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.statusFilters}>
          {['ALL', 'PENDING', 'COMPLETED', 'FAILED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`${styles.statusButton} ${statusFilter === status ? styles.active : ''}`}
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
