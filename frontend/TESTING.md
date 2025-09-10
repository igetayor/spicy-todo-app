# Frontend Testing Documentation

This document provides comprehensive information about the testing setup and coverage for the SpicyTodo frontend application.

## Testing Framework

The frontend uses the following testing tools:

- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

## Test Structure

### Test Files Organization

```
src/
├── __tests__/
│   └── App.test.js                 # Integration tests for main App component
├── components/
│   └── __tests__/
│       ├── TodoForm.test.js         # TodoForm component tests
│       ├── TodoList.test.js         # TodoList component tests
│       ├── TodoItem.test.js         # TodoItem component tests
│       ├── TodoFilter.test.js       # TodoFilter component tests
│       ├── TodoStats.test.js        # TodoStats component tests
│       └── EmptyState.test.js       # EmptyState component tests
├── services/
│   └── __tests__/
│       └── api.test.js              # API service tests
├── setupTests.js                    # Jest setup configuration
└── test-utils.js                    # Test utilities and helpers
```

## Test Coverage

### Components Tested

1. **TodoForm Component**
   - Form rendering and validation
   - Input handling and submission
   - Priority selection
   - Keyboard interactions (Enter key)
   - Form state management
   - Input length limits

2. **TodoItem Component**
   - Todo display and formatting
   - Edit mode functionality
   - Save/cancel operations
   - Keyboard shortcuts (Enter/Escape)
   - Priority emoji display
   - Date formatting
   - Action buttons (edit/delete)

3. **TodoList Component**
   - Empty state handling
   - Todo rendering
   - Props passing to TodoItem
   - List structure maintenance

4. **TodoFilter Component**
   - Filter button functionality
   - Search input handling
   - Clear completed todos
   - Active state management
   - Tooltip display

5. **TodoStats Component**
   - Statistics calculation
   - Progress percentage
   - Priority breakdown
   - Edge case handling (empty arrays, null values)

6. **EmptyState Component**
   - Empty state display
   - Component structure
   - Accessibility features

### Services Tested

1. **API Service**
   - HTTP request handling
   - Error handling
   - All CRUD operations
   - Query parameter building
   - Environment configuration

### Integration Tests

1. **App Component**
   - Complete user workflows
   - Component interactions
   - API integration
   - Error handling
   - Loading states

## Running Tests

### Available Scripts

```bash
# Run tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (no watch mode)
npm run test:ci
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test TodoForm.test.js

# Run tests matching pattern
npm test -- --testNamePattern="renders correctly"

# Run tests in specific directory
npm test -- src/components/__tests__/
```

## Test Utilities

### Mock Data

The `test-utils.js` file provides:

- **mockTodos**: Sample todo data for testing
- **mockApiService**: Mocked API service methods
- **createMockTodo**: Helper to create test todos
- **renderWithProviders**: Custom render function
- **user**: Pre-configured user event setup

### Helper Functions

- **waitForAsync**: Wait for async operations
- **mockFetch**: Mock fetch responses
- **mockFetchError**: Mock fetch errors
- **resetMocks**: Reset all mocks
- **simulateApiDelay**: Simulate API delays

## Coverage Reports

### Coverage Thresholds

The project maintains the following coverage thresholds:

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Reports Generated

- **Text**: Console output
- **HTML**: Interactive HTML report in `coverage/lcov-report/index.html`
- **LCOV**: For CI/CD integration
- **JSON**: Machine-readable format

## Testing Best Practices

### Component Testing

1. **Test Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or methods

2. **Use Semantic Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Test User Interactions**
   - Use `userEvent` for realistic user interactions
   - Test keyboard shortcuts and accessibility

4. **Mock External Dependencies**
   - Mock API calls and external services
   - Use consistent mock data

### API Testing

1. **Test All HTTP Methods**
   - GET, POST, PUT, DELETE, PATCH
   - Test request/response handling

2. **Test Error Scenarios**
   - Network errors
   - HTTP error status codes
   - Invalid responses

3. **Test Edge Cases**
   - Empty responses
   - Large datasets
   - Invalid input data

### Integration Testing

1. **Test Complete User Flows**
   - End-to-end scenarios
   - Component interactions
   - State management

2. **Test Error Handling**
   - API failures
   - Network issues
   - Invalid user input

## Mocking Strategy

### API Service Mocking

```javascript
// Mock successful API response
mockApiService.getTodos.mockResolvedValue(mockTodos);

// Mock API error
mockApiService.getTodos.mockRejectedValue(new Error('API Error'));

// Mock delayed response
mockApiService.getTodos.mockImplementation(() => 
  new Promise(resolve => setTimeout(() => resolve(mockTodos), 100))
);
```

### Component Mocking

```javascript
// Mock child components
jest.mock('../TodoItem', () => {
  return function MockTodoItem({ todo }) {
    return <div data-testid={`todo-item-${todo.id}`}>{todo.text}</div>;
  };
});
```

## Debugging Tests

### Common Issues

1. **Async Operations**
   - Use `waitFor` for async operations
   - Ensure proper cleanup in `afterEach`

2. **Mock Cleanup**
   - Clear mocks between tests
   - Reset mock implementations

3. **Component Updates**
   - Use `act` for state updates
   - Wait for re-renders

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with debug info
npm test -- --detectOpenHandles

# Run specific test with debug
npm test -- --testNamePattern="specific test" --verbose
```

## Continuous Integration

### GitHub Actions Integration

The tests are configured to run in CI/CD pipelines with:

- Coverage reporting
- Test result publishing
- Artifact collection

### Pre-commit Hooks

Consider adding pre-commit hooks to run tests:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:ci"
    }
  }
}
```

## Future Improvements

### Potential Enhancements

1. **Visual Regression Testing**
   - Add screenshot testing
   - Visual diff detection

2. **Performance Testing**
   - Component render time testing
   - Memory leak detection

3. **Accessibility Testing**
   - Automated a11y testing
   - Screen reader testing

4. **E2E Testing**
   - Cypress or Playwright integration
   - Full user journey testing

## Troubleshooting

### Common Problems

1. **Tests Timing Out**
   - Increase timeout in Jest config
   - Check for unresolved promises

2. **Mock Not Working**
   - Ensure mock is defined before import
   - Check mock implementation

3. **Coverage Not Generated**
   - Verify Jest configuration
   - Check file patterns in `collectCoverageFrom`

### Getting Help

- Check Jest documentation: https://jestjs.io/docs/getting-started
- React Testing Library docs: https://testing-library.com/docs/react-testing-library/intro/
- Test utilities reference in `src/test-utils.js`
