# Senars3 Cognitive System - User Guide

This guide provides comprehensive instructions for using the Senars3 cognitive system through its unified interface that
works across both CLI and Web environments. Please note that Senars3 is currently in active development, and some
features described in this guide may be partially implemented or planned for future releases.

## Current Development Status

Senars3 is currently in active development with a focus on implementing a task-centric cognitive architecture. The
system has a working prototype with basic functionality but many advanced features are still being developed.

**Currently Available:**

- Basic cognitive architecture with agenda system and world model
- Task management system with factory and validation utilities
- Unified interface (CLI and Web) with WebSocket communication
- Community Simulator for multi-agent collaboration demonstrations

**In Development:**

- Advanced task processing and execution engine
- Schema learning and evolution mechanisms
- Enhanced uncertainty management
- Self-modification and metaprogramming capabilities

See the README.md file for the complete roadmap and development status.

## Quick Start

1. Start the system: `npm run start:web`
2. Access the web interface at: `http://localhost:3000`
3. Or start the CLI: `npm start`

## Available Interfaces

Senars3 provides a **unified interface** that works seamlessly across environments:

1. **Unified Command-Line Interface (CLI)** - Text-based interface connecting to the WebSocket backend
2. **Unified Web Interface** - Browser-based graphical interface with real-time feedback
3. **WebSocket API** - Programmatic interface for custom applications
4. **REST API** - HTTP-based interface for programmatic access (limited functionality)

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
process My cat seems sick after eating chocolate. What should I do?

# Get system status
core.getSystemStatus {}

# Process input with perception subsystem
perception.processInput {"input": "Example input for processing"}
```

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
3. **Task Management** - Real-time task tracking and management
4. **System Status** - Real-time monitoring of system statistics
5. **Metaprogramming** - Direct component access and self-modification interface
6. **Help & Examples** - Comprehensive guide and input examples
7. **Community** - Multi-agent collaboration simulator

#### Features:

- Real-time connection status monitoring
- Interactive demos for different domains
- Custom input processing with keyboard shortcuts (Ctrl+Enter)
- Task management with real-time tracking
- CLI mode toggle for command-line experience in the browser
- System status monitoring with live statistics
- Metaprogramming interface for self-representation and modification
- Comprehensive help and examples
- Enhanced error handling and user feedback
- Responsive design for different screen sizes

#### Keyboard Shortcuts

- **Ctrl+Enter** - Process input in the Custom Input tab
- **Tab** - Switch between different interface sections

## API Access

### WebSocket API

The WebSocket API provides programmatic access to the cognitive system's capabilities. It uses a request-response
pattern with JSON messages.

#### Connecting to the WebSocket Server

If you started the web server with `npm run start:web`, the WebSocket server is available at:

```
ws://localhost:8080
```

If you started only the WebSocket server with `npm run start:ws`, it's also available at the same address.

#### WebSocket Message Format

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

#### Available Components and Methods

##### Core Component

Methods:

- `start` - Start the cognitive core
- `stop` - Stop the cognitive core
- `getSystemStatus` - Get system status information
- `addInitialBelief` - Add an initial belief to the system
- `addInitialGoal` - Add an initial goal to the system
- `addSchema` - Add a cognitive schema to the system
- `addCognitiveItem` - Add a cognitive item to the system

##### Tasks Component

Methods:

- `addTask` - Add a new task to the system
- `updateTask` - Update an existing task
- `removeTask` - Remove a task from the system
- `getTask` - Retrieve a specific task by ID
- `getAllTasks` - Retrieve all tasks
- `updateTaskStatus` - Update the status of a task

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
    content: 'Chocolate is toxic to pets',
    truth: { frequency: 0.9, confidence: 0.85 },
    attention: { priority: 0.8, durability: 0.7 },
    meta: { domain: 'veterinary' }
  }
}));
```

##### Perception Component

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

##### Agenda Component

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

##### World Model Component

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

#### Handling Responses

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

### REST API

The system provides a REST API for programmatic access:

