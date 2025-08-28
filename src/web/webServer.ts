import express from 'express';
import {WebSocketInterface} from './webSocketInterface';
import {RestApiInterface} from './restApiInterface';
import path from 'path';

// Create WebSocket interface
const wsInterface = new WebSocketInterface(8080);

// Create REST API interface
const restApiInterface = new RestApiInterface(wsInterface, 3000);

const app = restApiInterface.getApp();
const port = process.env.PORT || 3000;

// Serve node_modules for charting libraries
app.use('/node_modules', express.static(path.join(__dirname, '../../node_modules')));

// Serve static files from the src directory
app.use(express.static(path.join(__dirname)));

// Serve the new planner interface as the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'planner.html'));
});

// Serve the original unified interface at /dev
app.get('/dev', (req, res) => {
    res.sendFile(path.join(__dirname, 'unifiedInterface.html'));
});

// Start the HTTP server
const server = app.listen(port, () => {
    console.log(`HTTP server listening at http://localhost:${port}`);
    console.log(`WebSocket server listening at ws://localhost:8080`);
    console.log(`Health check endpoint: http://localhost:${port}/health`);
    console.log(`API status endpoint: http://localhost:${port}/api/status`);
});

// Handle graceful shutdown
const shutdown = () => {
    console.log('\nReceived shutdown signal. Shutting down gracefully...');
    try {
        wsInterface.close();
    } catch (error) {
        console.error('Error closing WebSocket interface:', error);
    }

    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle server errors
server.on('error', (error) => {
    console.error('HTTP server error:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Don't exit immediately, try to shut down gracefully
    setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    // Don't exit immediately, try to shut down gracefully
    setTimeout(() => process.exit(1), 1000);
});