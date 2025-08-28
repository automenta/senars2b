class PersonalPlannerApp {
    constructor() {
        this.ws = null;
        this.messageId = 1;
        this.pendingRequests = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.cacheDOMElements();
    }

    cacheDOMElements() {
        this.connectionStatus = document.getElementById('connection-status');
        this.notificationContainer = document.getElementById('notification-container');
        this.newTaskTitle = document.getElementById('new-task-title');
        this.newTaskDescription = document.getElementById('new-task-description');
        this.newTaskPriority = document.getElementById('new-task-priority');
        this.newTaskDueDate = document.getElementById('new-task-due-date');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskListContainer = document.getElementById('task-list-container');
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.loadTasks();
    }

    connectWebSocket() {
        const wsUrl = `ws://${window.location.hostname}:8080`;
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            this.showNotification('Connected to the planner service', 'success');
            this.loadTasks();
        };
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error);
                this.showNotification('Error parsing server response', 'error');
            }
        };
        this.ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
            this.updateConnectionStatus(false);
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                setTimeout(() => this.connectWebSocket(), delay);
            } else {
                this.showNotification('Could not connect to the server.', 'error');
            }
        };
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    updateConnectionStatus(isConnected) {
        if (isConnected) {
            this.connectionStatus.innerHTML = '<span class="status-indicator status-connected"></span> Connected';
        } else {
            this.connectionStatus.innerHTML = '<span class="status-indicator status-disconnected"></span> Disconnected';
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        this.notificationContainer.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    handleMessage(message) {
        if (message.type === 'response' && this.pendingRequests.has(message.id)) {
            const resolver = this.pendingRequests.get(message.id);
            resolver(message);
            this.pendingRequests.delete(message.id);
        } else if (message.type === 'event' && message.method === 'taskUpdate') {
            this.loadTasks();
        }
    }

    sendWebSocketMessage(target, method, payload) {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const messageId = `msg-${this.messageId++}`;
                const message = { id: messageId, type: 'request', target, method, payload };
                this.ws.send(JSON.stringify(message));

                const timer = setTimeout(() => {
                    this.pendingRequests.delete(messageId);
                    reject(new Error('Request timed out'));
                }, 5000);

                this.pendingRequests.set(messageId, (response) => {
                    clearTimeout(timer);
                    resolve(response.payload);
                });
            } else {
                reject(new Error('Not connected to server.'));
            }
        });
    }

    setupEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
    }

    async addTask() {
        const title = this.newTaskTitle.value.trim();
        if (!title) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }

        const taskData = {
            title,
            description: this.newTaskDescription.value.trim() || undefined,
            priority: parseFloat(this.newTaskPriority.value) || 0.5,
            dueDate: this.newTaskDueDate.value ? new Date(this.newTaskDueDate.value).getTime() : undefined,
        };

        try {
            await this.sendWebSocketMessage('tasks', 'addTask', taskData);
            this.showNotification('Task added successfully', 'success');
            this.newTaskTitle.value = '';
            this.newTaskDescription.value = '';
            this.newTaskPriority.value = '';
            this.newTaskDueDate.value = '';
            this.loadTasks();
        } catch (error) {
            this.showNotification(`Error adding task: ${error.message}`, 'error');
        }
    }

    async loadTasks() {
        try {
            const { tasks } = await this.sendWebSocketMessage('tasks', 'getAllTasks', {});
            this.displayTasks(tasks);
        } catch (error) {
            // It's fine if this fails on startup, we'll retry
            console.error('Error loading tasks:', error.message);
        }
    }

    displayTasks(tasks) {
        if (!tasks || tasks.length === 0) {
            this.taskListContainer.innerHTML = '<p>No tasks yet. Add a task to get started.</p>';
            return;
        }

        tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        this.taskListContainer.innerHTML = tasks.map(task => this.createTaskElement(task)).join('');

        this.taskListContainer.querySelectorAll('.task-actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.taskId;
                const action = e.target.dataset.action;
                this.handleTaskAction(taskId, action);
            });
        });
    }

    createTaskElement(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-header">
                    <span class="task-title">${task.title}</span>
                    <div class="task-actions">
                        <button data-action="complete">✅</button>
                        <button data-action="delete">❌</button>
                    </div>
                </div>
                ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                <div class="task-meta">
                    <span>Priority: ${task.priority || 'Normal'}</span>
                    <span>Due: ${dueDate}</span>
                </div>
            </div>
        `;
    }

    async handleTaskAction(taskId, action) {
        try {
            if (action === 'delete') {
                await this.sendWebSocketMessage('tasks', 'removeTask', { taskId });
                this.showNotification('Task removed', 'success');
            } else if (action === 'complete') {
                await this.sendWebSocketMessage('tasks', 'updateTaskStatus', { taskId, status: 'completed' });
                this.showNotification('Task marked as complete', 'success');
            }
            this.loadTasks();
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const app = new PersonalPlannerApp();
        app.init();
    });
}
