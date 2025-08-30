import React, { useEffect, useRef, useState } from 'react';
import TaskList from '../components/TaskList';
import { useStore, priorityOrder } from '../store';
import { TaskPriority } from '../types';
import styles from './TasksView.module.css';
import { useHotkeys } from '../hooks/useHotkeys';
import { FaSearch, FaFilter, FaSort } from 'react-icons/fa';

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
        typeFilter,
        setTypeFilter,
        sortOption,
        setSortOption,
        setSearchInputRef,
    } = useStore();

    const searchInput = useRef<HTMLInputElement>(null);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(-1);
    const [showFilters, setShowFilters] = useState(true);

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
                    return priorityOrder[b.priority.toLowerCase() as TaskPriority] - priorityOrder[a.priority.toLowerCase() as TaskPriority];
                case 'priority-asc':
                    return priorityOrder[a.priority.toLowerCase() as TaskPriority] - priorityOrder[b.priority.toLowerCase() as TaskPriority];
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
        'f': () => setShowFilters(prev => !prev),
    }, [sortedAndFilteredTasks, selectedTaskIndex]);

    const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'PENDING').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length,
    };

    return (
        <div className={styles.tasksView}>
            <div className={styles.header}>
                <h2>Tasks</h2>
                <div className={styles.stats}>
                    <span className={styles.statItem}>Total: {taskStats.total}</span>
                    <span className={styles.statItem}>Pending: {taskStats.pending}</span>
                    <span className={styles.statItem}>In Progress: {taskStats.inProgress}</span>
                    <span className={styles.statItem}>Completed: {taskStats.completed}</span>
                </div>
            </div>

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
                                {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`${styles.filterButton} ${statusFilter === status ? styles.active : ''}`}
                                    >
                                        {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Type:</label>
                            <div className={styles.filterOptions}>
                                {['ALL', 'REGULAR', 'AGENT'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`${styles.filterButton} ${typeFilter === type ? styles.active : ''}`}
                                    >
                                        {type.charAt(0) + type.slice(1).toLowerCase()}
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

            <TaskList tasks={sortedAndFilteredTasks} sendMessage={sendMessage} selectedTaskIndex={selectedTaskIndex} />
        </div>
    );
};

export default TasksView;
