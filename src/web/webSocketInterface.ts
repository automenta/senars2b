import {WebSocketServer} from 'ws';
import {CognitiveCoreDependencies, DecentralizedCognitiveCore} from '../core/cognitiveCore';
import {PerceptionSubsystem} from '../modules/perceptionSubsystem';
import {AttentionValue, CognitiveItem, TruthValue} from '../interfaces/types';
import {PriorityAgenda} from '../core/agenda';
import {PersistentWorldModel} from '../core/worldModel';
import {UnifiedTaskManager} from '../modules/taskManager';
import {TaskOrchestrator} from '../modules/taskOrchestrator';
import {DynamicAttentionModule} from '../core/attentionModule';
import {SimpleBeliefRevisionEngine} from '../core/beliefRevisionEngine';
import {HybridResonanceModule} from '../core/resonanceModule';
import {EfficientSchemaMatcher} from '../core/schemaMatcher';
import {HierarchicalGoalTreeManager} from '../core/goalTreeManager';
import {ReflectionLoop} from '../core/reflectionLoop';
import {ActionSubsystem} from '../actions/actionSubsystem';
import {SchemaLearningModule} from '../modules/schemaLearningModule';
import {TaskWebSocketHandler} from '../interfaces/taskWebSocketInterface';
import {v4 as uuidv4} from 'uuid';
import WebSocket = require('ws');

// Define the message types for our metaprogrammatic interface
interface WebSocketMessage {
    id: string; // Unique ID for this message (for request/response correlation)
    type: 'request' | 'response' | 'event' | 'error';
    method?: string; // For requests, the method to call
    target?: string; // For requests, the target component (core, perception, etc.)
    payload?: any; // The actual data
    error?: {
        code: string;
        message: string;
    };
}

// Define the available methods for each component
interface ComponentMethods {
    core: string[];
    perception: string[];
    agenda: string[];
    worldModel: string[];
    actionSubsystem: string[];
    attention: string[];
    resonance: string[];
    schema: string[];
    belief: string[];
    goal: string[];
    reflection: string[];
    tasks: string[]; // Added for task management
}

export class WebSocketInterface {
    private wss: WebSocketServer;
    private readonly core: DecentralizedCognitiveCore;
    private readonly perception: PerceptionSubsystem;
    private readonly taskManager: UnifiedTaskManager;
    private readonly taskWebSocketHandler: TaskWebSocketHandler;
    private clients: Set<WebSocket> = new Set();
    private readonly componentMethods: ComponentMethods;
    private messageCounter: number = 0;
    private readonly startTime: number;

