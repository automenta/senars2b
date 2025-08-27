# Senars3 Cognitive System - User Guide

This guide provides comprehensive instructions for using the Senars3 cognitive system through its unified interface that
works across both CLI and Web environments.

> **Note**: This guide focuses on practical usage. For technical details about the Non-Axiomatic Logic principles,
> please refer to [core.md](core.md). For system features and setup instructions, see [README.md](README.md).

## System Overview

The Senars3 cognitive system is a next-generation agentic reasoning system that uses non-axiomatic logic principles to
fuse symbolic reasoning with Language Model technology. It processes natural language input through:

1. **Perceiving** - Converting text into cognitive items (beliefs, goals, queries) with uncertainty values
2. **Contextualizing** - Finding relevant knowledge in its memory using resonance mechanisms
3. **Reasoning** - Applying cognitive schemas to generate new insights with confidence assessment
4. **Acting** - Executing goals like searching or diagnosing with attention prioritization
5. **Learning** - Updating its knowledge base with new information through belief revision

## Available Interfaces

The system provides a **unified interface** that works seamlessly across both CLI and Web environments:

1. **Unified Command-Line Interface (CLI)** - Interactive text-based interface that connects to the WebSocket backend
2. **Unified Web Interface** - Browser-based graphical interface with real-time feedback and metaprogramming
   capabilities
3. **WebSocket API** - Programmatic interface for custom applications
4. **REST API** - HTTP-based interface for programmatic access

## Unified Command-Line Interface (CLI)

### Starting the Unified CLI

To start the interactive CLI that connects to the WebSocket backend:

```bash
npm start
# or
npm run cli
```

This will automatically start the WebSocket server in the background and connect the CLI to it.

### CLI Navigation

- Use ↑/↓ arrow keys to navigate command history
- Press Ctrl+C to exit the application

### CLI Commands

Once in the CLI, you can use the following commands:

- `help` - Show help message with available commands and examples
- `status` - Show system status including agenda size and world model statistics
- `stats` - Show processing statistics
- `process <input>` - Process natural language input through non-axiomatic logic
- `clear` - Clear the screen
- `quit` or `exit` - Exit the system

### Direct Component Access

The unified CLI allows direct access to system components:

- `core.<method> <json>` - Call core methods
- `perception.<method> <json>` - Call perception methods
- `agenda.<method> <json>` - Call agenda methods
- `worldModel.<method> <json>` - Call world model methods

Examples:

```bash
# Process input
process My cat seems sick after eating chocolate. What should I do considering uncertainty?

# Get system status
core.getSystemStatus {}

# Process input with perception subsystem
perception.processInput {"input": "Example input for processing"}

# Get world model statistics
worldModel.getStatistics {}
```

### Providing Input

You can enter natural language statements or questions for the system to process through its non-axiomatic logic
framework. Examples:

- Uncertain Statements: "Chocolate is likely toxic to dogs"
- Probabilistic Questions: "What is the probability my cat is sick after eating chocolate?"
- Conditional Commands: "If my plant is wilting due to overwatering, reduce watering frequency"
- Exploratory Goals: "Diagnose why my plant is wilting considering multiple possible causes"
- Adaptive Requests: "Create a health plan for my pet that adjusts based on ongoing symptoms"

The system will process your input and add the extracted cognitive items to its agenda for further processing through
its non-axiomatic reasoning engine.

## Unified Web Interface

### Starting the Web Server

To start the unified web interface:

```bash
npm run start:web
```

This will start both an HTTP server (for serving the web interface) and a WebSocket server (for communication with the
cognitive system).

### Accessing the Web Interface

Once the server is running, open your browser and navigate to:

```
http://localhost:3000
```

### Using the Web Interface

The unified web interface provides several tabs for different functionalities:

1. **Cognitive Demos** - Pre-built examples for different domains using non-axiomatic logic
2. **Custom Input** - Enter your own text for processing (supports Ctrl+Enter)
3. **System Status** - Real-time monitoring of system statistics
4. **Metaprogramming** - Direct component access and self-modification interface
5. **Help & Examples** - Comprehensive guide and input examples

#### Features:

- Real-time connection status monitoring
- Interactive demos for different domains (Medical, Scientific, Business, etc.) with uncertainty management
- Custom input processing with keyboard shortcuts (Ctrl+Enter)
- CLI mode toggle for command-line experience in the browser
- System status monitoring with live statistics
- Metaprogramming interface for self-representation and modification
- Comprehensive help and examples for non-axiomatic logic principles
- Enhanced error handling and user feedback
- Responsive design for different screen sizes

### Keyboard Shortcuts

