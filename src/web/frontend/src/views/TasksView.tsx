import React, {memo, useEffect, useRef, useState, useCallback} from 'react';
import EnhancedTaskList from '../components/EnhancedTaskList';
import BoardView from '../components/BoardView';
import {useStore} from '../store';
import styles from './TasksView.module.css';
import {useHotkeys} from '../hooks/useHotkeys';
import {useTasks} from '../hooks/useTasks';
import {FaFilter, FaSearch, FaSort, FaChevronDown, FaChevronUp} from 'react-icons/fa';
import InlineAddTaskForm from '../components/InlineAddTaskForm';
import {TaskPriority} from '../types';
import DashboardPanel from '../components/DashboardPanel';
import {useDashboardStats} from '../hooks/useDashboardStats';
import {motion, AnimatePresence} from 'framer-motion';
import TaskCollection from '../components/task/TaskCollection';
import TaskBoard from '../components/task/TaskBoard';
import TaskPrioritizationView from '../components/task/TaskPrioritization';
import TaskViewSwitcher from '../components/task/TaskViewSwitcher';
import {crdtTaskManager} from '../crdtTaskManager';

interface TasksViewProps {
    sendMessage: (message: any) => void;
    onAddTask: (task: {
        title: string;
        description?: string;
        priority: TaskPriority,
        type: 'REGULAR' | 'AGENT'
    }) => void;
}

const TasksView: React.FC<TasksViewProps> = memo(({sendMessage, onAddTask}) => {
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
        selectedTaskId,
        setSelectedTaskId,
    } = useStore();

    const searchInput = useRef<HTMLInputElement>(null);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(-1);
    const [showFilters, setShowFilters] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'list' | 'board' | 'prioritization' | 'analytics'>('list');
    const [showPrioritization, setShowPrioritization] = useState(false);

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
        'v': () => setCurrentView(prev => {
            const views: Array<'list' | 'board' | 'prioritization' | 'analytics'> = ['list', 'board', 'prioritization', 'analytics'];
            const currentIndex = views.indexOf(prev);
            return views[(currentIndex + 1) % views.length];
        }),
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

    const handleTaskSelect = useCallback((taskId: string | null) => {
        setSelectedTaskId(taskId);
    }, [setSelectedTaskId]);

    const handleTaskEditStart = useCallback((taskId: string) => {
        console.log('Edit task started:', taskId);
    }, []);

    const handleTaskEditEnd = useCallback((taskId: string) => {
        console.log('Edit task ended:', taskId);
    }, []);

    const handlePrioritizationSave = useCallback(() => {
        setShowPrioritization(false);
        // Refresh tasks to reflect new priorities
        // In a real implementation, this would be handled by the CRDT sync
    }, []);

    return (
        <motion.div
            className={styles.tasksView}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3}}
        >
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

            <InlineAddTaskForm onAddTask={onAddTask}/>

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

                <div className={styles.viewAndFilterControls}>
                    <TaskViewSwitcher currentView={currentView} onViewChange={setCurrentView}/>
                    <motion.button
                        onClick={() => setShowFilters(!showFilters)}
                        className={styles.toggleFiltersBtn}
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.98}}
                    >
                        <FaFilter/> Filters
                        {showFilters ? <FaChevronUp/> : <FaChevronDown/>}
                    </motion.button>
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

            {currentView === 'list' && (
                <TaskCollection
                    tasks={sortedAndFilteredTasks}
                    selectedTaskId={selectedTaskId}
                    onTaskSelect={handleTaskSelect}
                    onTaskEditStart={handleTaskEditStart}
                    onTaskEditEnd={handleTaskEditEnd}
                />
            )}

            {currentView === 'board' && (
                <TaskBoard
                    tasks={sortedAndFilteredTasks}
                    selectedTaskId={selectedTaskId}
                    onTaskSelect={handleTaskSelect}
                    onTaskEditStart={handleTaskEditStart}
                    onTaskEditEnd={handleTaskEditEnd}
                />
            )}

            {currentView === 'prioritization' && (
                <div style={{padding: '16px'}}>
                    <button
                        onClick={() => setShowPrioritization(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#4a6cf7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Open Task Prioritization View
                    </button>
                </div>
            )}

            {currentView === 'analytics' && (
                <div style={{padding: '16px'}}>
                    <h2>Analytics View</h2>
                    <p>Analytics features would be implemented here.</p>
                </div>
            )}

            <AnimatePresence>
                {showPrioritization && (
                    <TaskPrioritizationView
                        tasks={sortedAndFilteredTasks}
                        onClose={() => setShowPrioritization(false)}
                        onSave={handlePrioritizationSave}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default TasksView;