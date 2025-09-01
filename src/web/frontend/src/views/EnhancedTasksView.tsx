import React, {memo, useEffect, useRef, useState, useCallback} from 'react';
import EnhancedTaskList from '../components/enhanced/EnhancedTaskList';
import EnhancedTaskBoard from '../components/enhanced/EnhancedTaskBoard';
import ViewSwitcher from '../components/ViewSwitcher';
import {useStore} from '../store';
import styles from './EnhancedTasksView.module.css';
import {useHotkeys} from '../hooks/useHotkeys';
import {useTasks} from '../hooks/useTasks';
import {FaFilter, FaSearch, FaSort, FaChevronDown, FaChevronUp, FaMagic, FaPlus} from 'react-icons/fa';
import InlineAddTaskForm from '../components/InlineAddTaskForm';
import {TaskPriority, TaskStatus} from '../types';
import DashboardPanel from '../components/DashboardPanel';
import {useDashboardStats} from '../hooks/useDashboardStats';
import {motion, AnimatePresence} from 'framer-motion';
import TaskPrioritization from '../components/enhanced/TaskPrioritization';

interface EnhancedTasksViewProps {
    sendMessage: (message: any) => void;
    onAddTask: (task: {
        title: string;
        description?: string;
        priority: TaskPriority,
        type: 'REGULAR' | 'AGENT'
    }, status?: TaskStatus) => void;
}

