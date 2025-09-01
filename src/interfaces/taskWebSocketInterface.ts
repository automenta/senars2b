import {CognitiveItem, TaskStatus} from '../interfaces/types';
import {TaskManager} from '../modules/taskManager';


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
            // Re-throw with more context
            throw new Error(`Task operation failed: ${error.message}`);
        }
    }

    private handleAddTask(payload: any): { task: CognitiveItem } {
        if (!payload) {
            throw new Error('Missing payload for addTask');
        }

        try {
            const task = this.taskManager.addTask(payload);
            return {task};
        } catch (error: any) {
            throw new Error(`Failed to add task: ${error.message}`);
        }
    }

    private handleUpdateTask(payload: { taskId: string; updates: Partial<CognitiveItem> }): { task: CognitiveItem } {
        if (!payload?.taskId) {
            throw new Error('Missing required field: taskId');
        }

        const task = this.taskManager.updateTask(payload.taskId, payload.updates);
        if (!task) {
            throw new Error(`Task with ID ${payload.taskId} not found`);
        }
        return {task};
    }

    private handleRemoveTask(payload: { taskId: string }): { success: boolean; message?: string } {
        if (!payload?.taskId) {
            throw new Error('Missing required field: taskId');
        }

        const success = this.taskManager.removeTask(payload.taskId);
        return {
            success,
            message: success ? `Task ${payload.taskId} removed successfully` : `Task ${payload.taskId} not found`
        };
    }

    private handleGetTask(payload: { taskId: string }): { task: CognitiveItem } | { task: null; message: string } {
        if (!payload?.taskId) {
            throw new Error('Missing required field: taskId');
        }

        const task = this.taskManager.getTask(payload.taskId);
        if (!task) {
            return {task: null, message: `Task with ID ${payload.taskId} not found`};
        }
        return {task};
    }

    private handleGetAllTasks(): { tasks: CognitiveItem[] } {
        try {
            const tasks = this.taskManager.getAllTasks();
            return {tasks};
        } catch (error: any) {
            throw new Error(`Failed to retrieve tasks: ${error.message}`);
        }
    }

    private handleUpdateTaskStatus(payload: { taskId: string; status: TaskStatus }): { task: CognitiveItem } {
        if (!payload?.taskId || !payload?.status) {
            throw new Error('Missing required fields: taskId, status');
        }

        const task = this.taskManager.updateTaskStatus(payload.taskId, payload.status);
        if (!task) {
            throw new Error(`Task with ID ${payload.taskId} not found`);
        }
        return {task};
    }

    private handleGetTaskStatistics(): { taskStatistics: any } {
        if (typeof (this.taskManager as any).getTaskStatistics !== 'function') {
            throw new Error('Task manager does not support statistics');
        }

        try {
            const statistics = (this.taskManager as any).getTaskStatistics();
            return {taskStatistics: statistics};
        } catch (error: any) {
            throw new Error(`Failed to retrieve task statistics: ${error.message}`);
        }
    }
}