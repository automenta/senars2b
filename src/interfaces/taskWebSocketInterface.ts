import { CognitiveItem } from '../interfaces/types';
import { TaskManager } from '../modules/taskManager';
import WebSocket = require('ws');

/**
 * TaskWebSocketHandler - Handles task-related WebSocket requests
 * 
 * This class consolidates task handling functionality that was previously
 * split between WebSocketInterface and TaskWebSocketInterface.
 */
export class TaskWebSocketHandler {
    private taskManager: TaskManager;

    constructor(taskManager: TaskManager) {
        this.taskManager = taskManager;
    }

    handleTaskRequest(id: string, method: string, payload?: any): any {
        try {
            switch (method) {
                case 'addTask':
                    return this.handleAddTask(payload);
                case 'updateTask':
                    return this.handleUpdateTask(payload);
                case 'removeTask':
                    return this.handleRemoveTask(payload);
                case 'getTask':
                    return this.handleGetTask(payload);
                case 'getAllTasks':
                    return this.handleGetAllTasks();
                case 'updateTaskStatus':
                    return this.handleUpdateTaskStatus(payload);
                case 'getTaskStatistics':
                    return this.handleGetTaskStatistics();
                default:
                    throw new Error(`Unknown task method: ${method}`);
            }
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    private handleAddTask(payload: any): { task: CognitiveItem } {
        if (!payload) {
            throw new Error('Missing payload');
        }
        const task = this.taskManager.addTask(payload);
        return { task };
    }

    private handleUpdateTask(payload: { taskId: string; updates: Partial<CognitiveItem> }): { task: CognitiveItem } {
        if (!payload?.taskId) {
            throw new Error('Missing required field: taskId');
        }
        const task = this.taskManager.updateTask(payload.taskId, payload.updates);
        if (!task) {
            throw new Error(`Task with ID ${payload.taskId} not found`);
        }
        return { task };
    }

    private handleRemoveTask(payload: { taskId: string }): { success: boolean } {
        if (!payload?.taskId) {
            throw new Error('Missing required field: taskId');
        }
        const success = this.taskManager.removeTask(payload.taskId);
        return { success };
    }

    private handleGetTask(payload: { taskId: string }): { task: CognitiveItem } {
        if (!payload?.taskId) {
            throw new Error('Missing required field: taskId');
        }
        const task = this.taskManager.getTask(payload.taskId);
        if (!task) {
            throw new Error(`Task with ID ${payload.taskId} not found`);
        }
        return { task };
    }

    private handleGetAllTasks(): { tasks: CognitiveItem[] } {
        const tasks = this.taskManager.getAllTasks();
        return { tasks };
    }

    private handleUpdateTaskStatus(payload: { taskId: string; status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred' }): { task: CognitiveItem } {
        if (!payload?.taskId || !payload?.status) {
            throw new Error('Missing required fields: taskId, status');
        }
        const task = this.taskManager.updateTaskStatus(payload.taskId, payload.status);
        if (!task) {
            throw new Error(`Task with ID ${payload.taskId} not found`);
        }
        return { task };
    }

    private handleGetTaskStatistics(): { taskStatistics: any } {
        if (typeof (this.taskManager as any).getTaskStatistics !== 'function') {
            throw new Error('Task manager does not support statistics');
        }
        
        const statistics = (this.taskManager as any).getTaskStatistics();
        return { taskStatistics: statistics };
    }
}