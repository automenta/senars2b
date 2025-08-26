import express from 'express';
import { WebSocketInterface } from './webSocketInterface';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Create WebSocket interface
const wsInterface = new WebSocketInterface(8080);

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the src directory
app.use(express.static(path.join(__dirname)));

// Serve the enhanced web interface as the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'enhancedWebInterface.html'));
});

// Serve the legacy interface
app.get('/legacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'webInterfaceWs.html'));
});

// Serve the visualization demo
app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'visualizationDemo.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start the HTTP server
const server = app.listen(port, () => {
  console.log(`HTTP server listening at http://localhost:${port}`);
  console.log(`WebSocket server listening at ws://localhost:8080`);
  console.log(`Health check endpoint: http://localhost:${port}/health`);
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