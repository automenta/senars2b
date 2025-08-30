import { useMemo } from 'react';
import { useStore, priorityOrder } from '../store';
import { Task, TaskPriority } from '../types';

export const useTasks = () => {
    const {
        tasks,
        searchTerm,
        statusFilter,
        typeFilter,
        sortOption,
    } = useStore();

    const sortedAndFilteredTasks = useMemo(() => {
        return tasks
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
    }, [tasks, searchTerm, statusFilter, typeFilter, sortOption]);

    const taskStats = useMemo(() => ({
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'PENDING').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        completed: tasks.filter(t => t.status === 'COMPLETED').length,
    }), [tasks]);

    return {
        tasks: sortedAndFilteredTasks,
        taskStats,
        allTasks: tasks,
    };
};