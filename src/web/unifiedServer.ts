import { UnifiedInterface } from './unifiedInterface';

async function main() {
    // Create unified interface on ports 8080 (WebSocket) and 3000 (REST)
    const unifiedInterface = new UnifiedInterface(8080, 3000, 4);
    
    // Start both interfaces
    unifiedInterface.start();
    
    // Handle graceful shutdown
    const shutdown = () => {
        console.log('\
Received shutdown signal. Shutting down gracefully...');
        unifiedInterface.stop();
        process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    console.log('Senars3 Cognitive System Unified Server started');
}

main().catch(console.error);