import { create } from 'zustand';
import { Task, TaskPriority } from './types';
import React from 'react';

type SortOption = 'priority-desc' | 'priority-asc' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

interface AppState {
    activeView: string;
    tasks: Task[];
    searchTerm: string;
    statusFilter: string;
    typeFilter: string;
    sortOption: SortOption;
    isModalOpen: boolean;
    theme: string;
    notificationsEnabled: boolean;
    searchInputRef: React.RefObject<HTMLInputElement> | null;
    setActiveView: (view: string) => void;
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    setSearchTerm: (term: string) => void;
    setStatusFilter: (filter: string) => void;
    setTypeFilter: (filter: string) => void;
    setSortOption: (option: SortOption) => void;
    setIsModalOpen: (isOpen: boolean) => void;
    toggleTheme: () => void;
    toggleNotifications: () => void;
    setSearchInputRef: (ref: React.RefObject<HTMLInputElement>) => void;
}

const priorityOrder: Record<TaskPriority, number> = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
};

export const useStore = create<AppState>((set, get) => ({
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
    setActiveView: (view) => set({ activeView: view }),
    setTasks: (tasks) => set({ tasks }),
    addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setStatusFilter: (filter) => set({ statusFilter: filter }),
    setTypeFilter: (filter) => set({ typeFilter: filter }),
    setSortOption: (option) => set({ sortOption: option }),
    setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({ theme: newTheme });
    },
    toggleNotifications: () => set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
    setSearchInputRef: (ref) => set({ searchInputRef: ref }),
}));

// Export the priority order for use in other components
export { priorityOrder };
