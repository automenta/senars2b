import {create} from 'zustand';
import {Task, TaskPriority, TaskStatus} from './types';
import React from 'react';

export type SortOption = 'priority-desc' | 'priority-asc' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
export type ViewType = 'Dashboard' | 'Processing' | 'Tasks' | 'Configuration' | 'CLI';
export type StatusFilter = 'ALL' | TaskStatus;
export type TypeFilter = 'ALL' | 'REGULAR' | 'AGENT';
export type ThemeType = 'light' | 'dark';

interface AppState {
    activeView: ViewType;
    tasks: Task[];
    searchTerm: string;
    statusFilter: StatusFilter;
    typeFilter: TypeFilter;
    sortOption: SortOption;
    isModalOpen: boolean;
    theme: ThemeType;
    notificationsEnabled: boolean;
    searchInputRef: React.RefObject<HTMLInputElement> | null;
    selectedTaskId: string | null;

    // Actions
    setActiveView: (view: ViewType) => void;
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    removeTask: (id: string) => void;
    setSearchTerm: (term: string) => void;
    setStatusFilter: (filter: StatusFilter) => void;
    setTypeFilter: (filter: TypeFilter) => void;
    setSortOption: (option: SortOption) => void;
    setIsModalOpen: (isOpen: boolean) => void;
    toggleTheme: () => void;
    toggleNotifications: () => void;
    setSearchInputRef: (ref: React.RefObject<HTMLInputElement>) => void;
    setSelectedTaskId: (id: string | null) => void;

    // Derived actions
    getTaskById: (id: string) => Task | undefined;
    getSubtasks: (parentId: string) => Task[];
    clearFilters: () => void;
}

export const priorityOrder: Record<TaskPriority, number> = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
};

export const useStore = create<AppState>((set, get) => ({
    // State
    activeView: 'Dashboard',
    tasks: [],
    searchTerm: '',
    statusFilter: 'ALL',
    typeFilter: 'ALL',
    sortOption: 'priority-desc',
    isModalOpen: false,
    theme: 'light',
    notificationsEnabled: true,
    searchInputRef: null,
    selectedTaskId: null,

    // Actions
    setActiveView: (view) => set({activeView: view}),
    setTasks: (tasks) => set({tasks}),
    addTask: (task) => set((state) => ({tasks: [...state.tasks, task]})),
    updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(task =>
            task.id === id ? {...task, ...updates} : task
        )
    })),
    removeTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
    })),
    setSearchTerm: (term) => set({searchTerm: term}),
    setStatusFilter: (filter) => set({statusFilter: filter}),
    setTypeFilter: (filter) => set({typeFilter: filter}),
    setSortOption: (option) => set({sortOption: option}),
    setIsModalOpen: (isOpen) => set({isModalOpen: isOpen}),
    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({theme: newTheme});
    },
    toggleNotifications: () => set((state) => ({notificationsEnabled: !state.notificationsEnabled})),
    setSearchInputRef: (ref) => set({searchInputRef: ref}),
    setSelectedTaskId: (id) => set({selectedTaskId: id}),

    // Derived actions
    getTaskById: (id) => {
        return get().tasks.find(task => task.id === id);
    },
    getSubtasks: (parentId) => {
        return get().tasks.filter(task => task.parent_id === parentId);
    },
    clearFilters: () => set({
        searchTerm: '',
        statusFilter: 'ALL',
        typeFilter: 'ALL'
    }),
}));

// Export utility functions
export const useTaskById = (id: string) => {
    return useStore(state => state.getTaskById(id));
};

export const useSubtasks = (parentId: string) => {
    return useStore(state => state.getSubtasks(parentId));
};
