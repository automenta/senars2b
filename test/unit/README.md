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

### `createTaskItem(overrides: Partial<CognitiveItem> = {})`

Creates a CognitiveItem with task metadata (for tasks).

```typescript
const task = createTaskItem({
  task_metadata: {
    status: 'pending',
    priority_level: 'high'
  }
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
  domain: 'medicine',
  source: 'medical_journal',
  trust_score: 0.95
});
```

### `createTaskMetadata(overrides: Partial<TaskMetadata> = {})`

Creates TaskMetadata with default values.

```typescript
const taskMetadata = createTaskMetadata({
  status: 'completed',
  priority_level: 'critical',
  completion_percentage: 100
});
```

## Usage

Import the utilities in your test files:

```typescript
import { 
  createCognitiveItem, 
  createBeliefItem, 
  createGoalItem,
  createTaskItem,
  createAttentionValue,
  createTruthValue,
  createMockSchema,
  createSemanticAtom,
  createCognitiveMetadata,
  createTaskMetadata
} from '../testUtils';
```

## Best Practices

1. **Use specific creators when possible**: Use `createBeliefItem()` instead of `createCognitiveItem({type: 'BELIEF'})`
   for better readability
2. **Override only what you need**: Rely on default values for properties that aren't relevant to your test
3. **Combine utilities**: Use multiple utilities together to create complex test scenarios
4. **Consistent test data**: Using these utilities ensures consistent test data across your test suite
5. **Test both positive and negative cases**: Create both valid and invalid data to thoroughly test your code

## Example Test Structure

```typescript
import { 
  createBeliefItem, 
  createGoalItem, 
  createTaskItem, 
  createAttentionValue,
  createTruthValue
} from '../testUtils';

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
  
  it('should handle task items with proper metadata', () => {
    const task = createTaskItem({
      task_metadata: {
        status: 'pending',
        priority_level: 'high',
        dependencies: ['task-1', 'task-2']
      }
    });
    
    // Test implementation
  });
});

describe('AttentionModule', () => {
  it('should correctly calculate priority for different attention values', () => {
    const lowAttention = createAttentionValue({ priority: 0.1, durability: 0.2 });
    const highAttention = createAttentionValue({ priority: 0.9, durability: 0.8 });
    
    // Test implementation
  });
});

describe('BeliefRevisionEngine', () => {
  it('should properly merge truth values', () => {
    const truth1 = createTruthValue({ frequency: 0.7, confidence: 0.6 });
    const truth2 = createTruthValue({ frequency: 0.8, confidence: 0.9 });
    
    // Test implementation
  });
});
```

## Test Data Consistency

These utilities ensure that test data is consistent across the test suite by:

1. **Using realistic default values** that match the expected ranges in the system
2. **Maintaining proper relationships** between related properties
3. **Following the same data structures** used in the actual system
4. **Providing predictable identifiers** for easier debugging

This consistency makes tests more reliable and easier to maintain as the system evolves.