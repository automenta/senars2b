import { WebSocketInterface } from './webSocketInterface';
import { RestApiInterface } from './restApiInterface';

/**
 * Unified Interface that combines both WebSocket and REST API interfaces
 * This provides a single entry point for all client interactions
 */
export class UnifiedInterface {
  private wsInterface: WebSocketInterface;
  private restInterface: RestApiInterface;
  private wsPort: number;
  private restPort: number;

  constructor(wsPort: number = 8080, restPort: number = 3000, workerCount: number = 4) {
    this.wsPort = wsPort;
    this.restPort = restPort;
    
    // Create the WebSocket interface
    this.wsInterface = new WebSocketInterface(wsPort, workerCount);
    
    // Create the REST API interface using the same WebSocket interface
    this.restInterface = new RestApiInterface(this.wsInterface, restPort);
  }

  /**
   * Start both interfaces
   */
  public start(): void {
    // Start the WebSocket server
    console.log(`WebSocket interface started on port ${this.wsPort}`);
    
    // Start the REST API server
    this.restInterface.start();
    
    console.log(`Unified interface started with:`);
    console.log(`  - WebSocket server: ws://localhost:${this.wsPort}`);
    console.log(`  - REST API server: http://localhost:${this.restPort}`);
  }

  /**
   * Stop both interfaces
   */
  public stop(): void {
    this.wsInterface.close();
    console.log('Unified interface stopped');
  }

  /**
   * Get the WebSocket interface for direct access
   */
  public getWebSocketInterface(): WebSocketInterface {
    return this.wsInterface;
  }

  /**
   * Get the REST API interface for direct access
   */
  public getRestInterface(): RestApiInterface {
    return this.restInterface;
  }

  /**
   * Process input through the perception subsystem
   * This method provides a programmatic way to process input
   * without needing to use either WebSocket or REST interfaces
   */
  public async processInput(input: string): Promise<any> {
    try {
      const perception = this.wsInterface.getPerception();
      const cognitiveItems = await perception.processInput(input);
      
      return {
        input,
        cognitiveItems,
        message: `Processed input and extracted ${cognitiveItems.length} cognitive item(s)`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Perception processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get system status
   */
  public getSystemStatus(): any {
    const core = this.wsInterface.getCore();
    return core.getSystemStatus();
  }

  /**
   * Add a belief to the system
   */
  public addBelief(content: any, truth: any, attention: any, meta?: Record<string, any>): void {
    const core = this.wsInterface.getCore();
    core.addInitialBelief(content, truth, attention, meta);
  }

  /**
   * Add a goal to the system
   */
  public addGoal(content: any, attention: any, meta?: Record<string, any>): void {
    const core = this.wsInterface.getCore();
    core.addInitialGoal(content, attention, meta);
  }

  /**
   * Get server statistics
   */
  public getServerStats(): any {
    return this.wsInterface.getServerStats();
  }
}