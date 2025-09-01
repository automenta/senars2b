import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import {Task} from './types';

// Create a shared document for tasks
const ydoc = new Y.Doc();

// Create a Y.Map to store tasks
const yTasks = ydoc.getMap<Task>('tasks');

// Create a Y.Map to store task order
const yTaskOrder = ydoc.getMap<string[]>('taskOrder');

// Create a Y.Map to store task groups/collections
const yTaskGroups = ydoc.getMap<Y.Map<string>>('taskGroups');

// WebSocket provider for real-time sync
let provider: WebsocketProvider | null = null;

// Initialize provider only in browser environment
if (typeof window !== 'undefined') {
    const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/yjs`;
    provider = new WebsocketProvider(WS_URL, 'tasks-room', ydoc);
}

// CRDT-aware task manager
export const crdtTaskManager = {
    // Add a task to the shared document
    addTask: (task: Task) => {
        ydoc.transact(() => {
            yTasks.set(task.id, task);

            // Update task order
            const currentOrder = yTaskOrder.get('default') || [];
            yTaskOrder.set('default', [...currentOrder, task.id]);
        });
    },

    // Update a task in the shared document
    updateTask: (id: string, updates: Partial<Task>) => {
        const task = yTasks.get(id);
        if (task) {
            const updatedTask = {...task, ...updates};
            yTasks.set(id, updatedTask);
        }
    },

    // Remove a task from the shared document
    removeTask: (id: string) => {
        ydoc.transact(() => {
            yTasks.delete(id);

            // Update task order
            const currentOrder = yTaskOrder.get('default') || [];
            const newOrder = currentOrder.filter(taskId => taskId !== id);
            yTaskOrder.set('default', newOrder);

            // Remove from any groups
            yTaskGroups.forEach(group => {
                group.delete(id);
            });
        });
    },

    // Reorder tasks
    reorderTasks: (orderedTaskIds: string[]) => {
        yTaskOrder.set('default', orderedTaskIds);
    },

    // Add task to a group
    addTaskToGroup: (groupId: string, taskId: string) => {
        ydoc.transact(() => {
            let group = yTaskGroups.get(groupId);
            if (!group) {
                group = new Y.Map<string>();
                yTaskGroups.set(groupId, group);
            }
            group.set(taskId, taskId);
        });
    },

    // Remove task from a group
    removeTaskFromGroup: (groupId: string, taskId: string) => {
        const group = yTaskGroups.get(groupId);
        if (group) {
            group.delete(taskId);
        }
    },

    // Get a task by ID
    getTask: (id: string): Task | undefined => {
        return yTasks.get(id);
    },

    // Get all tasks
    getAllTasks: (): Task[] => {
        const tasks: Task[] = [];
        yTasks.forEach((task) => {
            tasks.push(task);
        });
        return tasks;
    },

    // Get task order
    getTaskOrder: (): string[] => {
        return yTaskOrder.get('default') || [];
    },

    // Get ordered tasks
    getOrderedTasks: (): Task[] => {
        const order = crdtTaskManager.getTaskOrder();
        const tasks = crdtTaskManager.getAllTasks();
        const taskMap = new Map(tasks.map(task => [task.id, task]));

        return order
            .map(id => taskMap.get(id))
            .filter((task): task is Task => task !== undefined);
    },

    // Get tasks in a group
    getTasksInGroup: (groupId: string): Task[] => {
        const group = yTaskGroups.get(groupId);
        if (!group) return [];

        const tasks: Task[] = [];
        group.forEach((taskId) => {
            const task = yTasks.get(taskId);
            if (task) tasks.push(task);
        });

        return tasks;
    },

    // Bulk update tasks
    setTasks: (tasks: Task[]) => {
        ydoc.transact(() => {
            // Clear existing tasks
            yTasks.clear();

            // Add new tasks
            tasks.forEach((task) => {
                yTasks.set(task.id, task);
            });

            // Update task order
            yTaskOrder.set('default', tasks.map(task => task.id));
        });
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
    },

    // Subscribe to changes
    subscribeToTasks: (callback: (tasks: Task[]) => void) => {
        const handler = () => {
            callback(crdtTaskManager.getOrderedTasks());
        };

        yTasks.observe(handler);
        yTaskOrder.observe(handler);
        yTaskGroups.observeDeep(handler);

        // Return unsubscribe function
        return () => {
            yTasks.unobserve(handler);
            yTaskOrder.unobserve(handler);
            yTaskGroups.unobserveDeep(handler);
        };
    },

    // Subscribe to connection status
    subscribeToConnection: (callback: (connected: boolean) => void) => {
        if (!provider) return () => {
        };

        const handler = () => {
            callback(provider!.wsconnected);
        };

        provider.on('status', handler);

        // Return unsubscribe function
        return () => {
            provider!.off('status', handler);
        };
    }
};