const WebSocket = require('ws');

// Connect to the WebSocket server
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
    console.log('Connected to Senars3 Cognitive System');

    // Send a command to process some input
    const processInputMessage = {
        id: '1',
        type: 'request',
        target: 'perception',
        method: 'processInput',
        payload: {
            input: 'The cat is sick after eating chocolate. What should I do?'
        }
    };

    console.log('Sending input for processing...');
    ws.send(JSON.stringify(processInputMessage));
});

ws.on('message', function incoming(data) {
    const response = JSON.parse(data);
    console.log('Received response:', response);

    if (response.id === '1' && response.type === 'response') {
        // After processing input, let's get the system status
        const statusMessage = {
            id: '2',
            type: 'request',
            target: 'core',
            method: 'getSystemStatus',
            payload: {}
        };

        console.log('Getting system status...');
        ws.send(JSON.stringify(statusMessage));
    } else if (response.id === '2' && response.type === 'response') {
        console.log('System status:', response.payload);
        ws.close();
    }
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('Disconnected from Senars3 Cognitive System');
});