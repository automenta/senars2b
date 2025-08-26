#!/usr/bin/env node

import { WebSocketInterface } from './web/webSocketInterface';

// Create a simple test
async function test() {
    console.log('Testing Senars3 WebSocket Interface...');
    
    // Create WebSocket interface on port 8081 for testing
    const wsInterface = new WebSocketInterface(8081, 2);
    
    console.log('WebSocket interface created on port 8081');
    
    // Wait a moment for the server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Test completed successfully');
    
    // Close the interface
    wsInterface.close();
}

test().catch(console.error);