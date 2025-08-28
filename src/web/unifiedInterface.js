class Senars3WebApp {
    constructor() {
        this.ws = null;
        this.messageId = 1;
        this.pendingRequests = new Map();
        this.processedInputs = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.startTime = Date.now();
        this.demoInputs = {
            medical: "A 45-year-old male presents with chest pain, shortness of breath, and diaphoresis that started 30 minutes ago. He has a history of hypertension and smoking. What is the most likely diagnosis and immediate treatment considering the uncertainty in symptom presentation?",
            scientific: "Design an experiment to test the hypothesis that increased CO2 levels lead to faster plant growth. Include control groups, variables, and measurement methods while accounting for environmental uncertainties.",
            business: "A tech startup is losing market share to competitors. Analyze their position and recommend strategies for growth in a competitive market with uncertain economic conditions.",
            cybersecurity: "Our network monitoring system detected unusual traffic patterns from an internal server to an external IP address at 3 AM. Analyze the potential threat and recommend actions considering the uncertainty of benign vs malicious activity.",
            environmental: "Local water quality tests show increased nitrogen levels in a river near agricultural areas. Assess the environmental impact and propose mitigation strategies with uncertainty quantification.",
            educational: "Create a personalized learning plan for a 12-year-old student who excels in mathematics but struggles with reading comprehension, accounting for learning uncertainties and adaptability."
        };

        this.cacheDOMElements();
        this.statusBar = new StatusBar(this.statusBarElement);
        this.tabManager = new TabManager(this.tabsElement, this);
        this.confidenceDistributionChart = null;
    }

    cacheDOMElements() {
        this.confidenceChartCanvas = document.getElementById('confidence-distribution-chart');
        this.notificationContainer = document.getElementById('notification-container');
        this.statusBarElement = document.querySelector('.status-bar');
        this.tabsElement = document.querySelector('.tabs');
        this.demoCards = document.querySelectorAll('.demo-card');
        this.demoOutput = document.getElementById('demo-output');
        this.userInput = document.getElementById('user-input');
        this.processBtn = document.getElementById('process-btn');
        this.customOutput = document.getElementById('custom-output');
        this.customResults = document.getElementById('custom-results');
        this.interfaceModeToggle = document.getElementById('interface-mode');
        this.cliOutput = document.getElementById('cli-output');
        this.agendaCountEl = document.getElementById('agenda-count');
        this.atomCountEl = document.getElementById('atom-count');
        this.itemCountEl = document.getElementById('item-count');
        this.processedCountEl = document.getElementById('processed-count');
        this.workerCountEl = document.getElementById('worker-count');
        this.uptimeEl = document.getElementById('uptime');
        this.componentSelect = document.getElementById('component-select');
        this.methodInput = document.getElementById('method-input');
        this.payloadInput = document.getElementById('payload-input');
        this.executeBtn = document.getElementById('execute-btn');
        this.commandResult = document.getElementById('command-result');
        this.workerCount = document.getElementById('worker-count');
        this.processingMode = document.getElementById('processing-mode');
        this.priorityWeight = document.getElementById('priority-weight');
        this.durabilityWeight = document.getElementById('durability-weight');
        this.frequencyThreshold = document.getElementById('frequency-threshold');
        this.confidenceThreshold = document.getElementById('confidence-threshold');
        this.updateCoreBtn = document.getElementById('update-core');
        this.updateAttentionBtn = document.getElementById('update-attention');
        this.updateTruthBtn = document.getElementById('update-truth');
        this.runAttentionDecayBtn = document.getElementById('run-attention-decay');
        this.resonanceThreshold = document.getElementById('resonance-threshold');
        this.contextSize = document.getElementById('context-size');
        this.updateResonanceBtn = document.getElementById('update-resonance');
        this.schemaThreshold = document.getElementById('schema-threshold');
        this.maxSchemas = document.getElementById('max-schemas');
        this.updateSchemaBtn = document.getElementById('update-schema');
        this.goalDepth = document.getElementById('goal-depth');
        this.subgoalCount = document.getElementById('subgoal-count');
        this.updateGoalBtn = document.getElementById('update-goal');
        this.learningThreshold = document.getElementById('learning-threshold');
        this.minApplications = document.getElementById('min-applications');
        this.updateLearningBtn = document.getElementById('update-learning');
        this.triggerLearningBtn = document.getElementById('trigger-learning');
        this.trackedSchemas = document.getElementById('tracked-schemas');
        this.totalApplications = document.getElementById('total-applications');
        this.successfulGeneralizations = document.getElementById('successful-generalizations');
        this.priorityWeightValue = document.getElementById('priority-weight-value');
        this.durabilityWeightValue = document.getElementById('durability-weight-value');
        this.frequencyThresholdValue = document.getElementById('frequency-threshold-value');
        this.confidenceThresholdValue = document.getElementById('confidence-threshold-value');
        this.resonanceThresholdValue = document.getElementById('resonance-threshold-value');
        this.schemaThresholdValue = document.getElementById('schema-threshold-value');
        this.learningThresholdValue = document.getElementById('learning-threshold-value');
        
        // Task management elements
        this.newTaskTitle = document.getElementById('new-task-title');
        this.newTaskDescription = document.getElementById('new-task-description');
        this.newTaskPriority = document.getElementById('new-task-priority');
        this.newTaskDueDate = document.getElementById('new-task-due-date');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.taskListContainer = document.getElementById('task-list-container');
        
        // System health elements
        this.systemLoadEl = document.getElementById('system-load');
        this.heapUsedEl = document.getElementById('heap-used');
        this.heapTotalEl = document.getElementById('heap-total');
        
        // System health elements
        this.systemLoadEl = document.getElementById('system-load');
        this.heapUsedEl = document.getElementById('heap-used');
        this.heapTotalEl = document.getElementById('heap-total');
    }

    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.userInput.value = "My cat seems sick after eating chocolate. What should I do considering the uncertainty in symptoms?";
        setTimeout(() => {
            this.addToCliOutput("System initialized with Non-Axiomatic Logic Framework");
            this.addToCliOutput("Ready for cognitive processing. Enter input to begin.");
        }, 1000);
        // Load initial tasks
        this.loadTasks();
    }

    connectWebSocket() {
        const wsUrl = `ws://${window.location.hostname}:8080`;
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
            console.log('Connected to WebSocket server');
            this.reconnectAttempts = 0;
            this.statusBar.updateConnectionStatus(true);
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
            this.statusBar.updateConnectionStatus(false);
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

    showNotification(message, type) {
        const existingNotifications = document.querySelectorAll(`.notification.${type}`);
        existingNotifications.forEach(notification => notification.remove());
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>${message}</span>
        `;
        this.notificationContainer.appendChild(notification);
        const timeout = type === 'success' ? 3000 : 10000;
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
                this.demoOutput.innerHTML = '<p class="error">Error processing input. Please try again.</p>';
                break;
            case 'taskUpdate':
                // Handle real-time task updates
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
            return; // Don't process as a generic response
        }

        if (message.payload && message.payload.statistics) {
            const stats = message.payload.statistics;
            this.agendaCountEl.textContent = stats.agendaSize || 0;
            this.atomCountEl.textContent = stats.atomCount || 0;
            this.itemCountEl.textContent = stats.itemCount || 0;
            this.statusBar.updateAgendaSize(stats.agendaSize || 0);
            if (stats.moduleName === 'SchemaMatcher' && stats.learning) {
                this.trackedSchemas.textContent = stats.learning.trackedSchemas || 0;
                this.totalApplications.textContent = stats.learning.totalApplications || 0;
                this.successfulGeneralizations.textContent = stats.learning.successfulGeneralizations || 0;
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
            // Convert bytes to MB
            this.heapUsedEl.textContent = (memory.heapUsed / (1024 * 1024)).toFixed(2) + ' MB';
            this.heapTotalEl.textContent = (memory.heapTotal / (1024 * 1024)).toFixed(2) + ' MB';
        }
        if (message.payload && message.payload.distribution) {
            this.updateConfidenceDistributionChart(message.payload.distribution);
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
            if (this.commandResult) {
                this.commandResult.style.display = 'block';
                this.commandResult.textContent = JSON.stringify(message.payload, null, 2);
            }
        }
    }

    handleError(message) {
        const errorMessage = message.error ? `${message.error.code}: ${message.error.message}` : 'Unknown error';
        this.showNotification(`Error: ${errorMessage}`, 'error');
        this.resetUIState();
        this.addToCliOutput(`Error: ${errorMessage}`, 'error');
        if (this.commandResult) {
            this.commandResult.style.display = 'block';
            this.commandResult.textContent = `Error: ${errorMessage}`;
            this.commandResult.style.color = 'var(--danger)';
        }
        console.error('System error:', message);
    }

    resetUIState() {
        this.processBtn.disabled = false;
        this.demoCards.forEach(card => card.style.pointerEvents = 'auto');
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
        // Request system diagnostics for enhanced monitoring
        this.sendWebSocketMessage('core', 'getSystemDiagnostics', {});
    }

    requestConfidenceDistribution() {
        this.sendWebSocketMessage('worldModel', 'getConfidenceDistribution', {});
    }

    updateConfidenceDistributionChart(distribution) {
        if (!this.confidenceChartCanvas) return;

        const data = {
            labels: distribution.bins,
            datasets: [{
                label: 'Belief Count',
                data: distribution.counts,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1
            }]
        };

        if (this.confidenceDistributionChart) {
            this.confidenceDistributionChart.data = data;
            this.confidenceDistributionChart.update();
        } else {
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false // The card already has a title
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Beliefs',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Confidence Bins',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            };
            this.confidenceDistributionChart = new Chart(this.confidenceChartCanvas.getContext('2d'), {
                type: 'bar',
                data: data,
                options: options
            });
        }
    }

    startPeriodicUpdates() {
        setInterval(() => {
            const uptime = Math.floor((Date.now() - this.startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            this.uptimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
        setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.requestSystemStatus();
                this.requestConfidenceDistribution();
                // Request task statistics
                this.sendWebSocketMessage('tasks', 'getTaskStatistics', {});
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
        this.processBtn.disabled = true;
        this.demoCards.forEach(card => card.style.pointerEvents = 'none');
        this.demoOutput.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Processing with Non-Axiomatic Logic Framework...</p>
                <p style="font-size: 0.9em; margin-top: 10px;">This may take a few moments</p>
                <p style="font-size: 0.8em; margin-top: 5px; opacity: 0.8;">Input: "${trimmedInput}"</p>
            </div>
        `;
        const success = this.sendWebSocketMessage('perception', 'processInput', {
            input: trimmedInput
        });
        if (!success) {
            this.resetUIState();
        }
        return success;
    }

    displayResults(input, results) {
        this.demoOutput.innerHTML = '';
        if (!results || results.length === 0) {
            this.demoOutput.innerHTML = '<p>No cognitive items were extracted from your input. Try rephrasing or providing more specific information through the non-axiomatic logic framework.</p>';
            this.resetUIState();
            return;
        }
        const inputHeader = document.createElement('div');
        inputHeader.innerHTML = `<h3>Input: "${input}"</h3>`;
        this.demoOutput.appendChild(inputHeader);

        results.forEach(item => {
            const cognitiveItemComponent = new CognitiveItem(item, this);
            this.demoOutput.appendChild(cognitiveItemComponent.element);
        });

        this.showNotification(`Processed input and extracted ${results.length} cognitive item(s) through non-axiomatic reasoning`, 'success');
        this.addToCliOutput(`Processed ${results.length} cognitive items:`);
        results.forEach((item, index) => {
            this.addToCliOutput(`  ${index + 1}. ${item.type}: ${item.label || 'No label'}`);
        });
        this.resetUIState();
    }

    addToCliOutput(text, type = 'output') {
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
        this.processBtn.addEventListener('click', () => this.processInput(this.userInput.value.trim()));
        this.userInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.processInput(this.userInput.value.trim());
            }
        });
        this.demoCards.forEach(card => {
            card.addEventListener('click', () => {
                const demoType = card.getAttribute('data-demo');
                const actionType = card.getAttribute('data-action');
                if (demoType) {
                    const input = this.demoInputs[demoType];
                    if (input) {
                        this.userInput.value = input;
                        this.processInput(input);
                    }
                } else if (actionType) {
                    this.handleActionCard(actionType);
                }
            });
        });
        this.interfaceModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('cli-mode');
                this.showNotification('Switched to CLI mode. Interface optimized for command-line experience.', 'info');
            } else {
                document.body.classList.remove('cli-mode');
                this.showNotification('Switched to GUI mode. Interface optimized for graphical experience.', 'info');
            }
        });
        this.executeBtn.addEventListener('click', () => {
            const target = this.componentSelect.value;
            const method = this.methodInput.value;
            let payload = {};
            try {
                if (this.payloadInput.value.trim()) {
                    payload = JSON.parse(this.payloadInput.value);
                }
            } catch (e) {
                this.showNotification('Invalid JSON in payload: ' + e.message, 'error');
                return;
            }
            this.sendWebSocketMessage(target, method, payload);
        });
        this.priorityWeight.addEventListener('input', (e) => {
            this.priorityWeightValue.textContent = e.target.value;
        });
        this.durabilityWeight.addEventListener('input', (e) => {
            this.durabilityWeightValue.textContent = e.target.value;
        });
        this.frequencyThreshold.addEventListener('input', (e) => {
            this.frequencyThresholdValue.textContent = e.target.value;
        });
        this.confidenceThreshold.addEventListener('input', (e) => {
            this.confidenceThresholdValue.textContent = e.target.value;
        });
        this.resonanceThreshold.addEventListener('input', (e) => {
            this.resonanceThresholdValue.textContent = e.target.value;
        });
        this.schemaThreshold.addEventListener('input', (e) => {
            this.schemaThresholdValue.textContent = e.target.value;
        });
        this.learningThreshold.addEventListener('input', (e) => {
            this.learningThresholdValue.textContent = e.target.value;
        });
        this.updateCoreBtn.addEventListener('click', () => this.showNotification('Core settings updated (simulated)', 'success'));
        this.updateAttentionBtn.addEventListener('click', () => {
            const settings = {
                priorityWeight: parseFloat(this.priorityWeight.value),
                durabilityWeight: parseFloat(this.durabilityWeight.value)
            };
            this.showNotification(`Attention settings updated: Priority=${settings.priorityWeight}, Durability=${settings.durabilityWeight}`, 'success');
        });
        this.updateTruthBtn.addEventListener('click', () => {
            const settings = {
                frequencyThreshold: parseFloat(this.frequencyThreshold.value),
                confidenceThreshold: parseFloat(this.confidenceThreshold.value)
            };
            this.showNotification(`Truth settings updated: Frequency=${settings.frequencyThreshold}, Confidence=${settings.confidenceThreshold}`, 'success');
        });
        this.runAttentionDecayBtn.addEventListener('click', () => this.showNotification('Attention decay cycle initiated (simulated)', 'success'));
        this.updateResonanceBtn.addEventListener('click', () => {
            const settings = {
                threshold: parseFloat(this.resonanceThreshold.value),
                contextSize: parseInt(this.contextSize.value)
            };
            this.showNotification(`Resonance settings updated: Threshold=${settings.threshold}, Context Size=${settings.contextSize}`, 'success');
        });
        this.updateSchemaBtn.addEventListener('click', () => {
            const settings = {
                threshold: parseFloat(this.schemaThreshold.value),
                maxSchemas: parseInt(this.maxSchemas.value)
            };
            this.showNotification(`Schema settings updated: Threshold=${settings.threshold}, Max Schemas=${settings.maxSchemas}`, 'success');
        });
        this.updateGoalBtn.addEventListener('click', () => {
            const settings = {
                maxDepth: parseInt(this.goalDepth.value),
                maxSubgoals: parseInt(this.subgoalCount.value)
            };
            this.showNotification(`Goal settings updated: Max Depth=${settings.maxDepth}, Max Subgoals=${settings.maxSubgoals}`, 'success');
        });
        this.updateLearningBtn.addEventListener('click', () => {
            const settings = {
                threshold: parseFloat(this.learningThreshold.value),
                minApps: parseInt(this.minApplications.value)
            };
            this.showNotification(`Learning settings updated: Threshold=${settings.threshold}, Min Applications=${settings.minApps}`, 'success');
        });
        this.triggerLearningBtn.addEventListener('click', () => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const message = {
                    id: 'msg-' + this.messageId++,
                    type: 'request',
                    target: 'schema',
                    method: 'triggerLearning',
                    payload: {}
                };
                this.addToCliOutput(`> schema.triggerLearning()`);
                this.ws.send(JSON.stringify(message));
                this.showNotification('Schema learning process initiated', 'success');
            } else {
                this.showNotification('Not connected to server. Please wait for reconnection or refresh the page.', 'error');
            }
        });
        
        // Task management event listeners
        if (this.addTaskBtn) {
            this.addTaskBtn.addEventListener('click', () => this.addTask());
        }
    }

    handleActionCard(actionType) {
        let component, method, payload;
        switch (actionType) {
            case 'adjust-attention':
                component = 'attention';
                method = 'getStatistics';
                payload = '{}';
                break;
            case 'adjust-truth':
                component = 'belief';
                method = 'getStatistics';
                payload = '{}';
                break;
            case 'schema-management':
                component = 'schema';
                method = 'getStatistics';
                payload = '{}';
                break;
            case 'reflection-config':
                component = 'reflection';
                method = 'getStatistics';
                payload = '{}';
                break;
            default:
                return;
        }

        this.componentSelect.value = component;
        this.methodInput.value = method;
        this.payloadInput.value = payload;
        document.querySelector('.tab[data-tab="metaprogramming"]').click();
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
                // Refresh task list
                setTimeout(() => this.refreshTaskList(), 500);
            }
        } catch (error) {
            this.showNotification('Error adding task: ' + error.message, 'error');
        }
    }
    
    async loadTasks() {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const messageId = `tasks-${Date.now()}`;
                this.sendWebSocketMessage('tasks', 'getAllTasks', {}, messageId);
                
                // Wait for response
                const response = await this.waitForResponse(messageId, 5000);
                if (response && response.payload && response.payload.tasks) {
                    this.displayTasks(response.payload.tasks);
                }
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.taskListContainer.innerHTML = '<p>Error loading tasks. Please try again.</p>';
        }
    }
    
    async refreshTaskList() {
        await this.loadTasks();
    }
    
    displayTasks(tasks) {
        if (!this.taskListContainer) return;
        
        if (!tasks || tasks.length === 0) {
            this.taskListContainer.innerHTML = '<p>No tasks yet. Add a task to get started.</p>';
            return;
        }
        
        // Sort tasks by priority (highest first) and status
        tasks.sort((a, b) => {
            // Completed tasks last
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (b.status === 'completed' && a.status !== 'completed') return -1;
            
            // Failed tasks next to last
            if (a.status === 'failed' && b.status !== 'failed') return 1;
            if (b.status === 'failed' && a.status !== 'failed') return -1;
            
            // Then by priority (highest first)
            return b.priority - a.priority;
        });
        
        let html = '<div class="task-list">';
        for (const task of tasks) {
            html += this.createTaskElement(task);
        }
        html += '</div>';
        
        this.taskListContainer.innerHTML = html;
        
        // Add event listeners to task elements
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
        // Add event listeners to task action buttons
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
                // Refresh task list
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
                // Refresh task list
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

if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const app = new Senars3WebApp();
        app.init();
    });
}
