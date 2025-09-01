import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import path from 'path';
import {PersistentWorldModel} from '../core/worldModel';
import {UnifiedPriorityAgenda} from '../core/UnifiedPriorityAgenda';
import {UnifiedTaskManager} from '../modules/taskManager';
import {AttentionValue, CognitiveItem} from '../interfaces/types';
import {config} from '../config';
import logger from '../services/logger';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';

const {setupWSConnection} = require('y-websocket/bin/utils');

// --- Backend Core Initialization ---
const worldModel = new PersistentWorldModel();
const agenda = new UnifiedPriorityAgenda((taskId: string) => worldModel.get_item(taskId)?.task_metadata?.status || null);
const taskManager = new UnifiedTaskManager(agenda, worldModel);

const defaultAttention: AttentionValue = {priority: 0.5, durability: 0.5};

// Add some initial tasks for demonstration
const parentTask = taskManager.addTask({
    label: 'First Task: Review the new UI design',
    attention: defaultAttention,
    task_metadata: {status: 'pending', priority_level: 'medium'}
});

taskManager.addSubtask(parentTask.id, {
    label: 'Subtask: Implement the WebSocket connection',
    attention: defaultAttention,
    task_metadata: {status: 'pending', priority_level: 'low'}
});

taskManager.addTask({
    label: 'Agent Task: Monitor for new user feedback',
    attention: defaultAttention,
    task_metadata: {status: 'pending', priority_level: 'medium', categories: ['AGENT']}
});


// --- WebSocket Server Setup ---
function setupWebSocketServer(server: http.Server, wss: WebSocket.Server, yjsWss: WebSocket.Server) {
    const mapTaskToClient = (task: CognitiveItem) => ({
        id: task.id,
        title: task.label,
        description: task.content,
        status: task.task_metadata?.status || 'pending',
        type: task.task_metadata?.categories?.includes('AGENT') ? 'AGENT' : 'REGULAR',
        priority: task.task_metadata?.priority_level || 'medium',
        completion_percentage: task.task_metadata?.completion_percentage || 0,
        parent_id: task.task_metadata?.parent_id,
        subtasks: task.task_metadata?.subtasks || [],
    });

    const broadcastTaskList = () => {
        const tasks = taskManager.getAllTasks();
        const taskListUpdate = {
            type: 'TASK_LIST_UPDATE',
            payload: {tasks: tasks.map(mapTaskToClient)}
        };
        const message = JSON.stringify(taskListUpdate);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    };

    // Listen for backend task changes and broadcast them
    taskManager.addEventListener((event) => {
        logger.info(`Task event received: ${event.type}. Broadcasting update.`);
        broadcastTaskList();
    });

    const broadcastStats = () => {
        const stats = taskManager.getTaskStatistics();
        const statsUpdate = {
            type: 'STATS_UPDATE',
            payload: {stats}
        };
        const message = JSON.stringify(statsUpdate);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    };

    // Also broadcast stats periodically
    setInterval(broadcastStats, 5000);

    // Handle regular WebSocket connections (existing functionality)
    wss.on('connection', (ws: WebSocket) => {
        logger.info('New WebSocket connection established');

        // Send the current task list to the newly connected client
        broadcastTaskList();

        ws.on('message', (data: WebSocket.Data) => {
            try {
                const message = JSON.parse(data.toString());
                const {type, payload} = message;

                logger.info({messageType: type, payload}, `Received message of type: ${type}`);

                switch (type) {
                    case 'ADD_TASK':
                        taskManager.addTask({
                            label: payload.title,
                            content: payload.description,
                            attention: defaultAttention,
                            task_metadata: {
                                status: 'pending',
                                priority_level: payload.priority_level || 'medium',
                                categories: payload.type === 'AGENT' ? ['AGENT'] : []
                            }
                        });
                        break;
                    case 'COMPLETE_TASK':
                        taskManager.completeTask(payload.id);
                        break;
                    case 'PAUSE_AGENT':
                        taskManager.updateTaskStatus(payload.id, 'deferred');
                        break;
                    case 'RESUME_AGENT':
                        taskManager.updateTaskStatus(payload.id, 'pending');
                        break;
                    case 'FAIL_TASK':
                        taskManager.failTask(payload.id);
                        break;
                    case 'REORDER_TASKS':
                        taskManager.reorderTasks(payload.orderedTaskIds);
                        break;
                    default:
                        logger.warn(`Unknown message type: ${type}`);
                }
            } catch (error) {
                logger.error({error}, 'Failed to process message:');
            }
        });

        ws.on('close', () => {
            logger.info('WebSocket connection closed');
        });

        ws.on('error', (error: Error) => {
            logger.error({error}, 'WebSocket error:');
        });
    });

    // Handle Yjs WebSocket connections (new functionality)
    yjsWss.on('connection', (ws: WebSocket, req) => {
        logger.info('New Yjs WebSocket connection established');

        // Setup Yjs connection
        setupWSConnection(ws, req);
    });
}

// --- Express Server Setup ---
const app: express.Application = express();
const server: http.Server = http.createServer(app);

// Create Vite server in middleware mode - ONLY for development
createServer({
    root: path.join(__dirname, 'frontend'),
    server: {
        middlewareMode: true,
    },
    plugins: [react()],
}).then((vite) => {
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // Continue with WebSocket setup
    const wss: WebSocket.Server = new WebSocket.Server({noServer: true});
    const yjsWss: WebSocket.Server = new WebSocket.Server({noServer: true});

    setupWebSocketServer(server, wss, yjsWss);

    // Handle upgrade requests - regular WebSocket or Yjs WebSocket
    server.on('upgrade', (request, socket, head) => {
        const {pathname} = new URL(request.url!, `http://${request.headers.host}`);

        if (pathname === '/ws') {
            // Regular WebSocket connection
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else if (pathname === '/yjs') {
            // Yjs WebSocket connection
            yjsWss.handleUpgrade(request, socket, head, (ws) => {
                yjsWss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // Start server
    server.listen(config.PORT, () => {
        logger.info(`Senars3 Unified Server running on http://localhost:${config.PORT}`);
    });
});