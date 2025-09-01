module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]sx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json'
            }
        ]
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Mock the embedding service to avoid expensive operations
        '@/services/embeddingService': '<rootDir>/test/unit/__mocks__/embeddingService'
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(@xenova/transformers|langchain|@langchain/community))"
    ],
    testMatch: ['**/test/unit/**/*.test.ts', '**/test/unit/**/*.test.tsx'],
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
    verbose: false,
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    // Added optimizations
    maxWorkers: '50%',
    testTimeout: 5000
};