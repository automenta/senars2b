# Code Guidelines

## Core Principles

- **Elegance**
    - Abstract and modularize complex functionality
    - Use concise syntax (ternary operators, switch statements, etc.)
    - Consolidate related functionality
    - Eliminate code duplication (DRY principle)

- **Self-Documentation**
    - Rely on meaningful identifiers rather than comments
    - Write code that clearly expresses its intent
    - Structure code to minimize the need for explanatory comments

- **Professional Quality**
    - Maintain production-grade code quality
    - Prioritize correctness and performance over educational explanations
    - Follow established patterns and conventions

## Implementation Standards

- **Type Safety**: Use TypeScript's type system to catch errors at compile time
- **Immutability**: Prefer immutable data structures where possible
- **Pure Functions**: Write pure functions when feasible to enable easier testing
- **Error Handling**: Implement comprehensive error handling with meaningful messages
- **Performance**: Optimize for efficiency without sacrificing readability

## Testing Requirements

- **Comprehensive Coverage**: All core functionality must be unit tested
- **Edge Cases**: Tests must cover boundary conditions and error scenarios
- **Readability**: Tests should clearly demonstrate expected behavior
- **Maintainability**: Use test utilities to reduce duplication (see `test/unit/README.md`)

## Documentation Standards

- **API Documentation**: All public interfaces must be documented
- **Inline Documentation**: Use JSDoc/TSDoc for complex algorithms
- **External Documentation**: Maintain README.md and other markdown files