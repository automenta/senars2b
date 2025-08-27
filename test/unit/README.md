# Unit Test Utilities

This directory contains utility functions to help reduce code duplication in unit tests and improve maintainability.

## Available Utilities

### `createCognitiveItem(overrides: Partial<CognitiveItem> = {})`

Creates a basic CognitiveItem with default values that can be overridden.

```typescript
// Create a basic cognitive item
const item = createCognitiveItem();

// Create a cognitive item with specific overrides
const item = createCognitiveItem({
  type: 'GOAL',
  goal_status: 'active'
});
```

### `createBeliefItem(overrides: Partial<CognitiveItem> = {})`

Creates a CognitiveItem with truth values (for beliefs).

```typescript
const belief = createBeliefItem({
  truth: { frequency: 0.9, confidence: 0.8 }
});
```

### `createGoalItem(overrides: Partial<CognitiveItem> = {})`

Creates a CognitiveItem with goal status (for goals).

```typescript
const goal = createGoalItem({
  label: 'My specific goal'
});
```

### `createAttentionValue(overrides: Partial<AttentionValue> = {})`

Creates a basic AttentionValue.

```typescript
const attention = createAttentionValue({
  priority: 0.9,
  durability: 0.8
});
```

### `createTruthValue(overrides: Partial<TruthValue> = {})`

Creates a basic TruthValue.

```typescript
const truth = createTruthValue({
  frequency: 0.7,
  confidence: 0.9
});
```

### `createMockSchema(overrides: Partial<CognitiveSchema> = {})`

Creates a mock CognitiveSchema with a jest mock function for `apply`.

```typescript
const schema = createMockSchema();
```

### `createSemanticAtom(overrides: Partial<SemanticAtom> = {})`

Creates a SemanticAtom with default values.

```typescript
const atom = createSemanticAtom({
  content: 'Specific content for this atom'
});
```

## Usage

Import the utilities in your test files:

```typescript
import { 
  createCognitiveItem, 
  createBeliefItem, 
  createGoalItem,
  createAttentionValue,
  createTruthValue,
  createMockSchema,
  createSemanticAtom
} from './testUtils';
```