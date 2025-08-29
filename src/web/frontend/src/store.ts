import create from 'zustand';
import { Task, TaskPriority } from './types';

interface AppState {
  activeView: string;
  tasks: Task[];
  searchTerm: string;
  statusFilter: string;
  isModalOpen: boolean;
  theme: string;
  setActiveView: (view: string) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: string) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  toggleTheme: () => void;
  handleAddTask: (task: { title: string; description?: string; priority: TaskPriority, type: 'REGULAR' | 'AGENT' }, sendMessage: (msg: any) => void) => void;
}

export const useStore = create<AppState>((set, get) => ({
  activeView: 'Dashboard',
  tasks: [],
  searchTerm: '',
  statusFilter: 'ALL',
  isModalOpen: false,
  theme: 'light',
  setActiveView: (view) => set({ activeView: view }),
  setTasks: (tasks) => set({ tasks: tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  },
}));
