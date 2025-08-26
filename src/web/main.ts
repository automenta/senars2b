import { spawn } from 'child_process';
import path from 'path';

async function main() {
    // Start the WebSocket server in the background
    const wsServer = spawn('ts-node', [path.join(__dirname, 'webSocketServer.ts')], {
        stdio: 'inherit'
    });
    
    console.log('Starting Senars3 Cognitive System with WebSocket backend...');
    console.log('WebSocket server starting on port 8080...');
    
    // Give the WebSocket server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start the unified CLI that connects to the WebSocket server
    const cli = spawn('ts-node', [path.join(__dirname, 'unifiedCLI.ts')], {
        stdio: 'inherit'
    });
    
    // Handle process termination
    const shutdown = () => {
        console.log('\nShutting down Senars3 system...');
        if (wsServer) {
            wsServer.kill();
        }
        process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    cli.on('close', () => {
        shutdown();
    });
}

main().catch(console.error);