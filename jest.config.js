module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Map dist paths to src paths for ts-jest to resolve
    '^../../dist/types$': '<rootDir>/src/interfaces/types.ts',
    '^../../dist/core/(.*)$': '<rootDir>/src/core/$1',
    '^../../dist/modules/(.*)$': '<rootDir>/src/modules/$1',
    '^../../dist/actions/(.*)$': '<rootDir>/src/actions/$1',
    // Handle the specific top-level files that are imported directly
    '^../../dist/cognitiveCore$': '<rootDir>/src/core/cognitiveCore.ts',
    '^../../dist/perceptionSubsystem$': '<rootDir>/src/modules/perceptionSubsystem.ts',
    '^../../dist/beliefRevisionEngine$': '<rootDir>/src/core/beliefRevisionEngine.ts',
    '^../../dist/worldModel$': '<rootDir>/src/core/worldModel.ts',
    '^../../dist/resonanceModule$': '<rootDir>/src/core/resonanceModule.ts',
    '^../../dist/agenda$': '<rootDir>/src/core/agenda.ts',
    '^../../dist/attentionModule$': '<rootDir>/src/core/attentionModule.ts',
    '^../../dist/schemaMatcher$': '<rootDir>/src/core/schemaMatcher.ts',
    '^../../dist/goalTreeManager$': '<rootDir>/src/core/goalTreeManager.ts',
    '^../../dist/actionSubsystem$': '<rootDir>/src/actions/actionSubsystem.ts',
  },
  testMatch: ['**/test/unit/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/*Test.ts',
    '!src/benchmark.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};