"""
Tests for Pydantic models and validation
"""

import pytest
from datetime import datetime
import uuid
from pydantic import ValidationError
from models import (
    Priority, TodoBase, TodoCreate, TodoUpdate, Todo, TodoResponse, 
    TodoStats, ErrorResponse
)


class TestPriority:
    """Test Priority enum"""
    
    def test_priority_values(self):
        """Test that priority enum has correct values"""
        assert Priority.LOW == "low"
        assert Priority.MEDIUM == "medium"
        assert Priority.HIGH == "high"
    
    def test_priority_string_conversion(self):
        """Test priority string conversion"""
        assert str(Priority.LOW) == "low"
        assert str(Priority.MEDIUM) == "medium"
        assert str(Priority.HIGH) == "high"


class TestTodoBase:
    """Test TodoBase model"""
    
    def test_valid_todo_base(self):
        """Test creating a valid TodoBase instance"""
        todo = TodoBase(
            text="Test todo",
            priority=Priority.MEDIUM,
            completed=False
        )
        assert todo.text == "Test todo"
        assert todo.priority == Priority.MEDIUM
        assert todo.completed is False
    
    def test_todo_base_defaults(self):
        """Test TodoBase default values"""
        todo = TodoBase(text="Test todo")
        assert todo.text == "Test todo"
        assert todo.priority == Priority.MEDIUM
        assert todo.completed is False
    
    def test_todo_base_text_validation(self):
        """Test text field validation"""
        # Valid text
        todo = TodoBase(text="Valid text")
        assert todo.text == "Valid text"
        
        # Empty text should fail
        with pytest.raises(ValidationError):
            TodoBase(text="")
        
        # Text too long should fail
        with pytest.raises(ValidationError):
            TodoBase(text="x" * 501)
    
    def test_todo_base_priority_validation(self):
        """Test priority field validation"""
        # Valid priorities
        for priority in Priority:
            todo = TodoBase(text="Test", priority=priority)
            assert todo.priority == priority
        
        # Invalid priority should fail
        with pytest.raises(ValidationError):
            TodoBase(text="Test", priority="invalid")


class TestTodoCreate:
    """Test TodoCreate model"""
    
    def test_todo_create_inheritance(self):
        """Test that TodoCreate inherits from TodoBase"""
        todo = TodoCreate(
            text="Create test",
            priority=Priority.HIGH,
            completed=True
        )
        assert todo.text == "Create test"
        assert todo.priority == Priority.HIGH
        assert todo.completed is True
    
    def test_todo_create_minimal(self):
        """Test creating TodoCreate with minimal data"""
        todo = TodoCreate(text="Minimal todo")
        assert todo.text == "Minimal todo"
        assert todo.priority == Priority.MEDIUM
        assert todo.completed is False


class TestTodoUpdate:
    """Test TodoUpdate model"""
    
    def test_todo_update_all_fields(self):
        """Test TodoUpdate with all fields"""
        update = TodoUpdate(
            text="Updated text",
            priority=Priority.HIGH,
            completed=True
        )
        assert update.text == "Updated text"
        assert update.priority == Priority.HIGH
        assert update.completed is True
    
    def test_todo_update_partial(self):
        """Test TodoUpdate with partial fields"""
        update = TodoUpdate(text="Only text updated")
        assert update.text == "Only text updated"
        assert update.priority is None
        assert update.completed is None
    
    def test_todo_update_empty(self):
        """Test TodoUpdate with no fields"""
        update = TodoUpdate()
        assert update.text is None
        assert update.priority is None
        assert update.completed is None
    
    def test_todo_update_validation(self):
        """Test TodoUpdate field validation"""
        # Empty text should fail
        with pytest.raises(ValidationError):
            TodoUpdate(text="")
        
        # Text too long should fail
        with pytest.raises(ValidationError):
            TodoUpdate(text="x" * 501)


