import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskPriority, TaskStatus, TaskType } from '../../types';
import { useStore } from '../../store';
import { useTasks } from '../../hooks/useTasks';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import {
  FaFilter,
  FaSearch,
  FaSort,
  FaChevronDown,
  FaChevronUp,
  FaMagic,
  FaPlus,
  FaList,
  FaThLarge,
  FaChartBar,
  FaCalendarAlt,
  FaTag,
  FaUser,
  FaRocket,
  FaCheck,
  FaExclamationTriangle,
  FaPause,
  FaTrash,
  FaEllipsisV,
  FaStream,
  FaLayerGroup
} from 'react-icons/fa';
import styles from './TaskManagementDashboard.module.css';
import TaskCard from './TaskCard';
import TaskBoard from './TaskBoard';
import TaskPrioritization from './TaskPrioritization';
import DashboardPanel from '../DashboardPanel';
import InlineAddTaskForm from '../InlineAddTaskForm';
import ViewSwitcher from '../ViewSwitcher';
import BulkTaskActions from '../BulkTaskActions';
import TaskTimeline from './TaskTimeline';
import PriorityGroups from './PriorityGroups';
import AdvancedSearch from './AdvancedSearch';
import TaskCalendar from './TaskCalendar';

interface TaskManagementDashboardProps {
  sendMessage: (message: any) => void;
  onAddTask: (task: {
    title: string;
    description?: string;
    priority: TaskPriority,
    type: 'REGULAR' | 'AGENT'
  }, status?: TaskStatus) => void;
}

