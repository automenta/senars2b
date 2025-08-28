import { WebSocketInterface } from './webSocketInterface';
import { RestApiInterface } from './restApiInterface';
import path from 'path';

const setupShutdownHandler = (wsInterface: WebSocketInterface) => {
    const shutdown = () => {
        console.log('\
Received shutdown signal. Shutting down gracefully...');
        wsInterface.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

async function main() {
    // Create WebSocket interface
    const wsInterface = new WebSocketInterface(8080, 4);
    
    // Create REST API interface using the same WebSocket interface
    const restApiInterface = new RestApiInterface(wsInterface, 3000);

    // Start both interfaces
    restApiInterface.start();

    // Handle graceful shutdown
    setupShutdownHandler(wsInterface);

    console.log('Senars3 Cognitive System Unified Server started');
    console.log('Unified interface available at http://localhost:3000');
}

main().catch(console.error);