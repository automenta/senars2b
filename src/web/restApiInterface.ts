import express from 'express';
import { WebSocketInterface } from './webSocketInterface';
import { CognitiveItem, TruthValue, AttentionValue } from '../interfaces/types';

/**
 * REST API Interface that wraps the WebSocket interface
 * Provides HTTP endpoints for interacting with the cognitive system
 */
export class RestApiInterface {
  private app: express.Application;
  private wsInterface: WebSocketInterface;
  private port: number;

  constructor(wsInterface: WebSocketInterface, port: number = 3000) {
    this.app = express();
    this.wsInterface = wsInterface;
    this.port = port;
    
    // Middleware
    this.app.use(express.json());
    
    // Setup routes
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API status endpoint
    this.app.get('/api/status', async (req, res) => {
      try {
        // Get system status through the WebSocket interface
        const core = this.wsInterface.getCore();
        const status = core.getSystemStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to get system status',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Process input endpoint
    this.app.post('/api/process', async (req, res) => {
      try {
        const { input } = req.body;
        
        if (!input) {
          return res.status(400).json({ error: 'Input is required' });
        }
        
        // Process input through the perception subsystem
        const perception = this.wsInterface.getPerception();
        const cognitiveItems = await perception.processInput(input);
        
        res.json({
          input,
          cognitiveItems,
          message: `Processed input and extracted ${cognitiveItems.length} cognitive item(s)`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to process input',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Add belief endpoint
    this.app.post('/api/belief', async (req, res) => {
      try {
        const { content, truth, attention, meta } = req.body;
        
        if (!content || !truth || !attention) {
          return res.status(400).json({ 
            error: 'Content, truth, and attention are required' 
          });
        }
        
        // Add belief through the core
        const core = this.wsInterface.getCore();
        core.addInitialBelief(content, truth, attention, meta);
        
        res.json({ success: true, message: 'Belief added successfully' });
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to add belief',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Add goal endpoint
    this.app.post('/api/goal', async (req, res) => {
      try {
        const { content, attention, meta } = req.body;
        
        if (!content || !attention) {
          return res.status(400).json({ 
            error: 'Content and attention are required' 
          });
        }
        
        // Add goal through the core
        const core = this.wsInterface.getCore();
        core.addInitialGoal(content, attention, meta);
        
        res.json({ success: true, message: 'Goal added successfully' });
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to add goal',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Server statistics endpoint
    this.app.get('/api/stats', (req, res) => {
      try {
        const stats = this.wsInterface.getServerStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to get server statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Component statistics endpoints
    this.app.get('/api/component/:component/stats', async (req, res) => {
      try {
        const { component } = req.params;
        // In a full implementation, we would call the appropriate component method
        // For now, we'll return mock data
        const mockStats: Record<string, any> = {
          attention: {
            moduleName: 'AttentionModule',
            parameters: {
              priorityWeight: 0.7,
              durabilityWeight: 0.3
            }
          },
          resonance: {
            moduleName: 'ResonanceEngine',
            resonanceCount: 0,
            activePatterns: []
          },
          schema: {
            moduleName: 'SchemaMatcher',
            schemaCount: 5,
            activeSchemas: ['diagnosis', 'planning', 'learning']
          },
          belief: {
            moduleName: 'BeliefRevisionEngine',
            beliefCount: 127,
            revisionCount: 23
          },
          goal: {
            moduleName: 'GoalTreeManager',
            goalCount: 8,
            activeGoals: ['diagnose-condition', 'treat-patient', 'monitor-progress']
          },
          reflection: {
            moduleName: 'ReflectionLoop',
            reflectionCount: 15,
            enabled: true
          }
        };
        
        const stats = mockStats[component];
        stats ? res.json({ statistics: stats }) : res.status(404).json({ error: 'Component not found' });
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to get component statistics',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Schema learning endpoint
    this.app.post('/api/schema/learn', async (req, res) => {
      try {
        // In a full implementation, this would trigger the schema learning process
        res.json({ 
          success: true, 
          message: 'Schema learning process initiated',
          details: 'In a full implementation, this would trigger automatic schema generation based on successful reasoning patterns'
        });
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to initiate schema learning',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Component control endpoints
    this.app.post('/api/component/:component/control', async (req, res) => {
      try {
        const { component } = req.params;
        const { action, parameters } = req.body;
        
        // In a full implementation, we would call the appropriate component method
        // For now, we'll return mock responses
        const responses: Record<string, any> = {
          attention: { 
            success: true, 
            message: 'Attention parameters updated',
            parameters
          },
          reflection: { 
            success: true, 
            message: `Reflection ${parameters?.enabled ? 'enabled' : 'disabled'}`,
            parameters
          }
        };
        
        const response = responses[component];
        response ? res.json(response) : res.status(404).json({ error: 'Component not found or action not supported' });
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to control component',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // General component method execution endpoint
    this.app.post('/api/component/:component/method/:method', async (req, res) => {
      try {
        const { component, method } = req.params;
        const { payload } = req.body;
        
        // In a full implementation, we would call the appropriate component method through the WebSocket interface
        // For now, we'll return mock responses for the expanded functionality
        const mockResponses: Record<string, Record<string, any>> = {
          attention: {
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
          },
          resonance: {
            find_context: { 
              success: true, 
              message: 'Context items found',
              items: []
            }
          },
          schema: {
            find_applicable: { 
              success: true, 
              message: 'Applicable schemas found',
              schemas: []
            },
            apply: { 
              success: true, 
              message: 'Schema applied successfully',
              result: []
            },
            triggerLearning: { 
              success: true, 
              message: 'Schema learning process initiated'
            }
          },
          goal: {
            decompose: { 
              success: true, 
              message: 'Goal decomposed successfully',
              subgoals: []
            },
            mark_achieved: { 
              success: true, 
              message: 'Goal marked as achieved',
              goalId: payload?.goalId
            }
          },
          reflection: {
            recordSchemaUsage: { 
              success: true, 
              message: 'Schema usage recorded',
              schemaId: payload?.schemaId
            }
          }
        };
        
        const componentMethods = mockResponses[component];
        const response = componentMethods?.[method];
        response ? res.json(response) : res.status(404).json({ error: `Method ${method} not found for component ${component}` });
      } catch (error) {
        res.status(500).json({ 
          error: 'Failed to execute component method',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`REST API server listening at http://localhost:${this.port}`);
      console.log(`Health check endpoint: http://localhost:${this.port}/health`);
      console.log(`API status endpoint: http://localhost:${this.port}/api/status`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}