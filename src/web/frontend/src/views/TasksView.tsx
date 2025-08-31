import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import TaskList from '../components/TaskList';
import { useStore } from '../store';
import styles from './TasksView.module.css';
import { useHotkeys } from '../hooks/useHotkeys';
import { useTasks } from '../hooks/useTasks';
import { FaFilter, FaSearch, FaSort } from 'react-icons/fa';
import InlineAddTaskForm from '../components/InlineAddTaskForm';
import { TaskPriority } from '../types';
import DashboardPanel from '../components/DashboardPanel';
import { useDashboardStats } from '../hooks/useDashboardStats';

interface TasksViewProps {
  sendMessage: (message: any) => void;
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: TaskPriority;
    type: 'REGULAR' | 'AGENT';
  }) => void;
}

const TasksView: React.FC<TasksViewProps> = memo(
  ({ sendMessage, onAddTask }) => {
    const {
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
    const [showFilters, setShowFilters] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { tasks: sortedAndFilteredTasks } = useTasks();
    const { stats, systemStatus, statsHistory, isLoading } =
      useDashboardStats();

    // Reset selected task index when tasks change
    useEffect(() => {
      setSelectedTaskIndex(-1);
    }, [sortedAndFilteredTasks]);

    useEffect(() => {
      if (searchInput.current) {
        setSearchInputRef(searchInput);
      }
    }, [setSearchInputRef]);

    // Handle task actions with error handling
    const handleTaskAction = useCallback(
      (action: string, payload: any) => {
        try {
          sendMessage({ type: action, payload });
        } catch (err) {
          console.error(`Error sending ${action} message:`, err);
          setError(
            `Failed to ${action.toLowerCase()}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      },
      [sendMessage]
    );

    // Clear error after 5 seconds
    useEffect(() => {
      if (error) {
        const timer = setTimeout(() => setError(null), 5000);
        return () => clearTimeout(timer);
      }
    }, [error]);

    useHotkeys(
      {
        j: () => {
          setSelectedTaskIndex((prev) =>
            Math.min(prev + 1, sortedAndFilteredTasks.length - 1)
          );
        },
        k: () => {
          setSelectedTaskIndex((prev) => Math.max(prev - 1, 0));
        },
        o: () => {
          if (selectedTaskIndex !== -1) {
            console.log(
              'Toggle expand for task:',
              sortedAndFilteredTasks[selectedTaskIndex].id
            );
          }
        },
        Enter: () => {
          if (selectedTaskIndex !== -1) {
            console.log(
              'Toggle expand for task:',
              sortedAndFilteredTasks[selectedTaskIndex].id
            );
          }
        },
        f: () => setShowFilters((prev) => !prev),
      },
      [sortedAndFilteredTasks, selectedTaskIndex]
    );

    // Filter options with proper display names
    const statusOptions = [
      { value: 'ALL', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'awaiting_dependencies', label: 'Awaiting Dependencies' },
      { value: 'decomposing', label: 'Decomposing' },
      { value: 'awaiting_subtasks', label: 'Awaiting Subtasks' },
      { value: 'ready_for_execution', label: 'Ready for Execution' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
      { value: 'deferred', label: 'Deferred' },
    ];

    const typeOptions = [
      { value: 'ALL', label: 'All' },
      { value: 'REGULAR', label: 'Regular' },
      { value: 'AGENT', label: 'Agent' },
    ];

    return (
      <div className={styles.tasksView}>
        <DashboardPanel
          stats={stats}
          systemStatus={systemStatus}
          statsHistory={statsHistory}
          isLoading={isLoading}
        />

        {error && <div className={styles.errorBanner}>{error}</div>}

        <InlineAddTaskForm onAddTask={onAddTask} />

        <div className={styles.searchAndFilters}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              ref={searchInput}
              type="text"
              placeholder="Search tasks... (/)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.toggleFiltersBtn}
          >
            <FaFilter /> Filters
          </button>
        </div>

        {showFilters && (
          <div className={styles.filters}>
            <div className={styles.filterSection}>
              <div className={styles.filterHeader}>
                <FaFilter className={styles.filterIcon} />
                <span>Filters</span>
              </div>
              <div className={styles.filterGroup}>
                <label>Status:</label>
                <div className={styles.filterOptions}>
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value as any)}
                      className={`${styles.filterButton} ${statusFilter === option.value ? styles.active : ''}`}
                      aria-pressed={statusFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroup}>
                <label>Type:</label>
                <div className={styles.filterOptions}>
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTypeFilter(option.value as any)}
                      className={`${styles.filterButton} ${typeFilter === option.value ? styles.active : ''}`}
                      aria-pressed={typeFilter === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.sortSection}>
              <div className={styles.filterHeader}>
                <FaSort className={styles.filterIcon} />
                <span>Sort By</span>
              </div>
              <div className={styles.sortGroup}>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className={styles.sortSelect}
                  aria-label="Sort tasks by"
                >
                  <option value="priority-desc">Priority: High to Low</option>
                  <option value="priority-asc">Priority: Low to High</option>
                  <option value="date-desc">Date: Newest First</option>
                  <option value="date-asc">Date: Oldest First</option>
                  <option value="title-asc">Title: A-Z</option>
                  <option value="title-desc">Title: Z-A</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <TaskList
          tasks={sortedAndFilteredTasks}
          sendMessage={handleTaskAction}
          selectedTaskIndex={selectedTaskIndex}
        />
      </div>
    );
  }
);

export default TasksView;