const EnhancedTasksView: React.FC<EnhancedTasksViewProps> = memo(({sendMessage, onAddTask}) => {
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
    const [currentView, setCurrentView] = useState<'list' | 'board' | 'prioritize'>('list');
    const [showPrioritization, setShowPrioritization] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const {tasks: sortedAndFilteredTasks} = useTasks();
    const {stats, systemStatus, statsHistory, isLoading} = useDashboardStats();

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
    const handleTaskAction = useCallback((action: string, payload: any) => {
        try {
            sendMessage({type: action, payload});
        } catch (err) {
            console.error(`Error sending ${action} message:`, err);
            setError(`Failed to ${action.toLowerCase()}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }, [sendMessage]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

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
        'f': () => setShowFilters(prev => !prev),
        'v': () => setCurrentView(prev => prev === 'list' ? 'board' : prev === 'board' ? 'list' : 'list'),
        'n': () => setShowAddForm(true),
        // New keyboard shortcuts for task management
        'e': () => {
            if (selectedTaskIndex !== -1) {
                // TODO: Implement edit task
                console.log('Edit task:', sortedAndFilteredTasks[selectedTaskIndex].id);
            }
        },
        'd': () => {
            if (selectedTaskIndex !== -1) {
                // TODO: Implement delete task
                console.log('Delete task:', sortedAndFilteredTasks[selectedTaskIndex].id);
            }
        },
        'c': () => {
            if (selectedTaskIndex !== -1) {
                // TODO: Implement complete task
                console.log('Complete task:', sortedAndFilteredTasks[selectedTaskIndex].id);
            }
        },
        'p': () => {
            if (selectedTaskIndex !== -1) {
                // TODO: Implement change priority
                console.log('Change priority for task:', sortedAndFilteredTasks[selectedTaskIndex].id);
            }
        }
    }, [sortedAndFilteredTasks, selectedTaskIndex]);

    // Filter options with proper display names
    const statusOptions = [
        {value: 'ALL', label: 'All'},
        {value: 'pending', label: 'Pending'},
        {value: 'awaiting_dependencies', label: 'Awaiting Dependencies'},
        {value: 'decomposing', label: 'Decomposing'},
        {value: 'awaiting_subtasks', label: 'Awaiting Subtasks'},
        {value: 'ready_for_execution', label: 'Ready for Execution'},
        {value: 'completed', label: 'Completed'},
        {value: 'failed', label: 'Failed'},
        {value: 'deferred', label: 'Deferred'}
    ];

    const typeOptions = [
        {value: 'ALL', label: 'All'},
        {value: 'REGULAR', label: 'Regular'},
        {value: 'AGENT', label: 'Agent'}
    ];

    const handleAddTaskWithStatus = useCallback((status: TaskStatus) => {
        // This would open a modal or form to add a task with the specified status
        console.log('Add task with status:', status);
        // For now, we'll just use the existing onAddTask function
        onAddTask({
            title: 'New Task',
            priority: 'medium',
            type: 'REGULAR'
        }, status);
    }, [onAddTask]);

    const handleSavePriorities = useCallback((priorities: { taskId: string; priority: TaskPriority }[]) => {
        // Send priority updates to the server
        priorities.forEach(({taskId, priority}) => {
            handleTaskAction('UPDATE_TASK_PRIORITY', {
                id: taskId,
                priority
            });
        });
        setShowPrioritization(false);
    }, [handleTaskAction]);

    return (
        <motion.div
            className={styles.tasksView}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3}}
        >
            <div className={styles.header}>
                <h1>Task Management</h1>
                <p>Organize and track your tasks</p>
            </div>

            <DashboardPanel
                stats={stats}
                systemStatus={systemStatus}
                statsHistory={statsHistory}
                isLoading={isLoading}
            />

            <AnimatePresence>
                {error && (
                    <motion.div
                        className={styles.errorBanner}
                        initial={{opacity: 0, y: -20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.2}}
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={styles.controlsBar}>
                <motion.button
                    onClick={() => setShowAddForm(true)}
                    className={styles.addButton}
                    whileHover={{scale: 1.03}}
                    whileTap={{scale: 0.98}}
                >
                    <FaPlus/> Add Task
                </motion.button>
                
                <div className={styles.viewAndFilterControls}>
                    <ViewSwitcher currentView={currentView} onViewChange={setCurrentView}/>
                    <motion.button
                        onClick={() => setShowFilters(!showFilters)}
                        className={styles.toggleFiltersBtn}
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.98}}
                    >
                        <FaFilter/> Filters
                        {showFilters ? <FaChevronUp/> : <FaChevronDown/>}
                    </motion.button>
                    <motion.button
                        onClick={() => setShowPrioritization(true)}
                        className={styles.prioritizeBtn}
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.98}}
                    >
                        <FaMagic/> Prioritize
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
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

            <div className={styles.searchAndFilters}>
                <div className={styles.searchContainer}>
                    <FaSearch className={styles.searchIcon}/>
                    <input
                        ref={searchInput}
                        type="text"
                        placeholder="Search tasks... (/)"
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
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                        transition={{duration: 0.3}}
                    >
                        <div className={styles.filterSection}>
                            <div className={styles.filterHeader}>
                                <FaFilter className={styles.filterIcon}/>
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
                                            whileHover={{scale: 1.05}}
                                            whileTap={{scale: 0.95}}
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
                                            whileHover={{scale: 1.05}}
                                            whileTap={{scale: 0.95}}
                                            layout
                                        >
                                            {option.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.sortSection}>
                            <div className={styles.filterHeader}>
                                <FaSort className={styles.filterIcon}/>
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

            {showPrioritization ? (
                <TaskPrioritization
                    tasks={sortedAndFilteredTasks}
                    onSavePriorities={handleSavePriorities}
                    onCancel={() => setShowPrioritization(false)}
                />
            ) : currentView === 'list' ? (
                <EnhancedTaskList
                    tasks={sortedAndFilteredTasks}
                    sendMessage={handleTaskAction}
                    selectedTaskIndex={selectedTaskIndex}
                />
            ) : (
                <EnhancedTaskBoard
                    tasks={sortedAndFilteredTasks}
                    sendMessage={handleTaskAction}
                    onAddTask={handleAddTaskWithStatus}
                />
            )}
        </motion.div>
    );
});

export default EnhancedTasksView;