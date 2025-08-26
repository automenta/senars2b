# Senars3 Cognitive System

A verifiable, goal-directed, and self-reflective reasoning system that integrates symbolic and semantic cognition.

## Overview

This system implements a decentralized, event-driven cognitive engine centered on a prioritized agenda. It integrates perception, memory, reasoning, action, and metacognition into a coherent loop.

## Architecture

The system follows a modular architecture with the following key components:

1. **Agenda** - Central cognitive queue (priority queue)
2. **WorldModel** - Persistent knowledge base with multi-index store
3. **CognitiveCore** - Worker pool for executing cognitive cycles
4. **Pluggable Cognitive Modules**:
   - AttentionModule
   - ResonanceModule
   - SchemaMatcher
   - BeliefRevisionEngine
   - GoalTreeManager
   - ReflectionLoop
5. **I/O Subsystems**:
   - PerceptionSubsystem
   - ActionSubsystem

## Core Data Model

- **SemanticAtom** - Immutable knowledge unit with content and embedding
- **CognitiveItem** - Contextualized thought (belief, goal, or query) with attention and truth values

## Getting Started

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

### Running Tests

We have implemented a comprehensive unit test suite with Jest:

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Viewing Usability Documentation

```bash
# View usability enhancements documentation
npm run docs:usability
```

### Running the System

```bash
# Run the main system (CLI interface)
npm start

# Run the WebSocket server for web interface
npm run start:ws

# Run the combined HTTP + WebSocket server for web interface
npm run start:web

# Run basic component tests
npx ts-node src/basicTest.ts

# Run comprehensive system test
npx ts-node src/comprehensiveTest.ts

# Run full system test
npx ts-node src/fullSystemTest.ts

# Run benchmark
npx ts-node src/benchmark.ts
```

### User Interfaces

The system provides multiple interfaces for interaction:

1. **Command-Line Interface (CLI)** - Interactive text-based interface
2. **Web Interface** - Browser-based graphical interface with real-time feedback
3. **WebSocket API** - Programmatic interface for custom applications
4. **REST API** - HTTP-based interface for programmatic access

### Web Interface

The enhanced web interface provides a rich, interactive experience with:

- Real-time connection status monitoring
- Interactive demos for different domains
- Custom input processing with keyboard shortcuts
- System status monitoring with live statistics
- Comprehensive help and examples

To access the web interface:

1. Start the combined server: `npm run start:web`
2. Open your browser to: `http://localhost:3000`

### User Guide

For detailed instructions on using the system, see our [User Guide](USER_GUIDE.md).

## WebSocket Interface

The system includes a metaprogrammatic WebSocket interface that exposes the cognitive system's capabilities for flexible and adaptable web UI integration.

### Starting the WebSocket Server

```bash
# Start only the WebSocket server
npm run start:ws

# Start combined HTTP + WebSocket server
npm run start:web
```

### WebSocket API

The WebSocket interface uses a request-response pattern with the following message structure:

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

1. **core**
   - `start` - Start the cognitive core
   - `stop` - Stop the cognitive core
   - `getSystemStatus` - Get system status information
   - `addInitialBelief` - Add an initial belief to the system
   - `addInitialGoal` - Add an initial goal to the system
   - `addSchema` - Add a cognitive schema to the system

2. **perception**
   - `processInput` - Process natural language input into cognitive items

3. **agenda**
   - `size` - Get the current size of the agenda
   - `peek` - Peek at the top item in the agenda

4. **worldModel**
   - `getStatistics` - Get world model statistics

5. **actionSubsystem**
   - `getStatistics` - Get action subsystem statistics

### Example WebSocket Communication

```javascript
// Connect to the WebSocket server
const ws = new WebSocket('ws://localhost:8080');

// Process input through the perception subsystem
ws.send(JSON.stringify({
  id: 'msg-1',
  type: 'request',
  target: 'perception',
  method: 'processInput',
  payload: {
    input: 'My cat seems sick after eating chocolate. What should I do?'
  }
}));

// Handle responses
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  if (message.type === 'response') {
    console.log('Received response:', message.payload);
  }
};
```

## REST API

The system also provides a REST API for programmatic access:

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

## Key Features

- **Hybrid Cognition**: Combines symbolic logic with semantic vectors
- **Concurrency-Native**: Built on asynchronous, parallel processing
- **Verifiable Provenance**: Every derived item traces back to its source
- **Modular Abstraction**: Swappable modules with strict interfaces
- **Goal-Agentic Flow**: All cognition driven by goals
- **Trust-Aware Inference**: Knowledge weighted by credibility
- **Self-Reflective Operation**: System audits its own performance
- **Multi-Interface Access**: CLI, Web, WebSocket, and REST APIs
- **Enhanced Usability**: Improved error handling, status monitoring, and user feedback

## Implementation Status

✅ Complete implementation of all core components according to specification.

## Test Coverage

The system includes comprehensive unit tests covering:

- All core components (Agenda, WorldModel, CognitiveCore, etc.)
- All pluggable modules (AttentionModule, ResonanceModule, etc.)
- Domain-specific scenarios (Medical, Financial, Educational, Legal, Environmental, Cybersecurity)
- Integration tests verifying component interactions

See [TEST_SUMMARY.md](TEST_SUMMARY.md) for detailed test coverage information.