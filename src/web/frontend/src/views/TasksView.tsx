import React, { useRef, useEffect, useState } from 'react';
import TaskList from '../components/TaskList';
import { useStore } from '../store';
import { Task, TaskPriority } from '../types';
import styles from './TasksView.module.css';
import { useHotkeys } from '../hooks/useHotkeys';

interface TasksViewProps {
  sendMessage: (message: any) => void;
}

const priorityOrder: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const TasksView: React.FC<TasksViewProps> = ({ sendMessage }) => {
  const {
    tasks,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    sortOption,
    setSortOption,
    setSearchInputRef,
  } = useStore();

  const searchInput = useRef<HTMLInputElement>(null);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(-1);

  useEffect(() => {
    if (searchInput.current) {
      setSearchInputRef(searchInput);
    }
  }, [setSearchInputRef]);

  const sortedAndFilteredTasks = tasks
    .filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(task =>
      statusFilter === 'ALL' ? true : task.status.toUpperCase() === statusFilter
    )
    .filter(task =>
      typeFilter === 'ALL' ? true : task.type.toUpperCase() === typeFilter
    )
    .sort((a, b) => {
      switch (sortOption) {
        case 'priority-desc':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priority-asc':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'date-desc':
          return (b.creation_time || 0) - (a.creation_time || 0);
        case 'date-asc':
          return (a.creation_time || 0) - (b.creation_time || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  useHotkeys({
    'j': () => {
      setSelectedTaskIndex(prev => Math.min(prev + 1, sortedAndFilteredTasks.length - 1));
    },
    'k': () => {
      setSelectedTaskIndex(prev => Math.max(prev - 1, 0));
    },
    'o': () => {
      if (selectedTaskIndex !== -1) {
        console.log('Toggle expand for task:', sortedAndFilteredTasks[selectedTaskIndex].id);
      }
    },
    'Enter': () => {
        if (selectedTaskIndex !== -1) {
          console.log('Toggle expand for task:', sortedAndFilteredTasks[selectedTaskIndex].id);
        }
      },
  }, [sortedAndFilteredTasks, selectedTaskIndex]);

  return (
    <div className={styles.tasksView}>
      <div className={styles.filters}>
        <input
          ref={searchInput}
          type="text"
          placeholder="Search tasks... (/)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.filterGroup}>
          <span>Status:</span>
          <div className={styles.statusFilters}>
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`${styles.statusButton} ${statusFilter === status ? styles.active : ''}`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span>Type:</span>
          <div className={styles.statusFilters}>
            {['ALL', 'REGULAR', 'AGENT'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`${styles.statusButton} ${typeFilter === type ? styles.active : ''}`}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <span>Sort by:</span>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className={styles.sortSelect}>
            <option value="priority-desc">Priority: High to Low</option>
            <option value="priority-asc">Priority: Low to High</option>
            <option value="date-desc">Date: Newest First</option>
            <option value="date-asc">Date: Oldest First</option>
            <option value="title-asc">Title: A-Z</option>
            <option value="title-desc">Title: Z-A</option>
          </select>
        </div>
      </div>

      <TaskList tasks={sortedAndFilteredTasks} sendMessage={sendMessage} selectedTaskIndex={selectedTaskIndex} />
    </div>
  );
};

export default TasksView;
