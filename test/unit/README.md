# Unit Test Utilities

This directory contains utility functions to help reduce code duplication in unit tests and improve maintainability.

These utilities are designed to create consistent, predictable test data with minimal boilerplate code. All functions
accept an optional `overrides` parameter that allows you to customize specific properties while maintaining default
values for others.

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

### `createCognitiveMetadata(overrides: Partial<CognitiveMetadata> = {})`

Creates basic CognitiveMetadata with default values.

```typescript
const metadata = createCognitiveMetadata({
  domain: 'medical',
  source: 'medical_journal',
  trust_score: 0.95
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
  createSemanticAtom,
  createCognitiveMetadata
} from './testUtils';
```

## Best Practices

1. **Use specific creators when possible**: Use `createBeliefItem()` instead of `createCognitiveItem({type: 'BELIEF'})`
   for better readability
2. **Override only what you need**: Rely on default values for properties that aren't relevant to your test
3. **Combine utilities**: Use multiple utilities together to create complex test scenarios
4. **Consistent test data**: Using these utilities ensures consistent test data across your test suite

## Example Test Structure

```typescript
import { createBeliefItem, createGoalItem, createCognitiveMetadata } from './testUtils';

describe('CognitiveCore', () => {
  it('should process beliefs with high confidence', () => {
    const belief = createBeliefItem({
      truth: { frequency: 0.9, confidence: 0.95 }
    });
    
    // Test implementation
  });
  
  it('should prioritize goals with high durability', () => {
    const goal = createGoalItem({
      attention: { priority: 0.5, durability: 0.9 }
    });
    
    // Test implementation
  });
});

describe('DomainSpecificTests', () => {
  it('should handle domain-specific knowledge', () => {
    const metadata = createCognitiveMetadata({
      domain: 'medicine',
      source: 'medical_journal',
      trust_score: 0.95
    });
    
    // Test implementation
  });
});
```