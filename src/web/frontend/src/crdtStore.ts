// Legacy CRDT store - replaced by crdtTaskManager
// This file is kept for backward compatibility but is no longer used

import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import {Task} from './types';

// Create a shared document for tasks
const ydoc = new Y.Doc();

// Create a Y.Map to store tasks
const yTasks = ydoc.getMap<Task>('tasks');

// WebSocket provider for real-time sync
// Use relative URL so it connects to the same server
const WS_URL = typeof window !== 'undefined' ? '/yjs' : 'ws://localhost:3000/yjs';
let provider: WebsocketProvider | null = null;

// Only initialize provider in browser environment
if (typeof window !== 'undefined') {
    provider = new WebsocketProvider(WS_URL, 'tasks-room', ydoc);
}

// Export functions to interact with the shared document
// These are now legacy functions - use crdtTaskManager instead
export const crdtStore = {
    // Add a task to the shared document
    addTask: (task: Task) => {
        if (yTasks) {
            yTasks.set(task.id, task);
        }
    },

    // Update a task in the shared document
    updateTask: (id: string, updates: Partial<Task>) => {
        if (yTasks) {
            const task = yTasks.get(id);
            if (task) {
                const updatedTask = {...task, ...updates};
                yTasks.set(id, updatedTask);
            }
        }
    },

    // Remove a task from the shared document
    removeTask: (id: string) => {
        if (yTasks) {
            yTasks.delete(id);
        }
    },

    // Get a task by ID
    getTask: (id: string): Task | undefined => {
        if (yTasks) {
            return yTasks.get(id);
        }
        return undefined;
    },

    // Get all tasks
    getAllTasks: (): Task[] => {
        const tasks: Task[] = [];
        if (yTasks) {
            yTasks.forEach((task) => {
                tasks.push(task);
            });
        }
        return tasks;
    },

    // Bulk update tasks
    setTasks: (tasks: Task[]) => {
        if (ydoc && yTasks) {
            ydoc.transact(() => {
                // Clear existing tasks
                yTasks.clear();

                // Add new tasks
                tasks.forEach((task) => {
                    yTasks.set(task.id, task);
                });
            });
        }
    },

    // Connection status
    isConnected: () => {
        return provider ? provider.wsconnected : false;
    },

    // Awareness (for presence information)
    awareness: provider ? provider.awareness : null,

    // Destroy provider
    destroy: () => {
        if (provider) {
            provider.destroy();
        }
        ydoc.destroy();
    }
};