#### Endpoints

- `GET /health` - Health check endpoint
- `GET /api/status` - Get server status information
- `POST /api/process` - Process input (asynchronous)

#### Example REST API Usage

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

## Input Best Practices

### Input Types

The system can process different types of input:

1. **Statements** - Factual information like "Chocolate is toxic to dogs"
2. **Questions** - Queries like "What should I do if my cat is sick?"
3. **Commands** - Action requests like "Diagnose why my plant is wilting"
4. **Goals** - Complex objectives like "Find solutions to reduce energy consumption"

### Best Practices

1. **Be Clear and Specific** - Use clear, unambiguous language
2. **Break Down Complex Requests** - For complex tasks, consider breaking them into simpler steps
3. **Check Input Length** - Ensure inputs are between 3-10,000 characters
4. **Use Natural Language** - The system is designed to work with natural language input

## Task Management

The Senars3 system includes a task management system that integrates with the cognitive processing engine. Tasks can be
created, updated, and tracked through both the web interface and programmatic APIs.

### Task Properties

Each task includes the following properties:

- **Title**: A concise description of the task
- **Description**: Detailed information about the task (optional)
- **Priority**: Priority level ('low', 'medium', 'high', 'critical')
- **Status**: Current status ('pending', 'awaiting_dependencies', 'completed', etc.)
- **Due Date**: Optional deadline for task completion
- **Dependencies**: Other tasks that must be completed before this task
- **Subtasks**: Tasks that are part of this larger task

### Task Creation

Tasks can be created through the web interface or programmatically:

1. **Web Interface**: Use the "Task Management" tab to add new tasks
2. **WebSocket API**: Send a request to the `tasks.addTask` method with task details

### Current Task Features

- **Task Factory**: Utilities for creating standardized tasks
- **Task Validation**: Validation and normalization of task structures
- **Hierarchical Tasks**: Support for parent-child relationships
- **Task Metadata**: Rich metadata including priority, dependencies, deadlines

### Planned Task Features

- **Task Execution Engine**: Full execution capabilities for tasks
- **Automatic Progress Tracking**: Real-time progress calculation
- **Task Grouping**: Grouping related tasks
- **Advanced Scheduling**: Temporal scheduling with resource allocation

## Community Simulator

The Community Simulator is a multi-agent collaboration environment that demonstrates how cognitive agents can work
together to solve problems.

### Accessing the Simulator

1. Navigate to the "Community" view in the unified interface
2. Select a problem from the dropdown menu
3. Deploy agent participants by entering names and clicking "Add Participant"
4. Click "Start Simulation" to begin the collaborative session

### Available Problems

- Medical Diagnosis Challenge
- Environmental Impact Assessment
- Strategic Business Decision
- Cybersecurity Threat Analysis
- Scientific Hypothesis Testing

### Simulator Features

- **Autonomous Agent Actions**: Agents automatically contribute to discussions
- **Human Participation**: You can submit your own inputs to the collaboration
- **Real-time Feed**: All interactions are displayed in real-time

## Troubleshooting

### Common Issues

1. **Connection problems with WebSocket interface**
    - Ensure the WebSocket server is running (`npm run start:ws` or `npm run start:web`)
    - Check that the port (8080 by default) is not blocked by a firewall
    - Verify the WebSocket URL is correct
    - Check the web interface for connection status indicators

2. **No results from input processing**
    - Try rephrasing your input to be more explicit
    - Make sure your input contains clear statements or questions
    - Check that the system is properly started
    - Use the `help` command in CLI or check the Help tab in the web interface

3. **Performance issues**
    - Monitor agenda size with the status command
    - Check system status tab in web interface for real-time statistics

4. **Web interface not loading**
    - Ensure the server is running with `npm run start:web`
    - Check that port 3000 is not blocked
    - Try refreshing the page
    - Check the browser's developer console for errors

### Getting Help

For additional help, refer to:

- The system's README.md file for comprehensive system documentation and development status
- The Help & Examples tab in the web interface