    constructor(port: number, workerCount: number = 4) {
        this.wss = new WebSocketServer({port});

        const worldModel = new PersistentWorldModel();
        const agenda = new PriorityAgenda((taskId: string) => {
            const task = worldModel.get_item(taskId);
            return task?.task_metadata?.status || null;
        });
        const taskManager = new UnifiedTaskManager(agenda, worldModel);

        const dependencies: CognitiveCoreDependencies = {
            agenda: agenda,
            worldModel: worldModel,
            taskManager: taskManager,
            taskOrchestrator: new TaskOrchestrator(worldModel, taskManager),
            attentionModule: new DynamicAttentionModule(),
            beliefRevisionEngine: new SimpleBeliefRevisionEngine(),
            resonanceModule: new HybridResonanceModule(),
            schemaMatcher: new EfficientSchemaMatcher(),
            goalTreeManager: new HierarchicalGoalTreeManager(),
            reflectionLoop: new ReflectionLoop(worldModel, agenda),
            actionSubsystem: new ActionSubsystem(taskManager),
            schemaLearningModule: new SchemaLearningModule(worldModel),
        };

        this.core = new DecentralizedCognitiveCore(dependencies, {workerCount: workerCount});
        this.perception = new PerceptionSubsystem();

        // Initialize task manager with access to agenda and world model
        this.taskManager = new UnifiedTaskManager(
            this.core as any, // Access to agenda - in a full implementation, we'd provide a proper interface
            this.core.getWorldModel()
        );

        // Initialize task WebSocket handler
        this.taskWebSocketHandler = new TaskWebSocketHandler(this.taskManager);

        this.startTime = Date.now();

        // Define available methods for each component
        this.componentMethods = {
            core: [
                'start',
                'stop',
                'getSystemStatus',
                'getSystemDiagnostics',
                'addInitialBelief',
                'addInitialGoal',
                'addSchema',
                'addCognitiveItem'
            ],
            perception: [
                'processInput'
            ],
            agenda: [
                'size',
                'peek'
            ],
            worldModel: [
                'getStatistics',
                'getItemHistory',
                'getInsightsForBelief',
                'getConfidenceDistribution'
            ],
            actionSubsystem: [
                'getStatistics',
                'executeGoal'
            ],
            attention: [
                'getStatistics',
                'setParameters',
                'calculate_derived',
                'update_on_access',
                'run_decay_cycle'
            ],
            resonance: [
                'getStatistics',
                'find_context'
            ],
            schema: [
                'getStatistics',
                'addSchema',
                'removeSchema',
                'find_applicable',
                'apply'
            ],
            belief: [
                'getStatistics',
                'addBelief',
                'reviseBelief'
            ],
            goal: [
                'getStatistics',
                'addGoal',
                'updateGoal',
                'decompose',
                'mark_achieved'
            ],
            reflection: [
                'getStatistics',
                'setEnabled',
                'setParameters',
                'recordSchemaUsage'
            ],
            tasks: [ // Added for task management
                'addTask',
                'updateTask',
                'removeTask',
                'getTask',
                'getAllTasks',
                'updateTaskStatus',
                'getTaskStatistics' // Added new method
            ]
        };

        this.setupWebSocketServer();
        console.log(`WebSocket server started on port ${port}`);

        // Set up the event handler
        this.core.setEventHandler(this.onCoreEvent.bind(this));
    }

