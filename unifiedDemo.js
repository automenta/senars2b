const WebSocket = require('ws');
const http = require('http');

// Function to make an HTTP request
function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve(data);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }

        req.end();
    });
}

// Function to send a WebSocket request and wait for a response\nfunction sendWebSocketRequest(ws, target, method, payload) {\n    return new Promise((resolve, reject) => {\n        const id = Math.random().toString(36).substring(2, 15);\n        const message = {\n            id,\n            type: 'request',\n            target,\n            method,\n            payload\n        };\n\n        // Set up a listener for the response\n        const handleMessage = (data) => {\n            const response = JSON.parse(data);\n            if (response.id === id && response.type === 'response') {\n                ws.off('message', handleMessage);\n                resolve(response.payload);\n            } else if (response.id === id && response.type === 'error') {\n                ws.off('message', handleMessage);\n                reject(new Error(response.error.message));\n            }\n        };\n\n        ws.on('message', handleMessage);\n        ws.send(JSON.stringify(message));\n    });\n}

// WebSocket Demo Functions
async function websocketDemo() {
    console.log('=== WebSocket Interface Demo ===\n');

    // Connect to the WebSocket server
    const ws = new WebSocket('ws://localhost:8080');

    // Wait for connection
    await new Promise(resolve => {
        ws.on('open', resolve);
    });

    console.log('Connected to Senars3 Cognitive System via WebSocket\n');

    // Get system status via WebSocket
    console.log('1. Getting system status via WebSocket...\n');
    try {
        const status = await sendWebSocketRequest(ws, 'core', 'getSystemStatus', {});
        console.log('System Status:', status);
    } catch (error) {
        console.error('Error getting system status:', error.message);
    }

    // Get system diagnostics via WebSocket
    console.log('\n2. Getting system diagnostics via WebSocket...\n');
    try {
        const diagnostics = await sendWebSocketRequest(ws, 'core', 'getSystemDiagnostics', {});
        console.log('System Diagnostics:', JSON.stringify(diagnostics, null, 2));
    } catch (error) {
        console.error('Error getting system diagnostics:', error.message);
    }

    // Process input via WebSocket
    console.log('\n3. Processing input via WebSocket...\n');
    try {
        const result = await sendWebSocketRequest(ws, 'perception', 'processInput', {
            input: 'My cat seems sick after eating chocolate. What should I do?'
        });
        console.log('Processed Input:', result);
    } catch (error) {
        console.error('Error processing input:', error.message);
    }

    // Add a belief via WebSocket
    console.log('\n4. Adding a belief via WebSocket...\n');
    try {
        const result = await sendWebSocketRequest(ws, 'core', 'addInitialBelief', {
            content: 'Chocolate is toxic to cats',
            truth: {frequency: 0.9, confidence: 0.95},
            attention: {priority: 0.8, durability: 0.7}
        });
        console.log('Added Belief:', result);
    } catch (error) {
        console.error('Error adding belief:', error.message);
    }

    ws.close();
    console.log('\nDisconnected from WebSocket interface\n');
}

// REST API Demo Functions\nasync function restApiDemo() {\n    console.log('=== REST API Interface Demo ===\\n');\n\n    // Check health\n    console.log('1. Checking server health...\\n');\n    try {\n        const options = {\n            hostname: 'localhost',\n            port: 3000,\n            path: '/health',\n            method: 'GET'\n        };\n        const result = await makeRequest(options);\n        console.log('Health Check:', result);\n    } catch (error) {\n        console.error('Error checking health:', error.message);\n    }\n\n    // Get status\n    console.log('\\n2. Getting server status...\\n');\n    try {\n        const options = {\n            hostname: 'localhost',\n            port: 3000,\n            path: '/api/status',\n            method: 'GET',\n            headers: {\n                'Content-Type': 'application/json'\n            }\n        };\n        const result = await makeRequest(options);\n        console.log('Server Status:', result);\n    } catch (error) {\n        console.error('Error getting server status:', error.message);\n    }\n\n    // Get diagnostics\n    console.log('\\n3. Getting system diagnostics...\\n');\n    try {\n        const options = {\n            hostname: 'localhost',\n            port: 3000,\n            path: '/api/diagnostics',\n            method: 'GET',\n            headers: {\n                'Content-Type': 'application/json'\n            }\n        };\n        const result = await makeRequest(options);\n        console.log('System Diagnostics:', JSON.stringify(result, null, 2));\n    } catch (error) {\n        console.error('Error getting system diagnostics:', error.message);\n    }\n\n    // Add a belief\n    console.log('\\n4. Adding a belief via REST API...\\n');\n    try {\n        const options = {\n            hostname: 'localhost',\n            port: 3000,\n            path: '/api/belief',\n            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json'\n            }\n        };\n        const postData = JSON.stringify({\n            content: 'Cats are curious animals',\n            truth: {frequency: 0.8, confidence: 0.9},\n            attention: {priority: 0.6, durability: 0.5}\n        });\n        const result = await makeRequest(options, postData);\n        console.log('Added Belief:', result);\n    } catch (error) {\n        console.error('Error adding belief:', error.message);\n    }\n\n    // Process input\n    console.log('\\n5. Processing input via REST API...\\n');\n    try {\n        const options = {\n            hostname: 'localhost',\n            port: 3000,\n            path: '/api/process',\n            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json'\n            }\n        };\n        const postData = JSON.stringify({\n            input: 'How can I keep my cat safe from household hazards?'\n        });\n        const result = await makeRequest(options, postData);\n        console.log('Processed Input:', result);\n    } catch (error) {\n        console.error('Error processing input:', error.message);\n    }\n\n    console.log('\\n=== REST API Demo Complete ===\\n');\n}

// Unified Demo
async function runUnifiedDemo() {
    console.log('=== Senars3 Cognitive System Unified Demo ===\n');

    // Run WebSocket demo
    await websocketDemo();

    // Run REST API demo
    await restApiDemo();

    console.log('=== Unified Demo Complete ===');
}

// Run the unified demo
runUnifiedDemo().catch(console.error);