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

// API endpoint to get server status
app.get('/api/status', (req, res) => {
  try {
    const stats = wsInterface.getServerStats();
    const systemStatus = wsInterface.getCore().getSystemStatus();
    
    res.json({
      status: 'ok',
      server: stats,
      system: systemStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve server status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint to process input (for programmatic access)
app.post('/api/process', async (req, res) => {
  try {
    const { input } = req.body;
    
    if (!input) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing input field in request body'
      });
    }
    
    if (input.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Input too short. Please provide at least 3 characters.'
      });
    }
    
    // Process the input through the perception subsystem
    const cognitiveItems = await wsInterface.getPerception().processInput(input);
    
    // Add items to the core's agenda
    cognitiveItems.forEach(item => {
      console.log(`Processed item: ${item.type} - ${item.label || item.id}`);
    });
    
    res.json({
      status: 'success',
      message: `Processed input and extracted ${cognitiveItems.length} cognitive item(s)`,
      input: input,
      cognitiveItems: cognitiveItems,
      itemCount: cognitiveItems.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to process input',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
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
  console.log(`Server status endpoint: http://localhost:${port}/api/status`);
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