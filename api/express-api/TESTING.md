# 🧪 SpicyTodo Express API - Testing Guide

This document provides comprehensive information about testing the SpicyTodo Express API.

## 📋 Overview

The Express API includes a comprehensive test suite with 80%+ coverage across:
- **Models**: Todo class, validation, business logic
- **Routes**: All API endpoints, error handling, edge cases
- **Database**: CRUD operations, queries, statistics
- **Middleware**: Error handling, request logging

## 🚀 Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/models/Todo.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="should create"
```

### Test Output

```bash
# Example test output
 PASS  tests/models/Todo.test.js
 PASS  tests/routes/todos.test.js
 PASS  tests/routes/health.test.js
 PASS  tests/database/database.test.js

Test Suites: 4 passed, 4 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.847s
Coverage:    85.2%
```

## 📊 Test Coverage

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage by Module

```
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|----------|---------|---------|------------------
src/models/             |     100 |      100 |     100 |     100 |
  Todo.js               |     100 |      100 |     100 |     100 |
  validation.js         |     100 |      100 |     100 |     100 |
src/routes/             |      95 |       90 |     100 |      95 |
  todos.js              |      95 |       90 |     100 |      95 | 45,67
  health.js             |     100 |      100 |     100 |     100 |
src/database/           |      92 |       85 |     100 |      92 |
  database.js           |      92 |       85 |     100 |      92 | 123,156
src/middleware/         |      90 |       80 |     100 |      90 |
  errorHandler.js       |      90 |       80 |     100 |      90 | 34,45
  requestLogger.js      |     100 |      100 |     100 |     100 |
------------------------|---------|----------|---------|---------|
All files               |      94 |       89 |     100 |      94 |
```

## 🧩 Test Structure

### Test Organization

```
tests/
├── setup.js                 # Global test setup
├── models/
│   └── Todo.test.js         # Todo model tests
├── routes/
│   ├── todos.test.js        # Todo API endpoint tests
│   └── health.test.js       # Health check tests
└── database/
    └── database.test.js     # Database operation tests
