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

### Running the System

```bash
# Run the main system
npm start

# Run basic component tests
npx ts-node src/basicTest.ts

# Run comprehensive system test
npx ts-node src/comprehensiveTest.ts

# Run full system test
npx ts-node src/fullSystemTest.ts

# Run benchmark
npx ts-node src/benchmark.ts
```

## Key Features

- **Hybrid Cognition**: Combines symbolic logic with semantic vectors
- **Concurrency-Native**: Built on asynchronous, parallel processing
- **Verifiable Provenance**: Every derived item traces back to its source
- **Modular Abstraction**: Swappable modules with strict interfaces
- **Goal-Agentic Flow**: All cognition driven by goals
- **Trust-Aware Inference**: Knowledge weighted by credibility
- **Self-Reflective Operation**: System audits its own performance

## Implementation Status

✅ Complete implementation of all core components according to specification.

## Test Coverage

The system includes comprehensive unit tests covering:

- All core components (Agenda, WorldModel, CognitiveCore, etc.)
- All pluggable modules (AttentionModule, ResonanceModule, etc.)
- Domain-specific scenarios (Medical, Financial, Educational, Legal, Environmental, Cybersecurity)
- Integration tests verifying component interactions

See [TEST_SUMMARY.md](TEST_SUMMARY.md) for detailed test coverage information.