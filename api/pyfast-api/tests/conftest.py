"""
Pytest configuration and fixtures for the Spicy Todo API tests
"""

import pytest
import os
from fastapi.testclient import TestClient
from datetime import datetime
import uuid
from main import app
from database import _todos_db, initialize_sample_data, clear_completed_todos, _use_persistent_storage
from models import Todo, TodoCreate, TodoUpdate, Priority

# Ensure tests run with in-memory storage by default
# This prevents tests from accidentally using persistent storage
@pytest.fixture(autouse=True, scope="session")
def setup_test_environment():
    """Setup test environment to use in-memory storage"""
    # Clear any existing DATABASE_URL for tests
    if "DATABASE_URL" in os.environ:
        del os.environ["DATABASE_URL"]
    yield
    # Restore original DATABASE_URL if it existed
    # (This is handled by the test runner)


@pytest.fixture(scope="function")
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture(scope="function")
def clean_database():
    """Clean the database before each test"""
    if _use_persistent_storage():
        # For persistent storage, we need to clear the database tables
        from db import engine, get_db_session
        from orm_models import TodoORM
        from sqlalchemy import delete
        
        with next(get_db_session()) as db:
            db.execute(delete(TodoORM))
            db.commit()
        yield
        # Clean up after test
        with next(get_db_session()) as db:
            db.execute(delete(TodoORM))
            db.commit()
    else:
        # For in-memory storage, use the existing approach
        global _todos_db
        _todos_db.clear()
        yield
        _todos_db.clear()


@pytest.fixture(scope="function")
def sample_todos():
    """Create sample todos for testing"""
    todos = []
    for i in range(3):
        todo = Todo(
            id=str(uuid.uuid4()),
            text=f"Test todo {i+1}",
            priority=Priority.MEDIUM,
            completed=i % 2 == 0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        todos.append(todo)
    return todos


@pytest.fixture(scope="function")
def populated_database(sample_todos):
    """Populate the database with sample todos"""
    if _use_persistent_storage():
        # For persistent storage, insert into database
        from db import get_db_session
        from orm_models import TodoORM
        
        with next(get_db_session()) as db:
            for todo in sample_todos:
                db_todo = TodoORM(
                    id=todo.id,
                    text=todo.text,
                    priority=todo.priority.value,
                    completed=todo.completed,
                    created_at=todo.created_at,
                    updated_at=todo.updated_at
                )
                db.add(db_todo)
            db.commit()
        return sample_todos
    else:
        # For in-memory storage, use the existing approach
        global _todos_db
        _todos_db.extend(sample_todos)
        return sample_todos


@pytest.fixture
def todo_create_data():
    """Sample todo creation data"""
    return {
        "text": "New test todo",
        "priority": "high",
        "completed": False
    }


@pytest.fixture
def todo_update_data():
    """Sample todo update data"""
    return {
        "text": "Updated test todo",
        "priority": "low",
        "completed": True
    }


@pytest.fixture
def invalid_todo_data():
    """Invalid todo data for testing validation"""
    return {
        "text": "",  # Empty text should fail validation
        "priority": "invalid_priority",
        "completed": "not_a_boolean"
    }
