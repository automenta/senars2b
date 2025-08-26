# Senars3 Cognitive System - User Guide

This guide provides comprehensive instructions for using the Senars3 cognitive system through its various interfaces.

## System Overview

The Senars3 cognitive system is a verifiable, goal-directed, and self-reflective reasoning system that integrates symbolic and semantic cognition. It processes natural language input by:

1. **Perceiving** - Converting text into cognitive items (beliefs, goals, queries)
2. **Contextualizing** - Finding relevant knowledge in its memory
3. **Reasoning** - Applying cognitive schemas to generate new insights
4. **Acting** - Executing goals like searching or diagnosing
5. **Learning** - Updating its knowledge base with new information

## Available Interfaces

The system provides four main interfaces for interaction:

1. **Command-Line Interface (CLI)** - Interactive text-based interface
2. **Web Interface** - Browser-based graphical interface with enhanced features
3. **WebSocket API** - Programmatic interface for custom applications
4. **REST API** - HTTP-based interface for programmatic access

## Command-Line Interface (CLI)

### Starting the CLI

To start the interactive CLI:

```bash
npm start
# or
npm run cli
```

### CLI Navigation

- Use ↑/↓ arrow keys to navigate command history
- Press Ctrl+C to exit the application

### CLI Commands

Once in the CLI, you can use the following commands:

- `help` - Show help message with available commands and examples
- `status` - Show system status including agenda size and world model statistics
- `stats` - Show processing statistics
- `examples` - Show input examples for different types of input
- `clear` - Clear the screen
- `quit` or `exit` - Exit the system

### Providing Input

You can enter natural language statements or questions for the system to process. Examples:

- Statements: "Chocolate is toxic to dogs"
- Questions: "My cat seems sick after eating chocolate. What should I do?"
- Commands: "Can you search for information about pet nutrition?"
- Goals: "Diagnose why my plant is wilting"
- Complex requests: "Create a comprehensive health plan for my pet including diet, exercise, and medical checkups"

The system will process your input and add the extracted cognitive items to its agenda for further processing.

Type `examples` to see more detailed examples of different input types.

## Web Interface

### Starting the Web Server

To start the web interface:

```bash
npm run start:web
```

This will start both an HTTP server (for serving the web interface) and a WebSocket server (for communication with the cognitive system).

### Accessing the Web Interface

Once the server is running, open your browser and navigate to:

```
http://localhost:3000
```

### Using the Web Interface

The enhanced web interface provides several tabs for different functionalities:

1. **Interactive Demos** - Pre-built examples for different domains
2. **Custom Input** - Enter your own text for processing (supports Ctrl+Enter)
3. **System Status** - Real-time monitoring of system statistics
4. **Help & Examples** - Comprehensive guide and input examples

#### Features:

- Real-time connection status monitoring
- Interactive demos for different domains (Medical, Scientific, Business, etc.)
- Custom input processing with keyboard shortcuts (Ctrl+Enter)
- System status monitoring with live statistics
- Comprehensive help and examples
- Enhanced error handling and user feedback
- Responsive design for different screen sizes

### Keyboard Shortcuts

- **Ctrl+Enter** - Process input in the Custom Input tab
- **Tab** - Switch between different interface sections

## WebSocket API

The WebSocket API provides programmatic access to the cognitive system's capabilities. It uses a request-response pattern with JSON messages.

### Connecting to the WebSocket Server

If you started the web server with `npm run start:web`, the WebSocket server is available at:

```
ws://localhost:8080
```

If you started only the WebSocket server with `npm run start:ws`, it's also available at the same address.

### WebSocket Message Format

All messages follow this structure:

```json
{
  "id": "unique-message-id",
  "type": "request",
  "target": "component-name",
  "method": "method-name",
  "payload": { /* method-specific data */ }
}
```

### Available Components and Methods

#### Core Component

Methods:
- `start` - Start the cognitive core
- `stop` - Stop the cognitive core
- `getSystemStatus` - Get system status information
- `addInitialBelief` - Add an initial belief to the system
- `addInitialGoal` - Add an initial goal to the system
- `addSchema` - Add a cognitive schema to the system
- `addCognitiveItem` - Add a cognitive item to the system

Example:
```javascript
// Start the cognitive core
ws.send(JSON.stringify({
  id: 'msg-1',
  type: 'request',
  target: 'core',
  method: 'start',
  payload: {}
}));

// Add an initial belief
ws.send(JSON.stringify({
  id: 'msg-2',
  type: 'request',
  target: 'core',
  method: 'addInitialBelief',
  payload: {
    content: 'Chocolate is toxic to pets',
    truth: { frequency: 0.9, confidence: 0.95 },
    attention: { priority: 0.8, durability: 0.7 },
    meta: { domain: 'veterinary', author: 'vetdb.org' }
  }
}));
```

