# Backend Testing Documentation

This document provides comprehensive information about the testing setup and coverage for the SpicyTodo Python backend API.

## Testing Framework

The backend uses the following testing tools:

- **pytest**: Python testing framework
- **pytest-asyncio**: Async testing support
- **pytest-cov**: Coverage reporting
- **httpx**: HTTP client for API testing
- **pytest-mock**: Mocking utilities
- **FastAPI TestClient**: FastAPI-specific testing utilities

## Test Structure

### Test Files Organization

```
tests/
├── __init__.py                    # Test package initialization
├── conftest.py                    # Pytest configuration and fixtures
├── test_models.py                 # Pydantic model tests
├── test_database.py               # Database operation tests
├── test_api_endpoints.py          # API endpoint tests
└── test_integration.py            # Integration and workflow tests
```

## Test Coverage

### Models Tested (`test_models.py`)

1. **Priority Enum**
   - Enum values and string conversion
   - Validation of priority levels

2. **TodoBase Model**
   - Field validation (text length, priority)
   - Default value handling
   - Required field validation

3. **TodoCreate Model**
   - Inheritance from TodoBase
   - Minimal data creation
   - Field validation

4. **TodoUpdate Model**
   - Partial field updates
   - Optional field handling
   - Validation of update fields

5. **Todo Model**
   - Complete todo instance creation
   - Required field validation
   - ID field validation

6. **TodoResponse Model**
   - Response model inheritance
   - Serialization testing

7. **TodoStats Model**
   - Statistics model validation
   - Required field handling

8. **ErrorResponse Model**
   - Error response structure
   - Optional error codes

### Database Operations Tested (`test_database.py`)

1. **Utility Functions**
   - ID generation (`_generate_id`)
   - Timestamp generation (`_get_current_timestamp`)

2. **Database Initialization**
   - Sample data initialization
   - Auto-initialization behavior

3. **CRUD Operations**
   - **Create**: `create_todo()` with various data combinations
   - **Read**: `get_todos()`, `get_todo_by_id()`
   - **Update**: `update_todo()` with partial and complete updates
   - **Delete**: `delete_todo()` for existing and non-existent todos

4. **Bulk Operations**
   - `clear_completed_todos()`
   - `get_todos_count()`

5. **Edge Cases**
   - Non-existent todo handling
   - Empty database operations
   - Data consistency checks

### API Endpoints Tested (`test_api_endpoints.py`)

1. **Root Endpoint** (`/`)
   - Welcome message
   - Version information

2. **Health Check** (`/health`)
   - Health status
   - Timestamp format

3. **Get Todos** (`GET /api/todos`)
   - Basic retrieval
   - Filtering by completion status
   - Search functionality
   - Priority filtering
   - Multiple filter combinations
   - Invalid filter handling

4. **Get Single Todo** (`GET /api/todos/{todo_id}`)
   - Existing todo retrieval
   - Non-existent todo handling
   - Invalid ID format handling

5. **Create Todo** (`POST /api/todos`)
   - Valid todo creation
   - Minimal data creation
   - Invalid data validation
   - Missing field handling
   - Text length validation

6. **Update Todo** (`PUT /api/todos/{todo_id}`)
   - Complete updates
   - Partial updates
   - Non-existent todo handling
   - Invalid data validation

7. **Delete Todo** (`DELETE /api/todos/{todo_id}`)
   - Existing todo deletion
   - Non-existent todo handling
   - Verification of deletion

8. **Toggle Todo** (`PATCH /api/todos/{todo_id}/toggle`)
   - Toggle completion status
   - Non-existent todo handling

9. **Statistics** (`GET /api/todos/stats/summary`)
   - Statistics calculation
   - Priority breakdown
   - Completion rate calculation

10. **Clear Completed** (`DELETE /api/todos/completed`)
    - Clearing completed todos
    - Count verification
    - Empty state handling

11. **CORS Headers**
    - CORS configuration testing

12. **Error Handling**
    - Invalid JSON handling
    - Missing content type
    - Unsupported HTTP methods

### Integration Tests (`test_integration.py`)

1. **Complete Todo Workflow**
   - Create → Read → Update → Delete lifecycle
   - Data consistency verification

2. **Multiple Todos Management**
   - Managing multiple todos with different priorities
   - Filtering and search combinations
   - Statistics accuracy
   - Bulk operations

3. **Toggle Workflow**
   - Multiple toggle operations
   - State verification

4. **Search and Filter Combinations**
   - Complex filter combinations
   - Search with multiple criteria

5. **Error Recovery**
   - Graceful error handling
   - Recovery from failed operations

6. **Concurrent Operations**
   - Simulated concurrent operations
   - Data consistency under load

7. **Data Consistency**
   - Timestamp consistency
   - Cross-endpoint data verification

## Running Tests

### Prerequisites

Install test dependencies:

```bash
pip install -r requirements.txt
```

### Test Commands

```bash
# Run all tests with full coverage
python run_tests.py

# Run tests with terminal coverage only
python run_tests.py --coverage-only

# Run specific test file
python run_tests.py test_models.py

# Run tests matching pattern
python run_tests.py test_api

# Run tests directly with pytest
pytest tests/

# Run with verbose output
pytest tests/ -v

# Run specific test class
pytest tests/test_models.py::TestTodoBase

# Run specific test method
pytest tests/test_models.py::TestTodoBase::test_valid_todo_base
```