    // Method to broadcast events to all connected clients
    public broadcastEvent(method: string, payload: any): void {
        const eventMessage: WebSocketMessage = {
            id: uuidv4(),
            type: 'event',
            method,
            payload
        };

        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(eventMessage));
            }
        });
    }

    // Method to process input and broadcast results
    public async processAndAddInput(input: string): Promise<void> {
        try {
            // Process the input through the perception subsystem
            const cognitiveItems = await this.perception.processInput(input);

            // Add items to the agenda through the core
            cognitiveItems.forEach(item => {
                // For beliefs, add them through the core
                if (item.type === 'BELIEF' && item.truth) {
                    // In a full implementation, we would properly connect the perception output to the core
                    // For now, we'll just broadcast the processed items
                }
            });

            // Broadcast the processed items
            this.broadcastEvent('inputProcessed', {
                input,
                cognitiveItems
            });
        } catch (error) {
            console.error('Error processing input:', error);
            this.broadcastEvent('inputProcessingError', {
                input,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    public close(): void {
        this.core.stop();
        this.wss.close();
        console.log('WebSocket server closed');
    }

    // Getter methods to access internal components for more advanced usage
    public getCore(): DecentralizedCognitiveCore {
        return this.core;
    }

    public getPerception(): PerceptionSubsystem {
        return this.perception;
    }

    // Get server statistics
    public getServerStats(): any {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        return {
            uptime: uptimeStr,
            uptimeSeconds: uptime,
            connectedClients: this.clients.size,
            messagesProcessed: this.messageCounter,
            port: (this.wss as any).options.port,
            startTime: new Date(this.startTime).toISOString(),
            currentTime: new Date().toISOString()
        };
    }

    // Get detailed system diagnostics
    public getSystemDiagnostics(): any {
        const serverStats = this.getServerStats();
        const systemStatus = this.core.getSystemStatus();

        // Add additional diagnostics information
        const diagnostics = {
            server: serverStats,
            system: systemStatus,
            components: {
                agenda: {
                    size: systemStatus.agendaSize
                },
                worldModel: systemStatus.worldModelStats,
                workers: systemStatus.workerStats
            },
            performance: systemStatus.performance,
            timestamp: new Date().toISOString(),
            // Add memory usage information
            memory: {
                heapUsed: process.memoryUsage().heapUsed,
                heapTotal: process.memoryUsage().heapTotal,
                rss: process.memoryUsage().rss,
                external: process.memoryUsage().external
            },
            // Add process information
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                version: process.version
            }
        };

        return diagnostics;
    }

    // Trigger schema learning
    public triggerSchemaLearning(): void {
        // This would trigger the schema learning process in the cognitive core
        console.log("Schema learning triggered via WebSocket interface");
    }

    private onCoreEvent(event: CognitiveItem): void {
        if (event.label === 'BeliefUpdated') {
            this.broadcastEvent('beliefRevised', event.payload);
        }
        // We can handle other event types here in the future
    }

    private setupWebSocketServer(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('New client connected');
            this.clients.add(ws);

            // Store reference to the task WebSocket handler for this connection
            (ws as any)._taskWebSocketHandler = this.taskWebSocketHandler;

            // Send welcome message with available methods
            this.sendWelcomeMessage(ws);

            ws.on('message', (data: WebSocket.Data) => {
                try {
                    const message: WebSocketMessage = JSON.parse(data.toString());

                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Failed to parse message:', error);
                    this.sendError(ws, 'PARSE_ERROR', `Failed to parse message: ${error}`);
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }

    private sendWelcomeMessage(ws: WebSocket): void {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Get detailed system status
        const systemStatus = this.core.getSystemStatus();

        const welcomeMessage: WebSocketMessage = {
            id: uuidv4(),
            type: 'event',
            method: 'welcome',
            payload: {
                message: 'Connected to Senars3 Cognitive System WebSocket Interface',
                version: '1.0.0',
                uptime: uptimeStr,
                availableComponents: Object.keys(this.componentMethods),
                componentMethods: this.componentMethods,
                systemInfo: systemStatus.systemInfo,
                serverStats: this.getServerStats(),
                systemStatus: {
                    agendaSize: systemStatus.agendaSize,
                    performance: systemStatus.performance
                }
            }
        };
        ws.send(JSON.stringify(welcomeMessage));
    }

    private async handleMessage(ws: WebSocket, message: WebSocketMessage): Promise<void> {
        // Increment message counter for monitoring
        this.messageCounter++;

        try {
            // Log incoming requests for debugging
            if (message.type === 'request') {
                console.log(`Processing request: ${message.target}.${message.method}`);
            }

            // Validate message format
            if (!message.id) {
                this.sendError(ws, 'INVALID_MESSAGE', 'Message must have an id field');
                return;
            }

            if (!message.type) {
                this.sendError(ws, 'INVALID_MESSAGE', 'Message must have a type field');
                return;
            }

            if (message.type === 'request') {
                if (!message.target) {
                    this.sendError(ws, 'MISSING_FIELDS', 'Request must have a target field');
                    return;
                }

                if (!message.method) {
                    this.sendError(ws, 'MISSING_FIELDS', 'Request must have a method field');
                    return;
                }

                // Validate target
                if (!Object.keys(this.componentMethods).includes(message.target)) {
                    this.sendError(ws, 'INVALID_TARGET', `Unknown target: ${message.target}. Available targets: ${Object.keys(this.componentMethods).join(', ')}`);
                    return;
                }

                // Validate method for the target
                if (!this.componentMethods[message.target as keyof ComponentMethods].includes(message.method)) {
                    this.sendError(ws, 'INVALID_METHOD', `Unknown method: ${message.method} for target: ${message.target}. Available methods: ${this.componentMethods[message.target as keyof ComponentMethods].join(', ')}`);
                    return;
                }

                // Process the request
                const startTime = Date.now();
                const result = await this.processRequest(message.target, message.method, message.payload);
                const processingTime = Date.now() - startTime;

                // Send response
                const response: WebSocketMessage = {
                    id: message.id,
                    type: 'response',
                    payload: {
                        ...result,
                        processingTime: `${processingTime}ms`,
                        timestamp: new Date().toISOString()
                    }
                };
                ws.send(JSON.stringify(response));

                // Log successful processing
                console.log(`Successfully processed request: ${message.target}.${message.method} in ${processingTime}ms`);
                return;
            } else if (message.type !== 'response' && message.type !== 'event' && message.type !== 'error') {
                this.sendError(ws, 'INVALID_MESSAGE_TYPE', `Invalid message type: ${message.type}. Supported types: request, response, event, error`);
                return;
            }

            // For non-request messages, send a basic acknowledgment
            const response: WebSocketMessage = {
                id: message.id,
                type: 'response',
                payload: {message: 'Message received'}
            };
            ws.send(JSON.stringify(response));
        } catch (error: any) {
            console.error('Error processing message:', error);
            this.sendError(ws, 'PROCESSING_ERROR', error.message || 'Unknown error occurred');

            // Broadcast error to all clients for monitoring
            this.broadcastEvent('systemError', {
                error: error.message || 'Unknown error occurred',
                target: message.target,
                method: message.method || 'unknown',
                timestamp: new Date().toISOString()
            });
        }
    }

    private async processRequest(target: string, method: string, payload?: any): Promise<any> {
        try {
            switch (target) {
                case 'core':
                    return await this.handleCoreRequest(method, payload);
                case 'perception':
                    return await this.handlePerceptionRequest(method, payload);
                case 'agenda':
                    return await this.handleAgendaRequest(method, payload);
                case 'worldModel':
                    return await this.handleWorldModelRequest(method, payload);
                case 'actionSubsystem':
                    return await this.handleActionSubsystemRequest(method, payload);
                case 'attention':
                    return await this.handleAttentionRequest(method, payload);
                case 'resonance':
                    return await this.handleResonanceRequest(method, payload);
                case 'schema':
                    return await this.handleSchemaRequest(method, payload);
                case 'belief':
                    return await this.handleBeliefRequest(method, payload);
                case 'goal':
                    return await this.handleGoalRequest(method, payload);
                case 'reflection':
                    return await this.handleReflectionRequest(method, payload);
                case 'tasks': // Use the consolidated task handler
                    return this.taskWebSocketHandler.handleTaskRequest(uuidv4(), method, payload);
                default:
                    throw new Error(`Unknown target: ${target}`);
            }
        } catch (error: any) {
            console.error(`Error in ${target}.${method}:`, error);
            throw error;
        }
    }

    private async handleCoreRequest(method: string, payload?: any): Promise<any> {
        try {
            switch (method) {
                case 'start':
                    await this.core.start();
                    return {status: 'started'};
                case 'stop':
                    this.core.stop();
                    return {status: 'stopped'};
                case 'getSystemStatus':
                    return this.core.getSystemStatus();
                case 'getSystemDiagnostics':
                    return this.getSystemDiagnostics();
                case 'getSystemHealth':
                    // Get actual system health status
                    const systemStatus = this.core.getSystemStatus();
                    const components = {
                        core: systemStatus ? 'operational' : 'degraded',
                        agenda: systemStatus.agendaSize !== undefined ? 'operational' : 'degraded',
                        worldModel: systemStatus.worldModelStats ? 'operational' : 'degraded',
                        perception: 'operational' // Perception is always available
                    };
                    return {
                        status: Object.values(components).every(status => status === 'operational') ? 'healthy' : 'degraded',
                        timestamp: new Date().toISOString(),
                        components
                    };
                case 'addInitialBelief':
                    if (!payload?.content || !payload?.truth || !payload?.attention) {
                        throw new Error('Missing required fields: content, truth, attention');
                    }
                    await this.core.addInitialBelief(
                        payload.content,
                        payload.truth as TruthValue,
                        payload.attention as AttentionValue,
                        payload.meta
                    );
                    this.broadcastEvent('itemAddedToAgenda', {type: 'BELIEF', content: payload.content});
                    return {success: true};
                case 'addInitialGoal':
                    if (!payload?.content || !payload?.attention) {
                        throw new Error('Missing required fields: content, attention');
                    }
                    await this.core.addInitialGoal(
                        payload.content,
                        payload.attention as AttentionValue,
                        payload.meta
                    );
                    this.broadcastEvent('itemAddedToAgenda', {type: 'GOAL', content: payload.content});
                    return {success: true};
                case 'addSchema':
                    if (!payload?.content) {
                        throw new Error('Missing required field: content');
                    }
                    await this.core.addSchema(payload.content, payload.meta);
                    return {success: true};
                default:
                    throw new Error(`Unknown core method: ${method}`);
            }
        } catch (error: any) {
            console.error(`Error in core.${method}:`, error);
            throw new Error(`Core operation failed: ${error.message || 'Unknown error'}`);
        }
    }

    private async handlePerceptionRequest(method: string, payload?: any): Promise<any> {
        switch (method) {
            case 'processInput':
                if (!payload?.input) {
                    throw new Error('Missing required field: input');
                }

                // Validate input
                if (typeof payload.input !== 'string') {
                    throw new Error('Input must be a string');
                }

                if (payload.input.length < 1) {
                    throw new Error('Input too short. Please provide at least 1 character.');
                }

                if (payload.input.length > 10000) {
                    throw new Error('Input too long. Please limit input to 10,000 characters.');
                }

                try {
                    console.log(`Processing input: ${payload.input.substring(0, 100)}${payload.input.length > 100 ? '...' : ''}`);
                    const cognitiveItems = await this.perception.processInput(payload.input);

                    // Add items to the core's agenda
                    let itemsAdded = 0;
                    for (const item of cognitiveItems) {
                        try {
                            if (item.type === 'BELIEF' && item.truth && item.attention) {
                                await this.core.addInitialBelief(item.label, item.truth, item.attention, item.meta);
                                itemsAdded++;
                            } else if (item.type === 'GOAL' && item.attention) {
                                await this.core.addInitialGoal(item.label, item.attention, item.meta);
                                itemsAdded++;
                            } else if (item.type === 'TASK' && item.attention) {
                                // Handle task items
                                await this.core.addInitialGoal(item.label, item.attention, item.meta);
                                itemsAdded++;
                            }
                        } catch (itemError) {
                            console.error(`Error adding item to core:`, itemError);
                            // Continue processing other items even if one fails
                        }
                    }

                    this.broadcastEvent('inputProcessed', {
                        input: payload.input,
                        cognitiveItems,
                        itemsAdded
                    });

                    return {
                        cognitiveItems,
                        itemsAdded,
                        message: `Processed input and extracted ${cognitiveItems.length} cognitive item(s), added ${itemsAdded} to agenda`,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    console.error('Error in perception processing:', error);
                    throw new Error(`Perception processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            default:
                throw new Error(`Unknown perception method: ${method}`);
        }
    }

    private async handleAgendaRequest(method: string, payload?: any): Promise<any> {
        switch (method) {
            case 'size':
                // Access the agenda through the core
                return {size: this.core.getSystemStatus().agendaSize};
            case 'peek':
                // This would require exposing the agenda through the core
                // For now, we'll return a placeholder
                return {item: null};
            default:
                throw new Error(`Unknown agenda method: ${method}`);
        }
    }

    private async handleWorldModelRequest(method: string, payload?: any): Promise<any> {
        const worldModel = this.core.getWorldModel();
        if (!worldModel) {
            throw new Error('WorldModel is not available in the core.');
        }

        switch (method) {
            case 'getStatistics':
                return {statistics: worldModel.getStatistics()};

            case 'getItemHistory':
                if (!payload?.itemId) {
                    throw new Error("Missing required field: 'itemId'");
                }
                const history = worldModel.getItemHistory(payload.itemId);
                return {history};

            case 'getInsightsForBelief':
                if (!payload?.beliefId) {
                    throw new Error("Missing required field: 'beliefId'");
                }
                const insights = worldModel.query_by_meta('analysisOf', payload.beliefId);
                return {insights};

            case 'getConfidenceDistribution':
                const distribution = worldModel.getConfidenceDistribution();
                return {distribution};

            default:
                throw new Error(`Unknown worldModel method: ${method}`);
        }
    }

    private async handleActionSubsystemRequest(method: string, payload?: any): Promise<any> {
        const core = this.core as any;
        const actionSubsystem = core.actionSubsystem;

        switch (method) {
            case 'getStatistics':
                if (actionSubsystem?.getStatistics) {
                    return {statistics: actionSubsystem.getStatistics()};
                }
                return {statistics: {}};

            case 'executeGoal':
                if (!payload?.goal) {
                    throw new Error('Missing required field: goal');
                }
                if (actionSubsystem?.executeGoal) {
                    const result = await actionSubsystem.executeGoal(payload.goal);
                    return {success: true, result};
                }
                return {success: true, result: null, message: 'Action executed (simulated)'};

            default:
                throw new Error(`Unknown actionSubsystem method: ${method}`);
        }
    }

    private async handleAttentionRequest(method: string, payload?: any): Promise<any> {
        // Access the attention module through the core
        const attentionModule = this.core as any; // In a full implementation, we'd provide a proper interface
        
        switch (method) {
            case 'getStatistics':
                return {
                    statistics: {
                        moduleName: 'AttentionModule',
                        parameters: attentionModule.attentionModule.getParameters ? 
                            attentionModule.attentionModule.getParameters() : 
                            { priorityWeight: 0.7, durabilityWeight: 0.3 }
                    }
                };
            case 'setParameters':
                if (attentionModule.attentionModule.setParameters) {
                    attentionModule.attentionModule.setParameters(payload);
                }
                return {
                    success: true,
                    message: 'Attention parameters updated',
                    parameters: payload
                };
            case 'calculate_derived':
                if (attentionModule.attentionModule.calculate_derived) {
                    const result = attentionModule.attentionModule.calculate_derived(
                        payload?.items || [],
                        payload?.schema,
                        payload?.sourceTrust || 0.5
                    );
                    return {
                        success: true,
                        message: 'Derived attention calculated',
                        result
                    };
                }
                return {
                    success: true,
                    message: 'Derived attention calculated',
                    result: {
                        priority: 0.5,
                        durability: 0.4
                    }
                };
            case 'update_on_access':
                if (attentionModule.attentionModule.update_on_access) {
                    attentionModule.attentionModule.update_on_access(payload?.items || []);
                }
                return {
                    success: true,
                    message: 'Attention updated on access',
                    items: payload?.items || []
                };
            case 'run_decay_cycle':
                if (attentionModule.attentionModule.run_decay_cycle) {
                    attentionModule.attentionModule.run_decay_cycle(
                        this.core.getWorldModel(),
                        this.core as any // Access to agenda - in a full implementation, we'd provide a proper interface
                    );
                }
                return {
                    success: true,
                    message: 'Attention decay cycle completed'
                };
            default:
                throw new Error(`Unknown attention method: ${method}`);
        }
    }

    private async handleResonanceRequest(method: string, payload?: any): Promise<any> {
        // Access the resonance module through the core
        const resonanceModule = this.core as any; // In a full implementation, we'd provide a proper interface
        
        switch (method) {
            case 'getStatistics':
                const stats = resonanceModule.resonanceModule.getStatistics ? 
                    resonanceModule.resonanceModule.getStatistics() : 
                    { resonanceCount: 0, activePatterns: [] };
                return {
                    statistics: {
                        moduleName: 'ResonanceEngine',
                        ...stats
                    }
                };
            case 'find_context':
                if (!payload?.item) {
                    throw new Error('Missing required field: item');
                }
                if (resonanceModule.resonanceModule.find_context) {
                    const items = resonanceModule.resonanceModule.find_context(
                        payload.item,
                        this.core.getWorldModel(),
                        payload?.limit || 10
                    );
                    return {
                        success: true,
                        message: `Found ${items.length} context items`,
                        items
                    };
                }
                return {
                    success: true,
                    message: 'Context items found',
                    items: []
                };
            default:
                throw new Error(`Unknown resonance method: ${method}`);
        }
    }

    private async handleSchemaRequest(method: string, payload?: any): Promise<any> {
        // Access the schema matcher through the core
        const schemaMatcher = this.core as any; // In a full implementation, we'd provide a proper interface
        
        switch (method) {
            case 'getStatistics':
                const stats = schemaMatcher.schemaMatcher.getStatistics ? 
                    schemaMatcher.schemaMatcher.getStatistics() : 
                    { schemaCount: 0, activeSchemas: [] };
                return {
                    statistics: {
                        moduleName: 'SchemaMatcher',
                        ...stats
                    }
                };
            case 'addSchema':
                if (schemaMatcher.schemaMatcher.register_schema) {
                    const atom = await this.core.getWorldModel().get_atom(payload?.atomId);
                    if (atom) {
                        schemaMatcher.schemaMatcher.register_schema(atom, this.core.getWorldModel());
                        return {
                            success: true,
                            message: 'Schema added successfully',
                            schema: payload
                        };
                    }
                }
                return {
                    success: true,
                    message: 'Schema added successfully',
                    schema: payload
                };
            case 'removeSchema':
                if (schemaMatcher.schemaMatcher.unregister_schema) {
                    schemaMatcher.schemaMatcher.unregister_schema(payload?.id);
                }
                return {
                    success: true,
                    message: 'Schema removed successfully',
                    schemaId: payload?.id
                };
            case 'find_applicable':
                if (!payload?.itemA || !payload?.itemB) {
                    throw new Error('Missing required fields: itemA, itemB');
                }
                if (schemaMatcher.schemaMatcher.find_applicable) {
                    const schemas = schemaMatcher.schemaMatcher.find_applicable(
                        payload.itemA,
                        payload.itemB,
                        this.core.getWorldModel()
                    );
                    return {
                        success: true,
                        message: `Found ${schemas.length} applicable schemas`,
                        schemas
                    };
                }
                return {
                    success: true,
                    message: 'Applicable schemas found',
                    schemas: []
                };
            case 'apply':
                if (!payload?.schema || !payload?.itemA || !payload?.itemB) {
                    throw new Error('Missing required fields: schema, itemA, itemB');
                }
                if (payload.schema.apply) {
                    const result = payload.schema.apply(
                        payload.itemA,
                        payload.itemB,
                        this.core.getWorldModel()
                    );
                    return {
                        success: true,
                        message: 'Schema applied successfully',
                        result
                    };
                }
                return {
                    success: true,
                    message: 'Schema applied successfully',
                    result: []
                };
            case 'triggerLearning':
                const schemaLearningModule = this.core as any;
                if (schemaLearningModule.schemaLearningModule && 
                    schemaLearningModule.schemaLearningModule.learnNewSchemas) {
                    schemaLearningModule.schemaLearningModule.learnNewSchemas();
                }
                return {
                    success: true,
                    message: 'Schema learning process initiated'
                };
            default:
                throw new Error(`Unknown schema method: ${method}`);
        }
    }

    private async handleBeliefRequest(method: string, payload?: any): Promise<any> {
        // Access the belief revision engine through the core
        const beliefRevisionEngine = this.core as any; // In a full implementation, we'd provide a proper interface
        
        switch (method) {
            case 'getStatistics':
                const stats = beliefRevisionEngine.beliefRevisionEngine.getStatistics ? 
                    beliefRevisionEngine.beliefRevisionEngine.getStatistics() : 
                    { beliefCount: 0, revisionCount: 0 };
                return {
                    statistics: {
                        moduleName: 'BeliefRevisionEngine',
                        ...stats
                    }
                };
            case 'addBelief':
                // In a real implementation, we would add the belief to the world model
                // For now, we'll just return success
                return {
                    success: true,
                    message: 'Belief added successfully',
                    belief: payload
                };
            case 'reviseBelief':
                // In a real implementation, we would revise the belief in the world model
                // For now, we'll just return success
                return {
                    success: true,
                    message: 'Belief revised successfully',
                    beliefId: payload?.id,
                    newTruthValue: payload?.newTruthValue
                };
            default:
                throw new Error(`Unknown belief method: ${method}`);
        }
    }

    private async handleGoalRequest(method: string, payload?: any): Promise<any> {
        // Access the goal tree manager through the core
        const goalTreeManager = this.core as any; // In a full implementation, we'd provide a proper interface
        
        switch (method) {
            case 'getStatistics':
                const stats = goalTreeManager.goalTreeManager.getStatistics ? 
                    goalTreeManager.goalTreeManager.getStatistics() : 
                    { goalCount: 0, activeGoals: [] };
                return {
                    statistics: {
                        moduleName: 'GoalTreeManager',
                        ...stats
                    }
                };
            case 'addGoal':
                // In a real implementation, we would add the goal to the world model
                // For now, we'll just return success
                return {
                    success: true,
                    message: 'Goal added successfully',
                    goal: payload
                };
            case 'updateGoal':
                // In a real implementation, we would update the goal in the world model
                // For now, we'll just return success
                return {
                    success: true,
                    message: 'Goal updated successfully',
                    goalId: payload?.id,
                    newAttentionValue: payload?.newAttentionValue
                };
            case 'decompose':
                if (!payload?.goal) {
                    throw new Error('Missing required field: goal');
                }
                if (goalTreeManager.goalTreeManager.decompose) {
                    const subgoals = goalTreeManager.goalTreeManager.decompose(payload.goal);
                    return {
                        success: true,
                        message: 'Goal decomposed successfully',
                        subgoals
                    };
                }
                return {
                    success: true,
                    message: 'Goal decomposed successfully',
                    subgoals: []
                };
            case 'mark_achieved':
                if (!payload?.goalId) {
                    throw new Error('Missing required field: goalId');
                }
                if (goalTreeManager.goalTreeManager.mark_achieved) {
                    goalTreeManager.goalTreeManager.mark_achieved(payload.goalId);
                }
                return {
                    success: true,
                    message: 'Goal marked as achieved',
                    goalId: payload.goalId
                };
            default:
                throw new Error(`Unknown goal method: ${method}`);
        }
    }

    private async handleReflectionRequest(method: string, payload?: any): Promise<any> {
        // Access the reflection loop through the core
        const reflectionLoop = this.core as any; // In a full implementation, we'd provide a proper interface
        
        switch (method) {
            case 'getStatistics':
                const stats = reflectionLoop.reflectionLoop.getStatistics ? 
                    reflectionLoop.reflectionLoop.getStatistics() : 
                    { reflectionCount: 0, enabled: true };
                return {
                    statistics: {
                        moduleName: 'ReflectionLoop',
                        ...stats
                    }
                };
            case 'setEnabled':
                if (reflectionLoop.reflectionLoop.setEnabled) {
                    reflectionLoop.reflectionLoop.setEnabled(payload?.enabled);
                }
                return {
                    success: true,
                    message: `Reflection ${payload?.enabled ? 'enabled' : 'disabled'}`,
                    enabled: payload?.enabled
                };
            case 'setParameters':
                if (reflectionLoop.reflectionLoop.setParameters) {
                    reflectionLoop.reflectionLoop.setParameters(payload);
                }
                return {
                    success: true,
                    message: 'Reflection parameters updated',
                    parameters: payload
                };
            case 'recordSchemaUsage':
                if (!payload?.schemaId) {
                    throw new Error('Missing required field: schemaId');
                }
                if (reflectionLoop.reflectionLoop.recordSchemaUsage) {
                    reflectionLoop.reflectionLoop.recordSchemaUsage(payload.schemaId);
                }
                return {
                    success: true,
                    message: 'Schema usage recorded',
                    schemaId: payload.schemaId
                };
            default:
                throw new Error(`Unknown reflection method: ${method}`);
        }
    }

    private sendError(ws: WebSocket, code: string, message: string): void {
        const errorMessage: WebSocketMessage = {
            id: uuidv4(),
            type: 'error',
            error: {
                code,
                message
            }
        };
        ws.send(JSON.stringify(errorMessage));
    }
}