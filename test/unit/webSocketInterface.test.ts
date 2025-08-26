// Simple test to verify WebSocket interface functionality
import { WebSocketInterface } from '../../src/webSocketInterface';
import WebSocket = require('ws');

describe('WebSocketInterface Integration', () => {
  let wsInterface: WebSocketInterface | null = null;
  let wsClient: WebSocket | null = null;
  const testPort = 8081;

  beforeEach((done) => {
    // Create WebSocket interface
    wsInterface = new WebSocketInterface(testPort, 1);
    
    // Give the server a moment to start
    setTimeout(() => {
      done();
    }, 100);
  });

  afterEach(() => {
    if (wsClient) {
      wsClient.close();
      wsClient = null;
    }
    
    if (wsInterface) {
      wsInterface.close();
      wsInterface = null;
    }
  });

  it('should start a WebSocket server and accept connections', (done) => {
    // Connect a client
    wsClient = new WebSocket(`ws://localhost:${testPort}`);
    
    wsClient.on('open', () => {
      // If we get here, the connection was successful
      done();
    });
    
    wsClient.on('error', (error) => {
      done(error);
    });
  });

  it('should send a welcome message to new clients', (done) => {
    // Connect a client
    wsClient = new WebSocket(`ws://localhost:${testPort}`);
    
    wsClient.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('event');
        expect(message.method).toBe('welcome');
        expect(message.payload).toBeDefined();
        expect(message.payload.message).toContain('Senars3 Cognitive System');
        done();
      } catch (error) {
        done(error);
      }
    });
    
    wsClient.on('error', (error) => {
      done(error);
    });
  });
});