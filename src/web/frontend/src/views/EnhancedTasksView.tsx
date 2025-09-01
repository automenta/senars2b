import React, {memo, useEffect, useRef, useState, useCallback} from 'react';
import {useStore} from '../store';
import styles from './EnhancedTasksView.module.css';
import {useHotkeys} from '../hooks/useHotkeys';
import {useTasks} from '../hooks/useTasks';
import {TaskPriority, TaskStatus} from '../types';
import DashboardPanel from '../components/DashboardPanel';
import {useDashboardStats} from '../hooks/useDashboardStats';
import {motion, AnimatePresence} from 'framer-motion';
import TaskManagementDashboard from '../components/task/TaskManagementDashboard';
import TaskAnalytics from '../components/task/TaskAnalytics';

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
        tasks: allTasks,
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
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    const {tasks: sortedAndFilteredTasks} = useTasks();
    const {stats, systemStatus, statsHistory, isLoading} = useDashboardStats();

    useEffect(() => {
        if (searchInput.current) {
            setSearchInputRef(searchInput);
        }
    }, [setSearchInputRef]);

    // Handle toggle analytics event
    useEffect(() => {
        const handleToggleAnalytics = () => {
            setShowAnalytics(prev => !prev);
        };
        
        window.addEventListener('toggleAnalytics', handleToggleAnalytics);
        
        return () => {
            window.removeEventListener('toggleAnalytics', handleToggleAnalytics);
        };
    }, []);

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
        'n': () => setShowAddForm(true),
        'f': () => setShowAddForm(true),
        'a': () => setShowAnalytics(prev => !prev),
    }, []);

    return (
        <motion.div
            className={styles.tasksView}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{duration: 0.3}}
        >
            {showAnalytics && (
                <TaskAnalytics tasks={allTasks} />
            )}
            <TaskManagementDashboard
                sendMessage={handleTaskAction}
                onAddTask={onAddTask}
            />
        </motion.div>
    );
});

export default EnhancedTasksView;