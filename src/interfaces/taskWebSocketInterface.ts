import { Task } from './task';
import { TaskManager } from '../modules/taskManager';
import WebSocket = require('ws');

export class TaskWebSocketInterface {
    private taskManager: TaskManager;
    private ws: WebSocket;

    constructor(taskManager: TaskManager, ws: WebSocket) {
        this.taskManager = taskManager;
        this.ws = ws;
        
        // Add event listener to broadcast task updates
        this.taskManager.addEventListener((event: { type: string; task: Task }) => {
            this.broadcastTaskEvent(event);
        });
    }

    handleTaskRequest(message: any): void {
        try {
            const { id, method, payload } = message;
            
            switch (method) {
                case 'addTask':
                    this.handleAddTask(id, payload);
                    break;
                case 'updateTask':
                    this.handleUpdateTask(id, payload);
                    break;
                case 'removeTask':
                    this.handleRemoveTask(id, payload);
                    break;
                case 'getTask':
                    this.handleGetTask(id, payload);
                    break;
                case 'getAllTasks':
                    this.handleGetAllTasks(id);
                    break;
                case 'updateTaskStatus':
                    this.handleUpdateTaskStatus(id, payload);
                    break;
                case 'getTaskStatistics': // Added new case
                    this.handleGetTaskStatistics(id);
                    break;
                default:
                    this.sendError(id, `Unknown task method: ${method}`);
            }
        } catch (error: any) {
            this.sendError(message.id, error.message);
        }
    }

    private handleAddTask(id: string, payload: any): void {
        try {
            const task = this.taskManager.addTask(payload);
            this.sendResponse(id, { task });
        } catch (error: any) {
            this.sendError(id, error.message);
        }
    }

    private handleUpdateTask(id: string, payload: { taskId: string; updates: Partial<Task> }): void {
        try {
            const { taskId, updates } = payload;
            const task = this.taskManager.updateTask(taskId, updates);
            if (task) {
                this.sendResponse(id, { task });
            } else {
                this.sendError(id, `Task with ID ${taskId} not found`);
            }
        } catch (error: any) {
            this.sendError(id, error.message);
        }
    }

    private handleRemoveTask(id: string, payload: { taskId: string }): void {
        try {
            const { taskId } = payload;
            const success = this.taskManager.removeTask(taskId);
            this.sendResponse(id, { success });
        } catch (error: any) {
            this.sendError(id, error.message);
        }
    }

    private handleGetTask(id: string, payload: { taskId: string }): void {
        try {
            const { taskId } = payload;
            const task = this.taskManager.getTask(taskId);
            if (task) {
                this.sendResponse(id, { task });
            } else {
                this.sendError(id, `Task with ID ${taskId} not found`);
            }
        } catch (error: any) {
            this.sendError(id, error.message);
        }
    }

    private handleGetAllTasks(id: string): void {
        try {
            const tasks = this.taskManager.getAllTasks();
            this.sendResponse(id, { tasks });
        } catch (error: any) {
            this.sendError(id, error.message);
        }
    }

    private handleUpdateTaskStatus(id: string, payload: { taskId: string; status: Task['status'] }): void {
        try {
            const { taskId, status } = payload;
            const task = this.taskManager.updateTaskStatus(taskId, status);
            if (task) {
                this.sendResponse(id, { task });
            } else {
                this.sendError(id, `Task with ID ${taskId} not found`);
            }
        } catch (error: any) {
            this.sendError(id, error.message);
        }
    }

    private handleGetTaskStatistics(id: string): void {
        try {
            if (typeof (this.taskManager as any).getTaskStatistics !== 'function') {
                this.sendError(id, 'Task manager does not support statistics');
                return;
            }
            
            const statistics = (this.taskManager as any).getTaskStatistics();
            this.sendResponse(id, { taskStatistics: statistics });
        } catch (error: any) {
            this.sendError(id, error.message);
        }
    }

    private sendResponse(id: string, payload: any): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                id,
                type: 'response',
                payload
            }));
        }
    }

    private sendError(id: string, message: string): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                id,
                type: 'error',
                error: {
                    code: 'TASK_ERROR',
                    message
                }
            }));
        }
    }

    private broadcastTaskEvent(event: { type: string; task: Task }): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                id: `event-${Date.now()}`,
                type: 'event',
                method: 'taskUpdate',
                payload: event
            }));
        }
    }
}