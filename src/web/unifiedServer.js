const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);

// Serve static files from the web directory
app.use(express.static(path.join(__dirname, 'web')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'unifiedInterface.html'));
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    // Send welcome message
    const welcomeMessage = {
        id: 'welcome-' + Date.now(),
        type: 'welcome',
        payload: {
            message: 'Welcome to Senars3 Cognitive System',
            systemInfo: {
                version: '3.0.0-nal',
                workerCount: 4
            },
            serverStats: {
                uptime: '00:00:00'
            }
        }
    };
    ws.send(JSON.stringify(welcomeMessage));
    
    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('Received message:', message);
            
            // Echo the message back as a response for demo purposes
            const response = {
                id: message.id,
                type: 'response',
                payload: {
                    message: `Processed ${message.method} on ${message.target}`,
                    data: message.payload
                }
            };
            ws.send(JSON.stringify(response));
        } catch (error) {
            console.error('Error processing message:', error);
            
            // Send error response
            const errorResponse = {
                id: 'error-' + Date.now(),
                type: 'error',
                error: {
                    code: 'PARSE_ERROR',
                    message: 'Failed to parse message'
                }
            };
            ws.send(JSON.stringify(errorResponse));
        }
    });
    
    // Handle connection close
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Senars3 Unified Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});