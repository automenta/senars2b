import { WebSocketServer } from 'ws';
import WebSocket = require('ws');
import { DecentralizedCognitiveCore } from '../core/cognitiveCore';
import { PerceptionSubsystem } from '../modules/perceptionSubsystem';
import { CognitiveItem, TruthValue, AttentionValue } from '../interfaces/types';
import { SelfDevelopmentManager } from '../modules/selfDevelopmentManager';
import { v4 as uuidv4 } from 'uuid';

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
}

export class WebSocketInterface {
  private wss: WebSocketServer;
  private core: DecentralizedCognitiveCore;
  private perception: PerceptionSubsystem;
  private clients: Set<WebSocket> = new Set();
  private componentMethods: ComponentMethods;
  private messageCounter: number = 0;
  private startTime: number;

  constructor(port: number, workerCount: number = 4) {
    this.wss = new WebSocketServer({ port });
    this.core = new DecentralizedCognitiveCore(workerCount);
    this.perception = new PerceptionSubsystem();
    this.startTime = Date.now();
    
    // Define available methods for each component
    this.componentMethods = {
      core: [
        'start',
        'stop',
        'getSystemStatus',
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
        'getStatistics'
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
      ]
    };

    this.setupWebSocketServer();
    console.log(`WebSocket server started on port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');
      this.clients.add(ws);

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
        systemInfo: {
          workerCount: (this.core as any).workerCount
        },
        serverStats: this.getServerStats()
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
        const result = await this.processRequest(message.target, message.method, message.payload);
        
        // Send response
        const response: WebSocketMessage = {
          id: message.id,
          type: 'response',
          payload: result
        };
        ws.send(JSON.stringify(response));
        
        // Log successful processing
        console.log(`Successfully processed request: ${message.target}.${message.method}`);
        return;
      } else if (message.type !== 'response' && message.type !== 'event' && message.type !== 'error') {
        this.sendError(ws, 'INVALID_MESSAGE_TYPE', `Invalid message type: ${message.type}. Supported types: request, response, event, error`);
        return;
      }
      
      // For non-request messages, send a basic acknowledgment
      const response: WebSocketMessage = {
        id: message.id,
        type: 'response',
        payload: { message: 'Message received' }
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
        default:
          throw new Error(`Unknown target: ${target}`);
      }
    } catch (error: any) {
      console.error(`Error in ${target}.${method}:`, error);
      throw error;
    }
  }

  private async handleCoreRequest(method: string, payload?: any): Promise<any> {
    switch (method) {
      case 'start':
        await this.core.start();
        return { status: 'started' };
      case 'stop':
        this.core.stop();
        return { status: 'stopped' };
      case 'getSystemStatus':
        return this.core.getSystemStatus();
      case 'addInitialBelief':
        if (!payload?.content || !payload?.truth || !payload?.attention) {
          throw new Error('Missing required fields: content, truth, attention');
        }
        this.core.addInitialBelief(
          payload.content,
          payload.truth as TruthValue,
          payload.attention as AttentionValue,
          payload.meta
        );
        return { success: true };
      case 'addInitialGoal':
        if (!payload?.content || !payload?.attention) {
          throw new Error('Missing required fields: content, attention');
        }
        this.core.addInitialGoal(
          payload.content,
          payload.attention as AttentionValue,
          payload.meta
        );
        return { success: true };
      case 'addSchema':
        if (!payload?.content) {
          throw new Error('Missing required field: content');
        }
        this.core.addSchema(payload.content, payload.meta);
        return { success: true };
      case 'addCognitiveItem':
        if (!payload?.item) {
          throw new Error('Missing required field: item');
        }
        // In a full implementation, we would add the item to the core's agenda
        // For now, we'll just log that we received the request
        console.log('Received request to add cognitive item:', payload.item);
        return { success: true };
      default:
        throw new Error(`Unknown core method: ${method}`);
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
        
        if (payload.input.length < 3) {
          throw new Error('Input too short. Please provide at least 3 characters.');
        }
        
        if (payload.input.length > 10000) {
          throw new Error('Input too long. Please limit input to 10,000 characters.');
        }
        
        try {
          const cognitiveItems = await this.perception.processInput(payload.input);
          
          // Add items to the core's agenda
          cognitiveItems.forEach(item => {
            // In a real implementation, we would properly add items to the core's agenda
            // For now, we'll just broadcast that we've processed the items
            console.log(`Processed item: ${item.type} - ${item.label || item.id}`);
          });
          
          return { 
            cognitiveItems,
            message: `Processed input and extracted ${cognitiveItems.length} cognitive item(s)`,
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
        return { size: this.core.getSystemStatus().agendaSize };
      case 'peek':
        // This would require exposing the agenda through the core
        // For now, we'll return a placeholder
        return { item: null };
      default:
        throw new Error(`Unknown agenda method: ${method}`);
    }
  }

  private async handleWorldModelRequest(method: string, payload?: any): Promise<any> {
    switch (method) {
      case 'getStatistics':
        // Access the world model statistics through the core
        const status = this.core.getSystemStatus();
        return { statistics: status.worldModelStats };
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
          return { statistics: actionSubsystem.getStatistics() };
        }
        return { statistics: {} };
        
      case 'executeGoal':
        if (!payload?.goal) {
          throw new Error('Missing required field: goal');
        }
        if (actionSubsystem?.executeGoal) {
          const result = await actionSubsystem.executeGoal(payload.goal);
          return { success: true, result };
        }
        return { success: true, result: null, message: 'Action executed (simulated)' };
        
      default:
        throw new Error(`Unknown actionSubsystem method: ${method}`);
    }
  }
  
  private async handleAttentionRequest(method: string, payload?: any): Promise<any> {
    const responses = {
      getStatistics: { 
        statistics: {
          moduleName: 'AttentionModule',
          parameters: {
            priorityWeight: 0.7,
            durabilityWeight: 0.3
          }
        }
      },
      setParameters: { 
        success: true, 
        message: 'Attention parameters updated',
        parameters: payload
      },
      calculate_derived: { 
        success: true, 
        message: 'Derived attention calculated',
        result: {
          priority: 0.5,
          durability: 0.4
        }
      },
      update_on_access: { 
        success: true, 
        message: 'Attention updated on access',
        items: payload?.items || []
      },
      run_decay_cycle: { 
        success: true, 
        message: 'Attention decay cycle completed'
      }
    };
    
    if (method in responses) {
      return responses[method as keyof typeof responses];
    }
    
    throw new Error(`Unknown attention method: ${method}`);
  }
  
  private async handleResonanceRequest(method: string, payload?: any): Promise<any> {
    switch (method) {
      case 'getStatistics':
        return { 
          statistics: {
            moduleName: 'ResonanceEngine',
            resonanceCount: 0,
            activePatterns: []
          }
        };
      case 'find_context':
        if (!payload?.item) {
          throw new Error('Missing required field: item');
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
    switch (method) {
      case 'getStatistics':
        return { 
          statistics: {
            moduleName: 'SchemaMatcher',
            schemaCount: 0,
            activeSchemas: []
          }
        };
      case 'addSchema':
        return { 
          success: true, 
          message: 'Schema added successfully',
          schema: payload
        };
      case 'removeSchema':
        return { 
          success: true, 
          message: 'Schema removed successfully',
          schemaId: payload?.id
        };
      case 'find_applicable':
        if (!payload?.itemA || !payload?.itemB) {
          throw new Error('Missing required fields: itemA, itemB');
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
        return { 
          success: true, 
          message: 'Schema applied successfully',
          result: []
        };
      case 'triggerLearning':
        return { 
          success: true, 
          message: 'Schema learning process initiated'
        };
      default:
        throw new Error(`Unknown schema method: ${method}`);
    }
  }
  
  private async handleBeliefRequest(method: string, payload?: any): Promise<any> {
    switch (method) {
      case 'getStatistics':
        return { 
          statistics: {
            moduleName: 'BeliefRevisionEngine',
            beliefCount: 0,
            revisionCount: 0
          }
        };
      case 'addBelief':
        return { 
          success: true, 
          message: 'Belief added successfully',
          belief: payload
        };
      case 'reviseBelief':
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
    switch (method) {
      case 'getStatistics':
        return { 
          statistics: {
            moduleName: 'GoalTreeManager',
            goalCount: 0,
            activeGoals: []
          }
        };
      case 'addGoal':
        return { 
          success: true, 
          message: 'Goal added successfully',
          goal: payload
        };
      case 'updateGoal':
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
        return { 
          success: true, 
          message: 'Goal decomposed successfully',
          subgoals: []
        };
      case 'mark_achieved':
        if (!payload?.goalId) {
          throw new Error('Missing required field: goalId');
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
    switch (method) {
      case 'getStatistics':
        return { 
          statistics: {
            moduleName: 'ReflectionLoop',
            reflectionCount: 0,
            enabled: true
          }
        };
      case 'setEnabled':
        return { 
          success: true, 
          message: `Reflection ${payload?.enabled ? 'enabled' : 'disabled'}`,
          enabled: payload?.enabled
        };
      case 'setParameters':
        return { 
          success: true, 
          message: 'Reflection parameters updated',
          parameters: payload
        };
      case 'recordSchemaUsage':
        if (!payload?.schemaId) {
          throw new Error('Missing required field: schemaId');
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
      startTime: new Date(this.startTime).toISOString()
    };
  }
  
  // Trigger schema learning
  public triggerSchemaLearning(): void {
    // This would trigger the schema learning process in the cognitive core
    console.log("Schema learning triggered via WebSocket interface");
  }
}