const TaskManagementDashboard: React.FC<TaskManagementDashboardProps> = ({
  sendMessage,
  onAddTask
}) => {
  const {
    tasks: allTasks,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    priorityFilter,
    setPriorityFilter,
    sortOption,
    setSortOption,
    setSearchInputRef,
  } = useStore();

  const { tasks: sortedAndFilteredTasks } = useTasks();
  const { stats, systemStatus, statsHistory, isLoading } = useDashboardStats();

  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'board' | 'timeline' | 'priority' | 'calendar'>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'today' | 'urgent' | 'agent'>('all');
  const [showPrioritization, setShowPrioritization] = useState(false);

  // Quick filters
  const quickFilteredTasks = useMemo(() => {
    if (activeQuickFilter === 'all') return sortedAndFilteredTasks;
    
    return sortedAndFilteredTasks.filter(task => {
      switch (activeQuickFilter) {
        case 'today':
          // For demo purposes, we'll filter by tasks with "today" in title
          return task.title.toLowerCase().includes('today') || task.title.toLowerCase().includes('urgent');
        case 'urgent':
          return task.priority === 'critical' || task.priority === 'high';
        case 'agent':
          return task.type === 'AGENT';
        default:
          return true;
      }
    });
  }, [sortedAndFilteredTasks, activeQuickFilter]);

  // Handle task selection for bulk actions
  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const selectAllTasks = useCallback(() => {
    const allTaskIds = new Set(quickFilteredTasks.map(task => task.id));
    setSelectedTaskIds(allTaskIds);
  }, [quickFilteredTasks]);

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  // Handle task expansion for details
  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  }, []);

  // Handle bulk actions
  const handleBulkMarkComplete = useCallback(() => {
    selectedTaskIds.forEach(taskId => {
      sendMessage({ type: 'COMPLETE_TASK', payload: { id: taskId } });
    });
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, sendMessage]);

  const handleBulkMarkFailed = useCallback(() => {
    selectedTaskIds.forEach(taskId => {
      sendMessage({ type: 'FAIL_TASK', payload: { id: taskId } });
    });
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, sendMessage]);

  const handleBulkPause = useCallback(() => {
    selectedTaskIds.forEach(taskId => {
      sendMessage({ type: 'PAUSE_AGENT', payload: { id: taskId } });
    });
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, sendMessage]);

  const handleBulkResume = useCallback(() => {
    selectedTaskIds.forEach(taskId => {
      sendMessage({ type: 'RESUME_AGENT', payload: { id: taskId } });
    });
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, sendMessage]);

  const handleBulkDelete = useCallback(() => {
    selectedTaskIds.forEach(taskId => {
      sendMessage({ type: 'DELETE_TASK', payload: { id: taskId } });
    });
    setSelectedTaskIds(new Set());
  }, [selectedTaskIds, sendMessage]);

  // Filter options
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'awaiting_dependencies', label: 'Awaiting Dependencies' },
    { value: 'decomposing', label: 'Decomposing' },
    { value: 'awaiting_subtasks', label: 'Awaiting Subtasks' },
    { value: 'ready_for_execution', label: 'Ready for Execution' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'deferred', label: 'Deferred' }
  ];

  const typeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'AGENT', label: 'Agent' }
  ];

  const handleSavePriorities = useCallback((priorities: { taskId: string; priority: TaskPriority }[]) => {
    priorities.forEach(({ taskId, priority }) => {
      sendMessage({
        type: 'UPDATE_TASK_PRIORITY',
        payload: {
          id: taskId,
          priority
        }
      });
    });
    setShowPrioritization(false);
  }, [sendMessage]);

  // Handle task actions for timeline and priority views
  const handleTaskAction = useCallback((action: string, taskId: string) => {
    sendMessage({ type: action, payload: { id: taskId } });
  }, [sendMessage]);

  // Handle advanced search
  const handleAdvancedSearch = useCallback((searchCriteria: {
    searchTerm: string;
    status: TaskStatus | 'ALL';
    type: TaskType | 'ALL';
    priority: TaskPriority | 'ALL';
  }) => {
    // Update the store filters
    setSearchTerm(searchCriteria.searchTerm);
    setStatusFilter(searchCriteria.status);
    setTypeFilter(searchCriteria.type);
    setPriorityFilter(searchCriteria.priority);
  }, [setSearchTerm, setStatusFilter, setTypeFilter, setPriorityFilter]);

  return (
    <motion.div
      className={styles.dashboard}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Task Management</h1>
          <p>Organize, prioritize, and track your tasks efficiently</p>
        </div>
        <div className={styles.headerActions}>
          <motion.button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleAnalytics'))}
            className={styles.addButton}
            style={{ backgroundColor: 'var(--color-info)', borderColor: 'var(--color-info)' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaChartBar /> Analytics
          </motion.button>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className={styles.addButton}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaPlus /> Add Task
          </motion.button>
        </div>
      </div>

      <DashboardPanel
        stats={stats}
        systemStatus={systemStatus}
        statsHistory={statsHistory}
        isLoading={isLoading}
      />

      <AdvancedSearch onSearch={handleAdvancedSearch} />

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className={styles.addFormOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <InlineAddTaskForm
              onAddTask={(task) => {
                onAddTask(task);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.controlsBar}>
        <div className={styles.quickFilters}>
          <button
            className={`${styles.quickFilter} ${activeQuickFilter === 'all' ? styles.active : ''}`}
            onClick={() => setActiveQuickFilter('all')}
          >
            <FaList /> All Tasks
          </button>
          <button
            className={`${styles.quickFilter} ${activeQuickFilter === 'today' ? styles.active : ''}`}
            onClick={() => setActiveQuickFilter('today')}
          >
            <FaCalendarAlt /> Today
          </button>
          <button
            className={`${styles.quickFilter} ${activeQuickFilter === 'urgent' ? styles.active : ''}`}
            onClick={() => setActiveQuickFilter('urgent')}
          >
            <FaExclamationTriangle /> Urgent
          </button>
          <button
            className={`${styles.quickFilter} ${activeQuickFilter === 'agent' ? styles.active : ''}`}
            onClick={() => setActiveQuickFilter('agent')}
          >
            <FaRobot /> Agent Tasks
          </button>
        </div>

        <div className={styles.viewControls}>
          <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
          <motion.button
            onClick={() => setShowPrioritization(true)}
            className={styles.prioritizeBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaMagic /> Prioritize
          </motion.button>
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={styles.toggleFiltersBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaFilter /> Filters
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </motion.button>
        </div>
      </div>

      <div className={styles.searchAndFilters}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className={styles.filters}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.filterSection}>
              <div className={styles.filterHeader}>
                <FaFilter className={styles.filterIcon} />
                <span>Filters</span>
              </div>
              <div className={styles.filterGroup}>
                <label>Status:</label>
                <div className={styles.filterOptions}>
                  {statusOptions.map(option => (
                    <motion.button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value as any)}
                      className={`${styles.filterButton} ${statusFilter === option.value ? styles.active : ''}`}
                      aria-pressed={statusFilter === option.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      layout
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroup}>
                <label>Type:</label>
                <div className={styles.filterOptions}>
                  {typeOptions.map(option => (
                    <motion.button
                      key={option.value}
                      onClick={() => setTypeFilter(option.value as any)}
                      className={`${styles.filterButton} ${typeFilter === option.value ? styles.active : ''}`}
                      aria-pressed={typeFilter === option.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      layout
                    >
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroup}>
                <label>Priority:</label>
                <div className={styles.filterOptions}>
                  <motion.button
                    onClick={() => setPriorityFilter('ALL')}
                    className={`${styles.filterButton} ${priorityFilter === 'ALL' ? styles.active : ''}`}
                    aria-pressed={priorityFilter === 'ALL'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    All Priorities
                  </motion.button>
                  <motion.button
                    onClick={() => setPriorityFilter('critical')}
                    className={`${styles.filterButton} ${priorityFilter === 'critical' ? styles.active : ''}`}
                    aria-pressed={priorityFilter === 'critical'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    Critical
                  </motion.button>
                  <motion.button
                    onClick={() => setPriorityFilter('high')}
                    className={`${styles.filterButton} ${priorityFilter === 'high' ? styles.active : ''}`}
                    aria-pressed={priorityFilter === 'high'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    High
                  </motion.button>
                  <motion.button
                    onClick={() => setPriorityFilter('medium')}
                    className={`${styles.filterButton} ${priorityFilter === 'medium' ? styles.active : ''}`}
                    aria-pressed={priorityFilter === 'medium'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    Medium
                  </motion.button>
                  <motion.button
                    onClick={() => setPriorityFilter('low')}
                    className={`${styles.filterButton} ${priorityFilter === 'low' ? styles.active : ''}`}
                    aria-pressed={priorityFilter === 'low'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                  >
                    Low
                  </motion.button>
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
          </motion.div>
        )}
      </AnimatePresence>

      <BulkTaskActions
        selectedTasks={Array.from(selectedTaskIds)}
        onMarkComplete={handleBulkMarkComplete}
        onMarkFailed={handleBulkMarkFailed}
        onPause={handleBulkPause}
        onResume={handleBulkResume}
        onDelete={handleBulkDelete}
        onClearSelection={clearSelection}
        totalTasks={quickFilteredTasks.length}
      />

      {showPrioritization ? (
        <TaskPrioritization
          tasks={quickFilteredTasks}
          onSavePriorities={handleSavePriorities}
          onCancel={() => setShowPrioritization(false)}
        />
      ) : currentView === 'list' ? (
        <div className={styles.taskList}>
          {quickFilteredTasks.length > 0 ? (
            quickFilteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTaskIds.has(task.id)}
                isExpanded={expandedTaskId === task.id}
                onToggleSelect={() => toggleTaskSelection(task.id)}
                onToggleExpand={() => toggleTaskExpansion(task.id)}
                sendMessage={sendMessage}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <FaTasks className={styles.emptyIcon} />
              <h3>No tasks found</h3>
              <p>Try adjusting your filters or add a new task</p>
              <button
                className={styles.emptyAddButton}
                onClick={() => setShowAddForm(true)}
              >
                <FaPlus /> Add Task
              </button>
            </div>
          )}
        </div>
      ) : currentView === 'board' ? (
        <TaskBoard
          tasks={quickFilteredTasks}
          sendMessage={sendMessage}
          onAddTask={onAddTask}
        />
      ) : currentView === 'timeline' ? (
        <TaskTimeline
          tasks={quickFilteredTasks}
          onTaskAction={handleTaskAction}
          onAddTask={() => setShowAddForm(true)}
        />
      ) : currentView === 'priority' ? (
        <PriorityGroups
          tasks={quickFilteredTasks}
          onTaskAction={handleTaskAction}
          onAddTask={() => setShowAddForm(true)}
        />
      ) : (
        <TaskCalendar
          tasks={quickFilteredTasks}
          onTaskAction={handleTaskAction}
          onAddTask={(date) => setShowAddForm(true)}
        />
      )}
    </motion.div>
  );
};

export default TaskManagementDashboard;