### Coverage Commands

```bash
# Generate HTML coverage report
pytest tests/ --cov=. --cov-report=html

# Generate XML coverage report
pytest tests/ --cov=. --cov-report=xml

# Generate terminal coverage report
pytest tests/ --cov=. --cov-report=term-missing

# Set coverage threshold
pytest tests/ --cov=. --cov-fail-under=80
```

## Test Fixtures

### Available Fixtures (`conftest.py`)

1. **`client`**: FastAPI TestClient instance
2. **`clean_database`**: Clean database before each test
3. **`sample_todos`**: Sample todo data for testing
4. **`populated_database`**: Database populated with sample data
5. **`todo_create_data`**: Sample creation data
6. **`todo_update_data`**: Sample update data
7. **`invalid_todo_data`**: Invalid data for validation testing

### Using Fixtures

```python
def test_example(client, populated_database):
    """Example test using fixtures"""
    response = client.get("/api/todos")
    assert response.status_code == 200
    assert len(response.json()) == 3
```

## Coverage Reports

### Coverage Thresholds

The project maintains the following coverage thresholds:

- **Overall Coverage**: 80%
- **Models**: 95%+
- **Database Operations**: 90%+
- **API Endpoints**: 85%+
- **Integration Tests**: 80%+

### Coverage Reports Generated

- **HTML**: Interactive HTML report in `htmlcov/index.html`
- **XML**: Machine-readable format in `coverage.xml`
- **Terminal**: Console output with missing lines

## Testing Best Practices

### Unit Testing

1. **Test Behavior, Not Implementation**
   - Focus on what the function does, not how
   - Test public interfaces

2. **Use Descriptive Test Names**
   - Test names should describe the scenario
   - Include expected outcome

3. **Test Edge Cases**
   - Empty inputs
   - Invalid inputs
   - Boundary conditions

4. **Mock External Dependencies**
   - Use fixtures for consistent test data
   - Mock external services when needed

### API Testing

1. **Test All HTTP Methods**
   - GET, POST, PUT, DELETE, PATCH
   - Test request/response handling

2. **Test Error Scenarios**
   - Invalid data
   - Missing resources
   - Server errors

3. **Test Response Formats**
   - JSON structure
   - Status codes
   - Headers

### Integration Testing

1. **Test Complete Workflows**
   - End-to-end scenarios
   - Data consistency
   - State transitions

2. **Test Real-World Usage**
   - Multiple operations
   - Error recovery
   - Performance considerations

## Mocking Strategy

### Database Mocking

```python
@pytest.fixture(scope="function")
def clean_database():
    """Clean database before each test"""
    global _todos_db
    _todos_db.clear()
    yield
    _todos_db.clear()
```

### API Client Mocking

```python
def test_api_call(client, mocker):
    """Example of mocking external API calls"""
    mock_response = mocker.Mock()
    mock_response.json.return_value = {"status": "success"}
    
    # Test implementation
```

## Debugging Tests

### Common Issues

1. **Database State**
   - Use `clean_database` fixture
   - Ensure proper test isolation

2. **Async Operations**
   - Use `pytest-asyncio` for async tests
   - Proper async/await handling

3. **Test Data**
   - Use fixtures for consistent data
   - Avoid hardcoded test data

### Debug Commands

```bash
# Run tests with debug output
pytest tests/ -v -s

# Run specific test with debug
pytest tests/test_models.py::TestTodoBase::test_valid_todo_base -v -s

# Run tests with pdb debugger
pytest tests/ --pdb

# Run tests with coverage and debug
pytest tests/ --cov=. --cov-report=term-missing -v -s
```

## Continuous Integration

### GitHub Actions Integration

The tests are configured to run in CI/CD pipelines with:

- Coverage reporting
- Test result publishing
- Artifact collection

### Pre-commit Hooks

Consider adding pre-commit hooks:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: python -m pytest tests/
        language: system
        pass_filenames: false
        always_run: true
```

## Performance Testing

### Load Testing Considerations

While not included in the current test suite, consider:

1. **Response Time Testing**
   - API endpoint response times
   - Database operation performance

2. **Concurrent Request Testing**
   - Multiple simultaneous requests
   - Resource contention

3. **Memory Usage Testing**
   - Memory leaks detection
   - Resource cleanup

## Future Improvements

### Potential Enhancements

1. **Property-Based Testing**
   - Hypothesis library integration
   - Random data generation

2. **Performance Testing**
   - Load testing with locust
   - Memory profiling

3. **Security Testing**
   - Input validation testing
   - SQL injection prevention

4. **API Documentation Testing**
   - OpenAPI schema validation
   - Documentation accuracy

## Troubleshooting

### Common Problems

1. **Import Errors**
   - Check PYTHONPATH
   - Verify module structure

2. **Database Issues**
   - Use clean_database fixture
   - Check global state

3. **Coverage Issues**
   - Verify file patterns in pytest.ini
   - Check coverage configuration

### Getting Help

- Check pytest documentation: https://docs.pytest.org/
- FastAPI testing docs: https://fastapi.tiangolo.com/tutorial/testing/
- Coverage.py docs: https://coverage.readthedocs.io/
