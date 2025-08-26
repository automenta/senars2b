# Senars3 Cognitive System

A next-generation agentic reasoning system that uses Non-Axiomatic Logic (NAL) principles to implement the ultimate fusion of symbolic reasoning and Language Model technology.

## Overview

The Senars3 cognitive system combines symbolic reasoning with Language Model technology to create a system capable of learning, adaptation, and self-improvement through interaction with its environment. It features:

- Experience-grounded reasoning instead of fixed axioms
- Explicit uncertainty management through truth values (frequency and confidence)
- Goal-directed cognition with attention mechanisms (priority and durability)
- Self-reflective operation and adaptation
- Unified interface with both CLI and Web UI access through a WebSocket backend

## Core Concepts

### Non-Axiomatic Logic Principles

1. **Experience-Grounded Reasoning**: All reasoning is grounded in experience rather than fixed axioms
2. **Uncertainty Management**: Knowledge carries explicit uncertainty measures through truth values:
   - **Frequency (f)**: Relative frequency of evidence supporting a statement (0.0 to 1.0)
   - **Confidence (c)**: Amount of evidence available (0.0 to 1.0)
3. **Goal-Directed Cognition**: All cognitive processes are driven by goals with attention values:
   - **Priority (p)**: Current importance of pursuing the goal (0.0 to 1.0)
   - **Durability (d)**: How long the goal remains important (0.0 to 1.0)
4. **Self-Reflective Operation**: Continuous monitoring and adaptation of reasoning processes

### Core Data Model

1. **SemanticAtom**: Fundamental unit of knowledge representation with content and semantic embedding
2. **CognitiveItem**: Contextualized thoughts (beliefs, goals, queries) with associated truth and attention values

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

## Features

- **Non-Axiomatic Logic Principles**: Reasoning with uncertainty management and experience-grounded conclusions
- **Hybrid Cognition**: Combines symbolic logic with semantic vectors
- **Concurrency-Native**: Built on asynchronous, parallel processing
- **Verifiable Provenance**: Every derived item traces back to its source
- **Modular Abstraction**: Swappable modules with strict interfaces
- **Goal-Agentic Flow**: All cognition driven by goals
- **Trust-Aware Inference**: Knowledge weighted by credibility
- **Self-Reflective Operation**: System audits its own performance
- **Unified Interface Access**: Single interface for CLI and Web through WebSocket backend
- **Metaprogramming Capabilities**: System can represent and modify itself
- **Enhanced Usability**: Improved error handling, status monitoring, and user feedback
- **Schema Learning**: Automatic evolution of reasoning patterns through experience
- **Self-Development**: System can analyze its own performance and generate enhancements

## Available Interfaces

The system provides a unified interface that works seamlessly across both CLI and Web environments:

1. **Unified Command-Line Interface (CLI)** - Interactive text-based interface that connects to the WebSocket backend
2. **Unified Web Interface** - Browser-based graphical interface with real-time feedback and metaprogramming capabilities
3. **WebSocket API** - Programmatic interface for custom applications
4. **REST API** - HTTP-based interface for programmatic access

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

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Starting the System

```bash
# Run the main system (Unified CLI interface)
npm start

# Run the WebSocket server for web interface
npm run start:ws

# Run the combined HTTP + WebSocket server for web interface
npm run start:web

# Run the unified server with both WebSocket and REST interfaces
npm run start:unified
```

## Using the Unified Interface

### CLI Interface

To start the interactive CLI that connects to the WebSocket backend:

```bash
npm start
```

Once in the CLI, you can use commands like:
- `help` - Show help message with available commands and examples
- `status` - Show system status including agenda size and world model statistics
- `process <input>` - Process natural language input through non-axiomatic logic
- `core.getSystemStatus {}` - Direct access to system components

### Web Interface

To start the unified web interface:

```bash
npm run start:web
```

Once the server is running, open your browser and navigate to:

```
http://localhost:3000
```

The unified web interface provides several tabs for different functionalities:
1. **Cognitive Demos** - Pre-built examples for different domains
2. **Custom Input** - Enter your own text for processing
3. **System Status** - Real-time monitoring of system statistics
4. **Metaprogramming** - Direct component access and self-modification interface
5. **Help & Examples** - Comprehensive guide and input examples

### WebSocket API

The WebSocket API provides programmatic access to the cognitive system's capabilities. It uses a request-response pattern with JSON messages.

To connect to the WebSocket server:
```
ws://localhost:8080
```

Example usage:
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
    input: 'My cat seems sick after eating chocolate. What should I do considering uncertainty?'
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

### REST API

The system provides a REST API for programmatic access:

Endpoints:
- `GET /health` - Health check endpoint
- `GET /api/status` - Get server status information
- `POST /api/process` - Process input (asynchronous)

Example usage:
```bash
# Health check
curl http://localhost:3000/health

# Get server status
curl http://localhost:3000/api/status

# Process input
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": "My cat seems sick after eating chocolate. What should I do considering uncertainty?"}'
```

## Input Guidelines

The system can process different types of input through its non-axiomatic logic framework:

1. **Uncertain Statements** - Information with implicit uncertainty like "Chocolate is likely toxic to dogs"
2. **Probabilistic Questions** - Queries that require uncertainty-aware answers
3. **Conditional Commands** - Action requests with uncertainty considerations
4. **Exploratory Goals** - Complex objectives with uncertainty evaluation
5. **Adaptive Requests** - Multi-part requests that adapt based on uncertainty

### Best Practices

1. **Express Uncertainty Explicitly** - Include phrases like "likely", "possibly", "with high probability"
2. **Use Conditional Language** - Frame requests with "if-then" constructs
3. **Specify Confidence Requirements** - Indicate when you need high-confidence answers
4. **Break Down Complex Requests** - For complex tasks, consider breaking them into simpler sub-tasks
5. **Monitor System Status** - Use status commands to monitor system performance
6. **Be Specific and Clear** - Use clear, unambiguous language while acknowledging uncertainties

## Demos

The system includes several demos that showcase its capabilities:

- **Basic Demo** - Shows basic functionality of the system
- **Comprehensive Demo** - Demonstrates natural language processing and system status
- **Advanced Demo** - Showcases analogical reasoning capabilities
- **Adaptive Learning Demo** - Demonstrates the system's ability to evolve its knowledge base
- **Web Interface Demo** - Provides a user-friendly web interface

To run the demos:
1. Start the unified server: `npm run start:unified`
2. In another terminal, run: `node unifiedDemo.js`

## Self-Development Capabilities

The system can analyze its own test results and code coverage data to identify areas for improvement and generate enhancement proposals. It can:

- Monitor and analyze unit test results in real-time
- Parse and interpret code coverage reports
- Represent its own architecture and components as knowledge
- Generate enhancement proposals based on analysis
- Implement changes to its own codebase
- Learn new reasoning patterns from successful schema applications

## Schema Learning

The system can automatically learn and evolve its reasoning patterns through experience:

- Tracks schema usage patterns across reasoning cycles
- Identifies frequently successful schema applications
- Generalizes patterns into new schemas when success thresholds are met
- Adds new schemas to the world model for future use

## Metaprogramming and Self-Modification

The unified interface enables direct interaction with the system's self-representational capabilities:

1. **Component Introspection** - Examine internal state of cognitive modules
2. **Parameter Adjustment** - Modify system parameters that affect reasoning
3. **Schema Evolution** - Add or modify cognitive patterns that guide reasoning
4. **Reflection Control** - Configure how the system monitors and adapts itself