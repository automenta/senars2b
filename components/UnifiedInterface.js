class UnifiedInterface {
    constructor() {
        this.ws = null;
        this.messageId = 1;
        this.pendingRequests = new Map();
        this.processedInputs = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.startTime = Date.now();
        this.currentView = 'dashboard';
        this.views = {};
        
        this.demoInputs = {
            medical: "A 45-year-old male presents with chest pain, shortness of breath, and diaphoresis that started 30 minutes ago. He has a history of hypertension and smoking. What is the most likely diagnosis and immediate treatment considering the uncertainty in symptom presentation?",
            scientific: "Design an experiment to test the hypothesis that increased CO2 levels lead to faster plant growth. Include control groups, variables, and measurement methods while accounting for environmental uncertainties.",
            business: "A tech startup is losing market share to competitors. Analyze their position and recommend strategies for growth in a competitive market with uncertain economic conditions.",
            cybersecurity: "Our network monitoring system detected unusual traffic patterns from an internal server to an external IP address at 3 AM. Analyze the potential threat and recommend actions considering the uncertainty of benign vs malicious activity.",
            environmental: "Local water quality tests show increased nitrogen levels in a river near agricultural areas. Assess the environmental impact and propose mitigation strategies with uncertainty quantification.",
            educational: "Create a personalized learning plan for a 12-year-old student who excels in mathematics but struggles with reading comprehension, accounting for learning uncertainties and adaptability."
        };

        this.cacheDOMElements();
        this.initializeComponents();
        this.setupEventListeners();
        this.connectWebSocket();
    }

    cacheDOMElements() {
        // Main containers
        this.mainContainer = document.querySelector('.main-container');
        this.sidebar = document.querySelector('.sidebar');
        this.contentArea = document.querySelector('.content-area');
        
        // Navigation
        this.navItems = document.querySelectorAll('.nav-item');
        this.viewContainers = document.querySelectorAll('.view-container');
        
        // Status elements
        this.connectionStatusEl = document.getElementById('connection-status');
        this.systemStatusEl = document.getElementById('system-status');
        this.notificationContainer = document.getElementById('notification-container');
        
        // Dashboard elements
        this.statsCards = document.querySelectorAll('.stat-card');
        this.agendaCountEl = document.getElementById('agenda-count');
        this.atomCountEl = document.getElementById('atom-count');
        this.itemCountEl = document.getElementById('item-count');
        this.processedCountEl = document.getElementById('processed-count');
        this.workerCountEl = document.getElementById('worker-count');
        this.uptimeEl = document.getElementById('uptime');
        this.systemLoadEl = document.getElementById('system-load');
        this.heapUsedEl = document.getElementById('heap-used');
        this.heapTotalEl = document.getElementById('heap-total');
        
        // Processing elements
        this.userInput = document.getElementById('user-input');
        this.processBtn = document.getElementById('process-btn');
        this.demoCards = document.querySelectorAll('.demo-card');
        this.resultsContainer = document.getElementById('results-container');
        
        // Task management
        this.newTaskTitle = document.getElementById('new-task-title');
        this.newTaskDescription = document.getElementById('new-task-description');
        this.newTaskPriority = document.getElementById('new-task-priority');
        this.newTaskDueDate = document.getElementById('new-task-due-date');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskListContainer = document.getElementById('task-list-container');
        
        // System configuration
        this.configSections = document.querySelectorAll('.config-section');
        this.updateButtons = document.querySelectorAll('.update-btn');
        
        // CLI elements
        this.cliOutput = document.getElementById('cli-output');
        this.cliInput = document.getElementById('cli-input');
        this.cliExecuteBtn = document.getElementById('cli-execute-btn');
    }

    initializeComponents() {
        // Initialize any components that need initialization
        this.setupViews();
    }

    setupViews() {
        // Set up view containers and their associated data
        this.views = {
            dashboard: {
                container: document.getElementById('dashboard-view'),
                title: 'System Dashboard',
                icon: '📊'
            },
            processing: {
                container: document.getElementById('processing-view'),
                title: 'Cognitive Processing',
                icon: '🧠'
            },
            tasks: {
                container: document.getElementById('tasks-view'),
                title: 'Task Management',
                icon: '📋'
            },
            configuration: {
                container: document.getElementById('configuration-view'),
                title: 'System Configuration',
                icon: '⚙️'
            },
            cli: {
                container: document.getElementById('cli-view'),
                title: 'Command Line Interface',
                icon: '🖥️'
            },
            community: {
                container: document.getElementById('community-view'),
                title: 'Community Simulator',
                icon: '👥'
            }
        };
    }

    connectWebSocket() {
        const wsUrl = `ws://${window.location.hostname}:8080`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            this.showNotification('Connected to Senars3 Cognitive System', 'success');
            this.requestSystemStatus();
            this.startPeriodicUpdates();
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
                this.showNotification(`Disconnected from cognitive system. Retrying in ${delay / 1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'error');
                setTimeout(() => this.connectWebSocket(), delay);
            } else {
                this.showNotification('Failed to reconnect after multiple attempts. Please refresh the page.', 'error');
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showNotification('Connection error: ' + (error.message || 'Unknown error'), 'error');
        };
    }

    updateConnectionStatus(connected) {
        if (this.connectionStatusEl) {
            if (connected) {
                this.connectionStatusEl.innerHTML = '<span class="status-indicator status-connected"></span> Connected';
            } else {
                this.connectionStatusEl.innerHTML = '<span class="status-indicator status-disconnected"></span> Disconnected';
            }
        }
    }

    showNotification(message, type = 'info') {
        if (!this.notificationContainer) return;
        
        const existingNotifications = this.notificationContainer.querySelectorAll(`.notification.${type}`);
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        this.notificationContainer.appendChild(notification);
        
        // Auto-remove after timeout
        const timeout = type === 'success' ? 3000 : type === 'error' ? 10000 : 5000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, timeout);
    }

    handleMessage(message) {
        console.log('Received message:', message);
        switch (message.type) {
            case 'event':
                this.handleEvent(message);
                break;
            case 'response':
                this.handleResponse(message);
                break;
            case 'error':
                this.handleError(message);
                break;
            case 'welcome':
                console.log('Welcome message:', message.payload);
                if (message.payload.systemInfo) {
                    this.workerCountEl.textContent = message.payload.systemInfo.workerCount || 0;
                }
                if (message.payload.serverStats) {
                    this.uptimeEl.textContent = message.payload.serverStats.uptime || '00:00:00';
                }
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    handleEvent(message) {
        switch (message.method) {
            case 'inputProcessed':
                this.displayResults(message.payload.input, message.payload.cognitiveItems);
                this.processedInputs++;
                this.processedCountEl.textContent = this.processedInputs;
                this.requestSystemStatus();
                break;
            case 'inputProcessingError':
                this.showNotification('Error processing input: ' + (message.payload.error || 'Unknown error'), 'error');
                this.resetUIState();
                this.resultsContainer.innerHTML = '<p class="error">Error processing input. Please try again.</p>';
                break;
            case 'taskUpdate':
                this.refreshTaskList();
                break;
            default:
                console.log('Unknown event:', message.method);
        }
    }

    handleResponse(message) {
        // Check if this response corresponds to a pending request
        if (this.pendingRequests.has(message.id)) {
            const resolver = this.pendingRequests.get(message.id);
            resolver(message);
            this.pendingRequests.delete(message.id);
            return;
        }

        if (message.payload && message.payload.statistics) {
            const stats = message.payload.statistics;
            this.agendaCountEl.textContent = stats.agendaSize || 0;
            this.atomCountEl.textContent = stats.atomCount || 0;
            this.itemCountEl.textContent = stats.itemCount || 0;
            
            if (stats.moduleName === 'SchemaMatcher' && stats.learning) {
                // Update schema learning stats if available
            }
        }
        
        // Handle system diagnostics
        if (message.payload && message.payload.system) {
            const system = message.payload.system;
            if (system.performance && system.performance.systemLoad !== undefined) {
                this.systemLoadEl.textContent = system.performance.systemLoad.toFixed(2);
            }
        }
        
        // Handle memory diagnostics
        if (message.payload && message.payload.memory) {
            const memory = message.payload.memory;
            this.heapUsedEl.textContent = (memory.heapUsed / (1024 * 1024)).toFixed(2) + ' MB';
            this.heapTotalEl.textContent = (memory.heapTotal / (1024 * 1024)).toFixed(2) + ' MB';
        }
        
        if (message.payload) {
            // Handle system status updates
            if (message.payload.systemInfo) {
                this.workerCountEl.textContent = message.payload.systemInfo.workerCount || 0;
            }
            if (message.payload.performance) {
                this.uptimeEl.textContent = message.payload.performance.uptime || '00:00:00';
                if (this.systemLoadEl) {
                    this.systemLoadEl.textContent = message.payload.performance.systemLoad !== undefined ? 
                        message.payload.performance.systemLoad.toFixed(2) : '0.00';
                }
            }
            // Handle memory information if available
            if (message.payload.memory) {
                if (this.heapUsedEl) {
                    const heapUsedMB = (message.payload.memory.heapUsed / (1024 * 1024)).toFixed(2);
                    this.heapUsedEl.textContent = `${heapUsedMB} MB`;
                }
                if (this.heapTotalEl) {
                    const heapTotalMB = (message.payload.memory.heapTotal / (1024 * 1024)).toFixed(2);
                    this.heapTotalEl.textContent = `${heapTotalMB} MB`;
                }
            }
            
            this.addToCliOutput(`Response: ${JSON.stringify(message.payload, null, 2)}`);
        }
    }

    handleError(message) {
        const errorMessage = message.error ? `${message.error.code}: ${message.error.message}` : 'Unknown error';
        this.showNotification(`Error: ${errorMessage}`, 'error');
        this.resetUIState();
        this.addToCliOutput(`Error: ${errorMessage}`, 'error');
        console.error('System error:', message);
    }

    resetUIState() {
        if (this.processBtn) {
            this.processBtn.disabled = false;
        }
        if (this.demoCards) {
            this.demoCards.forEach(card => card.style.pointerEvents = 'auto');
        }
    }

    sendWebSocketMessage(target, method, payload, customId = null) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageId = customId || `msg-${this.messageId++}`;
            const message = {
                id: messageId,
                type: 'request',
                target: target,
                method: method,
                payload: payload
            };
            this.addToCliOutput(`> ${target}.${method}(${JSON.stringify(payload)})`);
            this.ws.send(JSON.stringify(message));
            return true;
        } else {
            this.showNotification('Not connected to server. Please wait for reconnection or refresh the page.', 'error');
            return false;
        }
    }

    waitForResponse(messageId, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(messageId);
                reject(new Error(`Request timed out after ${timeout}ms`));
            }, timeout);

            this.pendingRequests.set(messageId, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
        });
    }

    requestSystemStatus() {
        this.sendWebSocketMessage('worldModel', 'getStatistics', {});
        this.sendWebSocketMessage('core', 'getSystemDiagnostics', {});
    }

    startPeriodicUpdates() {
        setInterval(() => {
            const uptime = Math.floor((Date.now() - this.startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            if (this.uptimeEl) {
                this.uptimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
        
        setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.requestSystemStatus();
            }
        }, 5000);
    }

    processInput(input) {
        if (!input || input.trim().length === 0) {
            this.showNotification('Please enter some text to process', 'warning');
            return false;
        }
        const trimmedInput = input.trim();
        if (trimmedInput.length < 3) {
            this.showNotification('Input too short. Please enter at least 3 characters.', 'warning');
            return false;
        }
        if (trimmedInput.length > 10000) {
            this.showNotification('Input too long. Please limit input to 10,000 characters.', 'warning');
            return false;
        }
        
        if (this.processBtn) {
            this.processBtn.disabled = true;
        }
        if (this.demoCards) {
            this.demoCards.forEach(card => card.style.pointerEvents = 'none');
        }
        
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Processing with Non-Axiomatic Logic Framework...</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">This may take a few moments</p>
                    <p style="font-size: 0.8em; margin-top: 5px; opacity: 0.8;">Input: "${trimmedInput}"</p>
                </div>
            `;
        }
        
        const success = this.sendWebSocketMessage('perception', 'processInput', {
            input: trimmedInput
        });
        
        if (!success) {
            this.resetUIState();
        }
        return success;
    }

    displayResults(input, results) {
        if (!this.resultsContainer) return;
        
        this.resultsContainer.innerHTML = '';
        if (!results || results.length === 0) {
            this.resultsContainer.innerHTML = '<p>No cognitive items were extracted from your input. Try rephrasing or providing more specific information through the non-axiomatic logic framework.</p>';
            this.resetUIState();
            return;
        }
        
        const inputHeader = document.createElement('div');
        inputHeader.innerHTML = `<h3>Input: "${input}"</h3>`;
        this.resultsContainer.appendChild(inputHeader);

        results.forEach(item => {
            const cognitiveItemComponent = new CognitiveItem(item, this);
            this.resultsContainer.appendChild(cognitiveItemComponent.element);
        });

        this.showNotification(`Processed input and extracted ${results.length} cognitive item(s) through non-axiomatic reasoning`, 'success');
        this.addToCliOutput(`Processed ${results.length} cognitive items:`);
        results.forEach((item, index) => {
            this.addToCliOutput(`  ${index + 1}. ${item.type}: ${item.label || 'No label'}`);
        });
        this.resetUIState();
    }

    addToCliOutput(text, type = 'output') {
        if (!this.cliOutput) return;
        
        const line = document.createElement('div');
        line.className = 'cli-line';
        if (type === 'error') {
            line.innerHTML = `<span class="cli-error">${text}</span>`;
        } else if (text.startsWith('>')) {
            const parts = text.match(/^>\s*(\w+)\.(\w+)\((.*)\)$/);
            if (parts) {
                line.innerHTML = `<span class="cli-prompt">senars3&gt;</span> <span class="cli-command">${parts[1]}.${parts[2]}(${parts[3]})</span>`;
            } else {
                line.innerHTML = `<span class="cli-prompt">senars3&gt;</span> <span class="cli-command">${text.substring(1)}</span>`;
            }
        } else {
            line.innerHTML = `<span class="cli-output-text">${text}</span>`;
        }
        this.cliOutput.appendChild(line);
        this.cliOutput.scrollTop = this.cliOutput.scrollHeight;
    }

    setupEventListeners() {
        // Navigation
        if (this.navItems) {
            this.navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const view = item.getAttribute('data-view');
                    this.switchView(view);
                });
            });
        }
        
        // Processing
        if (this.processBtn) {
            this.processBtn.addEventListener('click', () => {
                if (this.userInput) {
                    this.processInput(this.userInput.value.trim());
                }
            });
        }
        
        if (this.userInput) {
            this.userInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    this.processInput(this.userInput.value.trim());
                }
            });
        }
        
        if (this.demoCards) {
            this.demoCards.forEach(card => {
                card.addEventListener('click', () => {
                    const demoType = card.getAttribute('data-demo');
                    if (demoType && this.demoInputs[demoType]) {
                        if (this.userInput) {
                            this.userInput.value = this.demoInputs[demoType];
                        }
                        this.processInput(this.demoInputs[demoType]);
                    }
                });
            });
        }
        
        // Task management
        if (this.addTaskBtn) {
            this.addTaskBtn.addEventListener('click', () => this.addTask());
        }
        
        // CLI
        if (this.cliExecuteBtn) {
            this.cliExecuteBtn.addEventListener('click', () => this.executeCliCommand());
        }
        
        if (this.cliInput) {
            this.cliInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.executeCliCommand();
                }
            });
        }
        
        // Configuration updates
        if (this.updateButtons) {
            this.updateButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const section = e.target.getAttribute('data-section');
                    this.updateConfiguration(section);
                });
            });
        }
    }

    switchView(viewName) {
        // Update navigation
        if (this.navItems) {
            this.navItems.forEach(item => {
                if (item.getAttribute('data-view') === viewName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
        
        // Show/hide views
        Object.keys(this.views).forEach(viewKey => {
            const view = this.views[viewKey];
            if (viewKey === viewName) {
                if (view.container) {
                    view.container.classList.add('active');
                }
                // Update page title
                if (view.title) {
                    document.title = `Senars3 - ${view.title}`;
                }
            } else {
                if (view.container) {
                    view.container.classList.remove('active');
                }
            }
        });
        
        this.currentView = viewName;
        
        // Special handling for views that need data refresh
        if (viewName === 'dashboard') {
            this.requestSystemStatus();
        } else if (viewName === 'tasks') {
            this.refreshTaskList();
        } else if (viewName === 'community') {
            // Initialize the Community Simulator if not already done
            if (!this.communitySimulator) {
                this.communitySimulator = CommunitySimulator.initialize(this);
            }
        }
    }

    executeCliCommand() {
        if (!this.cliInput || !this.cliInput.value.trim()) return;
        
        const command = this.cliInput.value.trim();
        this.addToCliOutput(`> ${command}`, 'command');
        
        // Parse command (simplified for demo)
        const parts = command.split(' ');
        const target = parts[0] || 'core';
        const method = parts[1] || 'getStatus';
        let payload = {};
        
        try {
            if (parts[2]) {
                payload = JSON.parse(parts.slice(2).join(' '));
            }
        } catch (e) {
            this.addToCliOutput(`Error parsing payload: ${e.message}`, 'error');
            return;
        }
        
        this.sendWebSocketMessage(target, method, payload);
        this.cliInput.value = '';
    }

    updateConfiguration(section) {
        this.showNotification(`Configuration updated for ${section} (simulated)`, 'success');
    }

    // Task management methods
    async addTask() {
        const title = this.newTaskTitle.value.trim();
        if (!title) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }
        
        const description = this.newTaskDescription.value.trim();
        const priority = parseFloat(this.newTaskPriority.value) || 0.5;
        const dueDate = this.newTaskDueDate.value ? new Date(this.newTaskDueDate.value).getTime() : undefined;
        
        const taskData = {
            title,
            description: description || undefined,
            priority: Math.min(1, Math.max(0, priority)),
            dueDate,
            dependencies: [],
            subtasks: []
        };
        
        try {
            const success = this.sendWebSocketMessage('tasks', 'addTask', taskData);
            if (success) {
                this.showNotification('Task added successfully', 'success');
                this.newTaskTitle.value = '';
                this.newTaskDescription.value = '';
                this.newTaskPriority.value = '';
                this.newTaskDueDate.value = '';
                setTimeout(() => this.refreshTaskList(), 500);
            }
        } catch (error) {
            this.showNotification('Error adding task: ' + error.message, 'error');
        }
    }
    
    async refreshTaskList() {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const messageId = `tasks-${Date.now()}`;
                this.sendWebSocketMessage('tasks', 'getAllTasks', {}, messageId);
                
                const response = await this.waitForResponse(messageId, 5000);
                if (response && response.payload && response.payload.tasks) {
                    this.displayTasks(response.payload.tasks);
                }
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            if (this.taskListContainer) {
                this.taskListContainer.innerHTML = '<p>Error loading tasks. Please try again.</p>';
            }
        }
    }
    
    displayTasks(tasks) {
        if (!this.taskListContainer) return;
        
        if (!tasks || tasks.length === 0) {
            this.taskListContainer.innerHTML = '<p>No tasks yet. Add a task to get started.</p>';
            return;
        }
        
        tasks.sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (b.status === 'completed' && a.status !== 'completed') return -1;
            if (a.status === 'failed' && b.status !== 'failed') return 1;
            if (b.status === 'failed' && a.status !== 'failed') return -1;
            return b.priority - a.priority;
        });
        
        let html = '<div class="task-list">';
        for (const task of tasks) {
            html += this.createTaskElement(task);
        }
        html += '</div>';
        
        this.taskListContainer.innerHTML = html;
        this.setupTaskEventListeners();
    }
    
    createTaskElement(task) {
        const statusIcon = this.getTaskStatusIcon(task.status);
        const priorityBar = this.createPriorityBar(task.priority);
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date';
        
        return `
            <div class="task-item ${task.status}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">
                        <span class="task-status-icon">${statusIcon}</span>
                        <span class="task-title-text">${this.escapeHtml(task.title)}</span>
                    </div>
                    <div class="task-actions">
                        ${task.status === 'pending' ? 
                            `<button class="btn btn-outline btn-small task-action" data-action="start">▶️ Start</button>` : ''}
                        ${task.status === 'in-progress' ? 
                            `<button class="btn btn-success btn-small task-action" data-action="complete">✅ Complete</button>
                             <button class="btn btn-outline btn-small task-action" data-action="fail">❌ Fail</button>` : ''}
                        <button class="btn btn-outline btn-small task-action" data-action="delete">🗑️ Delete</button>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    ${priorityBar}
                    <div class="task-due-date">📅 Due: ${dueDate}</div>
                </div>
            </div>
        `;
    }
    
    getTaskStatusIcon(status) {
        switch (status) {
            case 'pending': return '⏸️';
            case 'in-progress': return '🔄';
            case 'completed': return '✅';
            case 'failed': return '❌';
            default: return '❓';
        }
    }
    
    createPriorityBar(priority) {
        const percentage = (priority * 100).toFixed(0);
        const color = priority > 0.7 ? 'var(--danger)' : priority > 0.4 ? 'var(--warning)' : 'var(--success)';
        
        return `
            <div class="task-priority">
                <div class="priority-label">Priority: ${percentage}%</div>
                <div class="priority-bar">
                    <div class="priority-fill" style="width: ${percentage}%; background-color: ${color};"></div>
                </div>
            </div>
        `;
    }
    
    setupTaskEventListeners() {
        const actionButtons = this.taskListContainer.querySelectorAll('.task-action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = button.closest('.task-item').getAttribute('data-task-id');
                const action = button.getAttribute('data-action');
                this.handleTaskAction(taskId, action);
            });
        });
    }
    
    async handleTaskAction(taskId, action) {
        try {
            switch (action) {
                case 'start':
                    this.updateTaskStatus(taskId, 'in-progress');
                    break;
                case 'complete':
                    this.updateTaskStatus(taskId, 'completed');
                    break;
                case 'fail':
                    this.updateTaskStatus(taskId, 'failed');
                    break;
                case 'delete':
                    this.deleteTask(taskId);
                    break;
            }
        } catch (error) {
            this.showNotification(`Error performing action: ${error.message}`, 'error');
        }
    }
    
    async updateTaskStatus(taskId, status) {
        try {
            const success = this.sendWebSocketMessage('tasks', 'updateTaskStatus', {
                taskId,
                status
            });
            if (success) {
                this.showNotification(`Task status updated to ${status}`, 'success');
                setTimeout(() => this.refreshTaskList(), 500);
            }
        } catch (error) {
            this.showNotification(`Error updating task status: ${error.message}`, 'error');
        }
    }
    
    async deleteTask(taskId) {
        try {
            const success = this.sendWebSocketMessage('tasks', 'removeTask', {
                taskId
            });
            if (success) {
                this.showNotification('Task deleted successfully', 'success');
                setTimeout(() => this.refreshTaskList(), 500);
            }
        } catch (error) {
            this.showNotification(`Error deleting task: ${error.message}`, 'error');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the unified interface when the page loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.unifiedInterface = new UnifiedInterface();
    });
}