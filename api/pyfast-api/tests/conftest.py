"""
Pytest configuration and fixtures for the Spicy Todo API tests
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import uuid
from main import app
from database import _todos_db, initialize_sample_data, clear_completed_todos
from models import Todo, TodoCreate, TodoUpdate, Priority


@pytest.fixture(scope="function")
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture(scope="function")
def clean_database():
    """Clean the database before each test"""
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
