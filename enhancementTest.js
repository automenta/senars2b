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

// Function to send a WebSocket request and wait for a response
function sendWebSocketRequest(ws, target, method, payload) {
    return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substring(2, 15);
        const message = {
            id,
            type: 'request',
            target,
            method,
            payload
        };

        // Set up a listener for the response
        const handleMessage = (data) => {
            const response = JSON.parse(data);
            if (response.id === id && response.type === 'response') {
                ws.off('message', handleMessage);
                resolve(response.payload);
            } else if (response.id === id && response.type === 'error') {
                ws.off('message', handleMessage);
                reject(new Error(response.error.message));
            }
        };

        ws.on('message', handleMessage);
        ws.send(JSON.stringify(message));
    });
}

// WebSocket Test
async function websocketTest() {
    console.log('=== WebSocket Interface Test ===\n');

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
        console.log('System Status:', JSON.stringify(status, null, 2));
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
        console.log('Processed Input:', JSON.stringify(result, null, 2));
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

// REST API Test
async function restApiTest() {
    console.log('=== REST API Interface Test ===\n');

    // Check health
    console.log('1. Checking server health...\n');
    try {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/health',
            method: 'GET'
        };
        const result = await makeRequest(options);
        console.log('Health Check:', result);
    } catch (error) {
        console.error('Error checking health:', error.message);
    }

    // Get status
    console.log('\n2. Getting server status...\n');
    try {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/status',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const result = await makeRequest(options);
        console.log('Server Status:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error getting server status:', error.message);
    }

    // Get diagnostics
    console.log('\n3. Getting system diagnostics...\n');
    try {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/diagnostics',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const result = await makeRequest(options);
        console.log('System Diagnostics:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error getting system diagnostics:', error.message);
    }

    // Add a belief
    console.log('\n4. Adding a belief via REST API...\n');
    try {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/belief',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const postData = JSON.stringify({
            content: 'Cats are curious animals',
            truth: {frequency: 0.8, confidence: 0.9},
            attention: {priority: 0.6, durability: 0.5}
        });
        const result = await makeRequest(options, postData);
        console.log('Added Belief:', result);
    } catch (error) {
        console.error('Error adding belief:', error.message);
    }

    // Process input
    console.log('\n5. Processing input via REST API...\n');
    try {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/process',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const postData = JSON.stringify({
            input: 'How can I keep my cat safe from household hazards?'
        });
        const result = await makeRequest(options, postData);
        console.log('Processed Input:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error processing input:', error.message);
    }

    console.log('\n=== REST API Test Complete ===\n');
}

// Run tests
async function runTests() {
    console.log('=== Senars3 Cognitive System Enhancement Tests ===\n');

    // Run WebSocket test
    await websocketTest();

    // Run REST API test
    await restApiTest();

    console.log('=== All Enhancement Tests Complete ===');
}

// Run the tests
runTests().catch(console.error);