class TestTodo:
    """Test Todo model"""
    
    def test_todo_complete(self):
        """Test creating a complete Todo instance"""
        now = datetime.now()
        todo_id = str(uuid.uuid4())
        
        todo = Todo(
            id=todo_id,
            text="Complete todo",
            priority=Priority.HIGH,
            completed=True,
            created_at=now,
            updated_at=now
        )
        
        assert todo.id == todo_id
        assert todo.text == "Complete todo"
        assert todo.priority == Priority.HIGH
        assert todo.completed is True
        assert todo.created_at == now
        assert todo.updated_at == now
    
    def test_todo_required_fields(self):
        """Test that all fields are required"""
        with pytest.raises(ValidationError):
            Todo(text="Missing fields")
    
    def test_todo_id_validation(self):
        """Test ID field validation"""
        # Valid UUID string
        todo_id = str(uuid.uuid4())
        todo = Todo(
            id=todo_id,
            text="Test",
            priority=Priority.MEDIUM,
            completed=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        assert todo.id == todo_id


class TestTodoResponse:
    """Test TodoResponse model"""
    
    def test_todo_response_inheritance(self):
        """Test that TodoResponse inherits from Todo"""
        now = datetime.now()
        todo_id = str(uuid.uuid4())
        
        response = TodoResponse(
            id=todo_id,
            text="Response todo",
            priority=Priority.LOW,
            completed=False,
            created_at=now,
            updated_at=now
        )
        
        assert response.id == todo_id
        assert response.text == "Response todo"
        assert response.priority == Priority.LOW
        assert response.completed is False


class TestTodoStats:
    """Test TodoStats model"""
    
    def test_todo_stats_valid(self):
        """Test creating valid TodoStats"""
        stats = TodoStats(
            total=10,
            active=6,
            completed=4,
            completion_rate=40.0,
            priority_breakdown={
                "high": 3,
                "medium": 4,
                "low": 3
            }
        )
        
        assert stats.total == 10
        assert stats.active == 6
        assert stats.completed == 4
        assert stats.completion_rate == 40.0
        assert stats.priority_breakdown["high"] == 3
    
    def test_todo_stats_required_fields(self):
        """Test that all fields are required"""
        with pytest.raises(ValidationError):
            TodoStats(total=10)  # Missing other required fields


class TestErrorResponse:
    """Test ErrorResponse model"""
    
    def test_error_response_minimal(self):
        """Test creating minimal ErrorResponse"""
        error = ErrorResponse(detail="Something went wrong")
        assert error.detail == "Something went wrong"
        assert error.error_code is None
    
    def test_error_response_with_code(self):
        """Test creating ErrorResponse with error code"""
        error = ErrorResponse(
            detail="Validation failed",
            error_code="VALIDATION_ERROR"
        )
        assert error.detail == "Validation failed"
        assert error.error_code == "VALIDATION_ERROR"


class TestModelSerialization:
    """Test model serialization and deserialization"""
    
    def test_todo_dict_conversion(self):
        """Test converting Todo to dict"""
        now = datetime.now()
        todo_id = str(uuid.uuid4())
        
        todo = Todo(
            id=todo_id,
            text="Serialization test",
            priority=Priority.MEDIUM,
            completed=False,
            created_at=now,
            updated_at=now
        )
        
        todo_dict = todo.dict()
        assert todo_dict["id"] == todo_id
        assert todo_dict["text"] == "Serialization test"
        assert todo_dict["priority"] == "medium"
        assert todo_dict["completed"] is False
    
    def test_todo_json_conversion(self):
        """Test converting Todo to JSON"""
        now = datetime.now()
        todo_id = str(uuid.uuid4())
        
        todo = Todo(
            id=todo_id,
            text="JSON test",
            priority=Priority.HIGH,
            completed=True,
            created_at=now,
            updated_at=now
        )
        
        json_str = todo.json()
        assert todo_id in json_str
        assert "JSON test" in json_str
        assert "high" in json_str
        assert "true" in json_str
    
    def test_todo_from_dict(self):
        """Test creating Todo from dict"""
        now = datetime.now()
        todo_id = str(uuid.uuid4())
        
        todo_dict = {
            "id": todo_id,
            "text": "From dict test",
            "priority": "low",
            "completed": False,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        todo = Todo(**todo_dict)
        assert todo.id == todo_id
        assert todo.text == "From dict test"
        assert todo.priority == Priority.LOW
        assert todo.completed is False
