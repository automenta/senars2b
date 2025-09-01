import {create} from 'zustand';
import {Notification, Prompt, Task, TaskPriority, TaskStatus} from './types';
import React from 'react';
import {crdtTaskManager} from './crdtTaskManager';

export type SortOption = 'priority-desc' | 'priority-asc' | 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';
export type StatusFilter = 'ALL' | TaskStatus;
export type TypeFilter = 'ALL' | 'REGULAR' | 'AGENT';
export type PriorityFilter = 'ALL' | TaskPriority;
export type ThemeType = 'light' | 'dark';

interface AppState {
    tasks: Task[];
    notifications: Notification[];
    prompts: Prompt[];
    searchTerm: string;
    statusFilter: StatusFilter;
    typeFilter: TypeFilter;
    priorityFilter: PriorityFilter;
    sortOption: SortOption;
    theme: ThemeType;
    notificationsEnabled: boolean;
    searchInputRef: React.RefObject<HTMLInputElement> | null;
    selectedTaskId: string | null;
    isConnected: boolean;
    taskGroups: Record<string, Task[]>;

    // Actions
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    removeTask: (id: string) => void;
    reorderTasks: (orderedTaskIds: string[]) => void;
    addTaskToGroup: (groupId: string, taskId: string) => void;
    removeTaskFromGroup: (groupId: string, taskId: string) => void;
    setSearchTerm: (term: string) => void;
    setStatusFilter: (filter: StatusFilter) => void;
    setTypeFilter: (filter: TypeFilter) => void;
    setPriorityFilter: (filter: PriorityFilter) => void;
    setSortOption: (option: SortOption) => void;
    toggleTheme: () => void;
    toggleNotifications: () => void;
    setSearchInputRef: (ref: React.RefObject<HTMLInputElement>) => void;
    setSelectedTaskId: (id: string | null) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    addPrompt: (prompt: Prompt) => void;
    updatePrompt: (id: string, updates: Partial<Prompt>) => void;
    setConnectionStatus: (connected: boolean) => void;
    setTaskGroups: (groups: Record<string, Task[]>) => void;

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
    priorityFilter: 'ALL',
    sortOption: 'priority-desc',
    theme: 'light',
    notificationsEnabled: true,
    searchInputRef: null,
    selectedTaskId: null,
    isConnected: false,
    taskGroups: {},

    // Actions
    setTasks: (tasks) => set({tasks}),
    addTask: (task) => {
        // Add to CRDT store
        crdtTaskManager.addTask(task);
    },
    updateTask: (id, updates) => {
        // Update in CRDT store
        crdtTaskManager.updateTask(id, updates);
    },
    removeTask: (id) => {
        // Remove from CRDT store
        crdtTaskManager.removeTask(id);
    },
    reorderTasks: (orderedTaskIds) => {
        // Reorder in CRDT store
        crdtTaskManager.reorderTasks(orderedTaskIds);
    },
    addTaskToGroup: (groupId, taskId) => {
        // Add task to group in CRDT store
        crdtTaskManager.addTaskToGroup(groupId, taskId);
    },
    removeTaskFromGroup: (groupId, taskId) => {
        // Remove task from group in CRDT store
        crdtTaskManager.removeTaskFromGroup(groupId, taskId);
    },
    setSearchTerm: (term) => set({searchTerm: term}),
    setStatusFilter: (filter) => set({statusFilter: filter}),
    setTypeFilter: (filter) => set({typeFilter: filter}),
    setPriorityFilter: (filter) => set({priorityFilter: filter}),
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
    setConnectionStatus: (connected) => set({isConnected: connected}),
    setTaskGroups: (groups) => set({taskGroups: groups}),

    // Derived actions (these should not be used directly in components)
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
        typeFilter: 'ALL',
        priorityFilter: 'ALL'
    }),
}));

// Export utility functions
export const useTaskById = (id: string) => {
    return useStore(state => state.getTaskById(id));
};

export const useSubtasks = (parentId: string) => {
    return useStore(state => state.getSubtasks(parentId));
};

export const usePendingPrompts = () => {
    return useStore(state => state.getPendingPrompts());
};

// Initialize CRDT synchronization
if (typeof window !== 'undefined') {
    // Subscribe to task changes
    crdtTaskManager.subscribeToTasks((tasks) => {
        useStore.getState().setTasks(tasks);
    });

    // Subscribe to connection status
    crdtTaskManager.subscribeToConnection((connected) => {
        useStore.getState().setConnectionStatus(connected);
    });
}