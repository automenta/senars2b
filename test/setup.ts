// Set timeout for all tests
jest.setTimeout(5000);

// Mock expensive operations
jest.mock('@/services/embeddingService', () => require('./unit/__mocks__/embeddingService'));

// Mock console.log, console.info, console.warn to reduce test output noise
global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};