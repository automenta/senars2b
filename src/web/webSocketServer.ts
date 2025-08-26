import { WebSocketInterface } from './webSocketInterface';

async function main() {
    // Create WebSocket interface on port 8080
    const wsInterface = new WebSocketInterface(8080, 4);
    
    // Handle graceful shutdown
    const shutdown = () => {
        console.log('\nReceived shutdown signal. Shutting down gracefully...');
        wsInterface.close();
        process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    console.log('Senars3 Cognitive System WebSocket Server started');
    console.log('Listening on ws://localhost:8080');
}

main().catch(console.error);