import {useMemo} from 'react';
import {priorityOrder, useStore} from '../store';
import {TaskPriority} from '../types';

export const useTasks = () => {
    const {
        tasks,
        searchTerm,
        statusFilter,
        typeFilter,
        priorityFilter,
        sortOption,
    } = useStore();

    const sortedAndFilteredTasks = useMemo(() => {
        try {
            return tasks
                .filter(task => {
                    // Search term filter
                    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return false;
                    }

                    // Status filter
                    if (statusFilter !== 'ALL' && task.status !== statusFilter) {
                        return false;
                    }

                    // Type filter
                    if (typeFilter !== 'ALL' && task.type !== typeFilter) {
                        return false;
                    }

                    // Priority filter
                    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
                        return false;
                    }

                    return true;
                })
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
        } catch (error) {
            console.error('Error filtering/sorting tasks:', error);
            return tasks; // Return unfiltered tasks on error
        }
    }, [tasks, searchTerm, statusFilter, typeFilter, priorityFilter, sortOption]);

    const taskStats = useMemo(() => {
        try {
            return {
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'pending').length,
                inProgress: tasks.filter(t =>
                    t.status === 'awaiting_dependencies' ||
                    t.status === 'decomposing' ||
                    t.status === 'awaiting_subtasks' ||
                    t.status === 'ready_for_execution'
                ).length,
                completed: tasks.filter(t => t.status === 'completed').length,
                failed: tasks.filter(t => t.status === 'failed').length,
                deferred: tasks.filter(t => t.status === 'deferred').length,
            };
        } catch (error) {
            console.error('Error calculating task stats:', error);
            return {
                total: 0,
                pending: 0,
                inProgress: 0,
                completed: 0,
                failed: 0,
                deferred: 0,
            };
        }
    }, [tasks]);

    return {
        tasks: sortedAndFilteredTasks,
        taskStats,
        allTasks: tasks,
    };
};