- **Ctrl+Enter** - Process input in the Custom Input tab
- **Tab** - Switch between different interface sections

## WebSocket API

The WebSocket API provides programmatic access to the cognitive system's capabilities. It uses a request-response
pattern with JSON messages.

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

// Add an initial belief with uncertainty values
ws.send(JSON.stringify({
  id: 'msg-2',
  type: 'request',
  target: 'core',
  method: 'addInitialBelief',
  payload: {
    content: 'Chocolate is toxic to pets with high probability',
    truth: { frequency: 0.9, confidence: 0.85 },
    attention: { priority: 0.8, durability: 0.7 },
    meta: { domain: 'veterinary', author: 'vetdb.org', uncertainty: 'high' }
  }
}));
```

#### Perception Component

Methods:

- `processInput` - Process natural language input into cognitive items

Example:

```javascript
// Process natural language input with uncertainty consideration
ws.send(JSON.stringify({
  id: 'msg-3',
  type: 'request',
  target: 'perception',
  method: 'processInput',
  payload: {
    input: 'My cat seems sick after eating chocolate. What should I do considering uncertainty?'
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

# Process input with uncertainty consideration
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": "My cat seems sick after eating chocolate. What should I do considering uncertainty?"}'
```

## Input Types and Best Practices for Non-Axiomatic Logic

### Input Types

The system can process different types of input through its non-axiomatic logic framework:

1. **Uncertain Statements** - Information with implicit uncertainty like "Chocolate is likely toxic to dogs"
2. **Probabilistic Questions** - Queries that require uncertainty-aware answers like "What is the probability my cat is
   sick after eating chocolate?"
3. **Conditional Commands** - Action requests with uncertainty considerations like "If my plant is wilting due to
   overwatering, reduce watering frequency"
4. **Exploratory Goals** - Complex objectives with uncertainty evaluation like "Diagnose why my plant is wilting
   considering multiple possible causes"
5. **Adaptive Requests** - Multi-part requests that adapt based on uncertainty like "Create a health plan for my pet
   that adjusts based on ongoing symptoms"

### Input Validation

The system validates all inputs:

- Minimum length: 3 characters
- Maximum length: 10,000 characters
- Must be a string

### Best Practices for Non-Axiomatic Logic Processing

1. **Express Uncertainty Explicitly** - Include phrases like "likely", "possibly", "with high probability" to help the
   system understand uncertainty levels
2. **Use Conditional Language** - Frame requests with "if-then" constructs to express conditional relationships
3. **Specify Confidence Requirements** - Indicate when you need high-confidence answers vs. exploratory responses
4. **Break Down Complex Requests** - For very complex tasks, consider breaking them down into simpler sub-tasks with
   explicit uncertainty handling
5. **Monitor System Status** - Use the status and stats commands to monitor system performance and uncertainty
   processing
6. **Be Specific and Clear** - Use clear, unambiguous language while acknowledging inherent uncertainties
7. **Check Input Length** - Ensure inputs are between 3-10,000 characters

## Understanding Non-Axiomatic Logic Output

The system categorizes output through its non-axiomatic framework:

1. **Beliefs** - Factual information the system has learned or inferred with associated truth values (frequency and
   confidence)
2. **Goals** - Tasks or objectives the system needs to accomplish with associated attention values (priority and
   durability)
3. **Queries** - Questions that require answers or exploration with associated interest values

Each cognitive item includes metadata about its truth value and attention value, which help determine its reliability
and importance in the non-axiomatic framework.

## Metaprogramming and Self-Modification

The unified interface enables direct interaction with the system's self-representational capabilities:

1. **Component Introspection** - Examine internal state of cognitive modules
2. **Parameter Adjustment** - Modify system parameters that affect reasoning
3. **Schema Evolution** - Add or modify cognitive patterns that guide reasoning
4. **Reflection Control** - Configure how the system monitors and adapts itself

Through the metaprogramming interface in both CLI and Web UI, users can directly modify system behavior and observe how
the system adapts its reasoning processes.

## Troubleshooting

### Common Issues

1. **Connection problems with WebSocket interface**
    - Ensure the WebSocket server is running (`npm run start:ws` or `npm run start:web`)
    - Check that the port (8080 by default) is not blocked by a firewall
    - Verify the WebSocket URL is correct
    - Check the web interface for connection status indicators

2. **No results from input processing**
    - Try rephrasing your input to be more explicit about uncertainty
    - Make sure your input contains clear statements, questions, or commands with uncertainty considerations
    - Check that the system is properly started
    - Use the `help` command in CLI or check the Help tab in the web interface

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