```

### Test Categories

#### 1. Unit Tests (`tests/models/`)
- **Todo Model**: Constructor, validation, business logic
- **Validation Schemas**: Joi validation rules
- **Helper Functions**: Utility functions and methods

#### 2. Integration Tests (`tests/routes/`)
- **API Endpoints**: All HTTP endpoints
- **Request/Response**: Status codes, response formats
- **Error Handling**: Invalid inputs, edge cases
- **Authentication**: Security middleware (future)

#### 3. Database Tests (`tests/database/`)
- **CRUD Operations**: Create, Read, Update, Delete
- **Queries**: Filtering, searching, statistics
- **Data Integrity**: Validation, constraints
- **Performance**: Query timing, optimization

## 📝 Writing Tests

### Test File Structure

```javascript
describe('Module Name', () => {
  // Setup and teardown
  beforeAll(() => {
    // One-time setup
  });

  afterAll(() => {
    // One-time cleanup
  });

  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature Group', () => {
    test('should do something specific', async () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Test Naming Conventions

```javascript
// Good test names
test('should return user when valid ID is provided', () => {});
test('should throw error when invalid data is passed', () => {});
test('should filter todos by completion status', () => {});

// Bad test names
test('works', () => {});
test('test1', () => {});
test('user', () => {});
```

### Assertion Patterns

```javascript
// Basic assertions
expect(result).toBe(expectedValue);
expect(result).toEqual(expectedObject);
expect(result).toBeNull();
expect(result).toBeUndefined();
expect(result).toBeTruthy();
expect(result).toBeFalsy();

// Array assertions
expect(array).toHaveLength(3);
expect(array).toContain(item);
expect(array).not.toContain(item);

// Object assertions
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', value);

// Async assertions
await expect(asyncFunction()).resolves.toBe(value);
await expect(asyncFunction()).rejects.toThrow('Error message');

// HTTP assertions (with supertest)
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('data');
expect(response.headers['content-type']).toMatch(/json/);
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',  // Exclude main app file
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true
};
```

### Test Setup (`tests/setup.js`)

```javascript
// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '8001';
process.env.USE_PERSISTENT_STORAGE = 'false';

// Mock external dependencies
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);
```

## 🎯 Test Examples

### Model Tests

```javascript
describe('Todo Model', () => {
  test('should create todo with default values', () => {
    const todo = new Todo();
    
    expect(todo.id).toBeDefined();
    expect(todo.text).toBe('');
    expect(todo.priority).toBe('medium');
    expect(todo.completed).toBe(false);
  });

  test('should validate todo data', () => {
    const todo = new Todo({ text: '' });
    const validation = todo.validate();
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Todo text is required');
  });
});
```

### Route Tests

```javascript
describe('POST /api/todos', () => {
  test('should create a new todo', async () => {
    const todoData = {
      text: 'New test todo',
      priority: 'high'
    };

    const response = await request(app)
      .post('/api/todos')
      .send(todoData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.text).toBe(todoData.text);
  });

  test('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ text: '' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Bad Request');
  });
});
```

### Database Tests

```javascript
describe('Database Operations', () => {
  test('should create and retrieve todo', async () => {
    const todoData = { text: 'Test todo', priority: 'medium' };
    
    const createdTodo = await database.createTodo(todoData);
    const retrievedTodo = await database.getTodoById(createdTodo.id);
    
    expect(retrievedTodo).toBeDefined();
    expect(retrievedTodo.text).toBe(todoData.text);
  });
});
```

## 🐛 Debugging Tests

### Running Individual Tests

```bash
# Run specific test file
npm test -- tests/models/Todo.test.js

# Run specific test by name
npm test -- --testNamePattern="should create todo"

# Run tests in verbose mode
npm test -- --verbose

# Run tests without coverage (faster)
npm test -- --coverage=false
```

### Debug Mode

```bash
# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with debugger
node --inspect-brk node_modules/.bin/jest --runInBand tests/models/Todo.test.js
```

### Test Output Debugging

```javascript
// Add console.log for debugging
test('should create todo', () => {
  const todo = new Todo({ text: 'Debug test' });
  console.log('Todo created:', todo.toJSON());
  expect(todo.text).toBe('Debug test');
});

// Use --verbose flag for detailed output
npm test -- --verbose
```

## 📈 Performance Testing

### Load Testing (Optional)

```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:8000/api/health
```

### Memory Testing

```bash
# Run tests with memory profiling
node --expose-gc --max-old-space-size=4096 node_modules/.bin/jest
```

## 🔍 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Upload coverage
      uses: codecov/codecov-action@v1
      with:
        file: ./coverage/lcov.info
```

## 🎯 Best Practices

### Test Organization
- **One test file per module**
- **Group related tests with `describe`**
- **Use descriptive test names**
- **Keep tests independent**

### Test Data
- **Use realistic test data**
- **Create test fixtures**
- **Clean up after tests**
- **Use factories for complex objects**

### Assertions
- **Test one thing per test**
- **Use specific assertions**
- **Test both success and failure cases**
- **Include edge cases**

### Performance
- **Mock external dependencies**
- **Use database transactions for isolation**
- **Parallelize tests when possible**
- **Keep tests fast (< 100ms each)**

## 🚨 Common Issues

### Test Failures

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with no cache
npm test -- --no-cache

# Reset node_modules
rm -rf node_modules package-lock.json
npm install
```

### Coverage Issues

```bash
# Generate coverage without running tests
npm test -- --coverage --passWithNoTests

# Check coverage thresholds
npm test -- --coverage --coverageThreshold='{"global":{"statements":80}}'
```

### Database Test Issues

```bash
# Reset test database
rm -rf data/test.db

# Use in-memory database for tests
export USE_PERSISTENT_STORAGE=false
npm test
```

---

🧪 **Happy Testing!** 🧪