#### Perception Component

Methods:
- `processInput` - Process natural language input into cognitive items

Example:
```javascript
// Process natural language input
ws.send(JSON.stringify({
  id: 'msg-3',
  type: 'request',
  target: 'perception',
  method: 'processInput',
  payload: {
    input: 'My cat seems sick after eating chocolate. What should I do?'
  }
}));
```

#### Agenda Component

Methods:
- `size` - Get the current size of the agenda
- `peek` - Peek at the top item in the agenda

Example:
```javascript
// Get agenda size
ws.send(JSON.stringify({
  id: 'msg-4',
  type: 'request',
  target: 'agenda',
  method: 'size',
  payload: {}
}));
```

#### World Model Component

Methods:
- `getStatistics` - Get world model statistics

Example:
```javascript
// Get world model statistics
ws.send(JSON.stringify({
  id: 'msg-5',
  type: 'request',
  target: 'worldModel',
  method: 'getStatistics',
  payload: {}
}));
```

### Handling Responses

The system sends responses in the following format:

```json
{
  "id": "unique-message-id",
  "type": "response",
  "payload": { /* response data */ }
}
```

The system also sends events and errors:

```json
{
  "id": "unique-message-id",
  "type": "event",
  "method": "event-name",
  "payload": { /* event data */ }
}
```

```json
{
  "id": "unique-message-id",
  "type": "error",
  "error": {
    "code": "error-code",
    "message": "error message"
  }
}
```

Example response handling:
```javascript
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'response':
      console.log('Received response:', message.payload);
      break;
    case 'event':
      console.log('Received event:', message.method, message.payload);
      break;
    case 'error':
      console.error('Error:', message.error);
      break;
    case 'welcome':
      console.log('Connected to system:', message.payload);
      break;
  }
};
```

## REST API

The system provides a REST API for programmatic access:

### Endpoints

- `GET /health` - Health check endpoint
- `GET /api/status` - Get server status information
- `POST /api/process` - Process input (asynchronous)

### Example REST API Usage

```bash
# Health check
curl http://localhost:3000/health

# Get server status
curl http://localhost:3000/api/status

# Process input
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": "My cat seems sick after eating chocolate. What should I do?"}'
```

## Input Types and Best Practices

### Input Types

The system can process different types of input:

1. **Statements** - Factual information like "Chocolate is toxic to dogs"
2. **Questions** - Queries that require answers like "What should I do if my cat ate chocolate?"
3. **Commands** - Action requests like "Search for information about pet nutrition"
4. **Goals** - Complex objectives like "Diagnose why my plant is wilting"
5. **Complex Requests** - Multi-part requests like "Create a comprehensive health plan for my pet"

### Input Validation

The system validates all inputs:
- Minimum length: 3 characters
- Maximum length: 10,000 characters
- Must be a string

### Best Practices

1. **Formulate clear inputs** - The system works best with specific, well-formulated statements and questions
2. **Use domain-specific language** - When possible, use terminology relevant to the domain you're working in
3. **Break down complex requests** - For very complex tasks, consider breaking them down into simpler sub-tasks
4. **Monitor system status** - Use the status and stats commands to monitor system performance
5. **Be specific and clear** - Use clear, unambiguous language
6. **Check input length** - Ensure inputs are between 3-10,000 characters

## Understanding Output

The system categorizes output into three types:

1. **Beliefs** - Factual information the system has learned or inferred
2. **Goals** - Tasks or objectives the system needs to accomplish
3. **Queries** - Questions that require answers or exploration

Each cognitive item includes metadata about its truth value and attention value, which help determine its reliability and importance.

## Troubleshooting

### Common Issues

1. **Connection problems with WebSocket interface**
   - Ensure the WebSocket server is running (`npm run start:ws` or `npm run start:web`)
   - Check that the port (8080 by default) is not blocked by a firewall
   - Verify the WebSocket URL is correct
   - Check the web interface for connection status indicators

2. **No results from input processing**
   - Try rephrasing your input
   - Make sure your input contains clear statements, questions, or commands
   - Check that the system is properly started
   - Use the `examples` command in CLI or check the Help tab in the web interface

3. **Performance issues**
   - Monitor agenda size with the status command
   - Consider reducing the number of concurrent workers if system is overloaded
   - Check system status tab in web interface for real-time statistics

4. **Web interface not loading**
   - Ensure the server is running with `npm run start:web`
   - Check that port 3000 is not blocked
   - Try refreshing the page
   - Check the browser's developer console for errors

### Getting Help

For additional help, refer to:
- This user guide
- The system's README.md file
- The core.md specification document
- The technical documentation in the source code comments
- The Help & Examples tab in the web interface