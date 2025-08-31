module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    '\\.module\\.css$': '<rootDir>/test/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@xenova/transformers|langchain|@langchain/community))',
  ],
  testMatch: ['**/test/unit/**/*.test.ts', '**/test/unit/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/*Test.ts',
    '!src/benchmark.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
