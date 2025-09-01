// Simple test to verify CRDT integration
import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';

// Create a shared document
const ydoc = new Y.Doc();

// Create a Y.Map to store tasks
const yTasks = ydoc.getMap('tasks');

// Connect to the WebSocket provider
const provider = new WebsocketProvider('ws://localhost:3000/yjs', 'tasks-room', ydoc);

// Listen for changes
yTasks.observe((event) => {
    console.log('Tasks updated:');
    yTasks.forEach((task, id) => {
        console.log(`- ${id}: ${task.title}`);
    });
});

// Add a test task
setTimeout(() => {
    yTasks.set('task-1', {
        id: 'task-1',
        title: 'Test Task from Client',
        description: 'This is a test task created via CRDT',
        status: 'pending',
        priority: 'medium'
    });
    console.log('Test task added');
}, 2000);

// Cleanup on exit
process.on('exit', () => {
    provider.destroy();
    ydoc.destroy();
});