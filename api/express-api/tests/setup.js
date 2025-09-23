// Test setup file
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '8001';
process.env.USE_PERSISTENT_STORAGE = 'false';
process.env.LOG_LEVEL = 'error';

// Mock winston logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  logRequest: jest.fn(),
  logApiRequest: jest.fn(),
  logDatabaseOperation: jest.fn(),
  logBusinessLogic: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);
