import {WebSocketInterface} from '../web/webSocketInterface';

async function testWebSocketInterface() {
    console.log('Testing WebSocket Interface Enhancements...');

    // Create WebSocket interface
    const wsInterface = new WebSocketInterface(8081, 2);

    // Test server stats
    const stats = wsInterface.getServerStats();
    console.log('Server stats:', stats);

    // Test core access
    const core = wsInterface.getCore();
    console.log('Core worker count:', (core as any).workerCount);

    // Test perception access
    const perception = wsInterface.getPerception();
    console.log('Perception subsystem ready:', !!perception);

    // Close the interface
    wsInterface.close();
    console.log('WebSocket Interface test completed successfully!');
}

testWebSocketInterface().catch(console.error);