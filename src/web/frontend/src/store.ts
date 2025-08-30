import {create} from 'zustand';
import {Notification, Prompt, Task, TaskPriority, TaskStatus} from './types';
import React from 'react';

export type SortOption = 'priority-desc' | 'priority-asc' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
export type StatusFilter = 'ALL' | TaskStatus;
export type TypeFilter = 'ALL' | 'REGULAR' | 'AGENT';
export type ThemeType = 'light' | 'dark';

interface AppState {
    tasks: Task[];
    notifications: Notification[];
    prompts: Prompt[];
    searchTerm: string;
    statusFilter: StatusFilter;
    typeFilter: TypeFilter;
    sortOption: SortOption;
    theme: ThemeType;
    notificationsEnabled: boolean;
    searchInputRef: React.RefObject<HTMLInputElement> | null;
    selectedTaskId: string | null;

    // Actions
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    removeTask: (id: string) => void;
    setSearchTerm: (term: string) => void;
    setStatusFilter: (filter: StatusFilter) => void;
    setTypeFilter: (filter: TypeFilter) => void;
    setSortOption: (option: SortOption) => void;
    toggleTheme: () => void;
    toggleNotifications: () => void;
    setSearchInputRef: (ref: React.RefObject<HTMLInputElement>) => void;
    setSelectedTaskId: (id: string | null) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    addPrompt: (prompt: Prompt) => void;
    updatePrompt: (id: string, updates: Partial<Prompt>) => void;

    // Derived actions
    getTaskById: (id: string) => Task | undefined;
    getSubtasks: (parentId: string) => Task[];
    getPendingPrompts: () => Prompt[];
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
    tasks: [],
    notifications: [],
    prompts: [],
    searchTerm: '',
    statusFilter: 'ALL',
    typeFilter: 'ALL',
    sortOption: 'priority-desc',
    theme: 'light',
    notificationsEnabled: true,
    searchInputRef: null,
    selectedTaskId: null,

    // Actions
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
    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({theme: newTheme});
    },
    toggleNotifications: () => set((state) => ({notificationsEnabled: !state.notificationsEnabled})),
    setSearchInputRef: (ref) => set({searchInputRef: ref}),
    setSelectedTaskId: (id) => set({selectedTaskId: id}),
    addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, {
            ...notification,
            id: `notif-${Date.now()}`,
            timestamp: Date.now()
        }]
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
    addPrompt: (prompt) => set((state) => ({prompts: [...state.prompts, prompt]})),
    updatePrompt: (id, updates) => set((state) => ({
        prompts: state.prompts.map(p =>
            p.id === id ? {...p, ...updates} : p
        )
    })),


    // Derived actions
    getTaskById: (id) => {
        return get().tasks.find(task => task.id === id);
    },
    getSubtasks: (parentId) => {
        return get().tasks.filter(task => task.parent_id === parentId);
    },
    getPendingPrompts: () => {
        return get().prompts.filter(p => p.status === 'pending');
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
