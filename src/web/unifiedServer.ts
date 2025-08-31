import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import path from 'path';
import {PersistentWorldModel} from '../core/worldModel';
import {PriorityAgenda} from '../core/agenda';
import {UnifiedTaskManager} from '../modules/taskManager';
import {AttentionValue, CognitiveItem} from '../interfaces/types';
import {config} from '../config';
import logger from '../services/logger';

// --- Backend Core Initialization ---
const worldModel = new PersistentWorldModel();
const agenda = new PriorityAgenda((taskId) => worldModel.get_item(taskId)?.task_metadata?.status || null);
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


// --- Express Server Setup ---
const app: express.Application = express();
const server: http.Server = http.createServer(app);

// Serve static files from the React frontend build directory
const frontendPath = path.join(__dirname, 'frontend/dist/web/frontend');
app.use(express.static(frontendPath));

// Serve the main HTML file for all non-API routes
app.get('*', (req: express.Request, res: express.Response) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    }
});

// --- WebSocket Server Setup ---
const wss: WebSocket.Server = new WebSocket.Server({noServer: true});

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

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

// --- Server Start ---
server.listen(config.PORT, () => {
    logger.info(`Senars3 Unified Server running on http://localhost:${config.PORT}`);
});