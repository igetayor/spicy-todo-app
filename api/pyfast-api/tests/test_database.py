"""
Tests for database operations and CRUD functions
"""

import pytest
from datetime import datetime
import uuid
from database import (
    get_todos, get_todo_by_id, create_todo, update_todo, delete_todo,
    clear_completed_todos, get_todos_count, initialize_sample_data,
    _generate_id, _get_current_timestamp
)
from models import TodoCreate, TodoUpdate, Priority


class TestDatabaseUtilities:
    """Test database utility functions"""
    
    def test_generate_id(self):
        """Test ID generation"""
        id1 = _generate_id()
        id2 = _generate_id()
        
        # Should be different
        assert id1 != id2
        
        # Should be valid UUID strings
        uuid.UUID(id1)
        uuid.UUID(id2)
    
    def test_get_current_timestamp(self):
        """Test timestamp generation"""
        timestamp1 = _get_current_timestamp()
        timestamp2 = _get_current_timestamp()
        
        # Should be datetime objects
        assert isinstance(timestamp1, datetime)
        assert isinstance(timestamp2, datetime)
        
        # Second timestamp should be >= first (or equal if very fast)
        assert timestamp2 >= timestamp1


class TestDatabaseInitialization:
    """Test database initialization"""
    
    def test_initialize_sample_data(self, clean_database):
        """Test sample data initialization"""
        initialize_sample_data()
        todos = get_todos()
        
        # Should have sample todos
        assert len(todos) > 0
        
        # All todos should be valid Todo objects
        for todo in todos:
            assert isinstance(todo.id, str)
            assert isinstance(todo.text, str)
            assert todo.priority in Priority
            assert isinstance(todo.completed, bool)
            assert isinstance(todo.created_at, datetime)
            assert isinstance(todo.updated_at, datetime)
    
    def test_auto_initialization(self, clean_database):
        """Test that database auto-initializes when empty"""
        todos = get_todos()
        assert len(todos) > 0  # Should auto-initialize


class TestGetTodos:
    """Test get_todos function"""
    
    def test_get_todos_empty_database(self, clean_database):
        """Test getting todos from empty database"""
        todos = get_todos()
        assert len(todos) > 0  # Should auto-initialize
    
    def test_get_todos_populated_database(self, populated_database):
        """Test getting todos from populated database"""
        todos = get_todos()
        assert len(todos) == 3
        assert todos[0].text == "Test todo 1"
        assert todos[1].text == "Test todo 2"
        assert todos[2].text == "Test todo 3"
    
    def test_get_todos_returns_copy(self, populated_database):
        """Test that get_todos returns a copy, not reference"""
        todos1 = get_todos()
        todos2 = get_todos()
        
        # Should be different objects
        assert todos1 is not todos2
        
        # But should have same content
        assert len(todos1) == len(todos2)
        assert todos1[0].id == todos2[0].id


class TestGetTodoById:
    """Test get_todo_by_id function"""
    
    def test_get_todo_by_id_existing(self, populated_database):
        """Test getting existing todo by ID"""
        todos = get_todos()
        todo_id = todos[0].id
        
        retrieved_todo = get_todo_by_id(todo_id)
        assert retrieved_todo is not None
        assert retrieved_todo.id == todo_id
        assert retrieved_todo.text == "Test todo 1"
    
    def test_get_todo_by_id_nonexistent(self, populated_database):
        """Test getting non-existent todo by ID"""
        fake_id = str(uuid.uuid4())
        retrieved_todo = get_todo_by_id(fake_id)
        assert retrieved_todo is None
    
    def test_get_todo_by_id_empty_database(self, clean_database):
        """Test getting todo by ID from empty database"""
        fake_id = str(uuid.uuid4())
        retrieved_todo = get_todo_by_id(fake_id)
        assert retrieved_todo is None


class TestCreateTodo:
    """Test create_todo function"""
    
    def test_create_todo_valid(self, clean_database):
        """Test creating a valid todo"""
        todo_data = TodoCreate(
            text="New test todo",
            priority=Priority.HIGH,
            completed=False
        )
        
        created_todo = create_todo(todo_data)
        
        assert created_todo.text == "New test todo"
        assert created_todo.priority == Priority.HIGH
        assert created_todo.completed is False
        assert isinstance(created_todo.id, str)
        assert isinstance(created_todo.created_at, datetime)
        assert isinstance(created_todo.updated_at, datetime)
        
        # Should be added to database
        todos = get_todos()
        assert len(todos) == 1
        assert todos[0].id == created_todo.id
    
    def test_create_todo_minimal(self, clean_database):
        """Test creating todo with minimal data"""
        todo_data = TodoCreate(text="Minimal todo")
        
        created_todo = create_todo(todo_data)
        
        assert created_todo.text == "Minimal todo"
        assert created_todo.priority == Priority.MEDIUM
        assert created_todo.completed is False
    
    def test_create_todo_with_existing_data(self, populated_database):
        """Test creating todo when database already has data"""
        initial_count = len(get_todos())
        
        todo_data = TodoCreate(text="Additional todo")
        created_todo = create_todo(todo_data)
        
        todos = get_todos()
        assert len(todos) == initial_count + 1
        assert created_todo.text == "Additional todo"


class TestUpdateTodo:
    """Test update_todo function"""
    
    def test_update_todo_existing(self, populated_database):
        """Test updating existing todo"""
        todos = get_todos()
        todo_id = todos[0].id
        original_text = todos[0].text
        
        update_data = TodoUpdate(
            text="Updated text",
            priority=Priority.HIGH,
            completed=True
        )
        
        updated_todo = update_todo(todo_id, update_data)
        
        assert updated_todo.id == todo_id
        assert updated_todo.text == "Updated text"
        assert updated_todo.priority == Priority.HIGH
        assert updated_todo.completed is True
        assert updated_todo.created_at == todos[0].created_at
        assert updated_todo.updated_at > todos[0].updated_at
        
        # Should be updated in database
        retrieved_todo = get_todo_by_id(todo_id)
        assert retrieved_todo.text == "Updated text"
    
    def test_update_todo_partial(self, populated_database):
        """Test partial update of todo"""
        todos = get_todos()
        todo_id = todos[0].id
        original_priority = todos[0].priority
        
        update_data = TodoUpdate(text="Only text updated")
        
        updated_todo = update_todo(todo_id, update_data)
        
        assert updated_todo.text == "Only text updated"
        assert updated_todo.priority == original_priority  # Should remain unchanged
        assert updated_todo.completed == todos[0].completed  # Should remain unchanged
    
    def test_update_todo_nonexistent(self, populated_database):
        """Test updating non-existent todo"""
        fake_id = str(uuid.uuid4())
        update_data = TodoUpdate(text="This should fail")
        
        with pytest.raises(ValueError, match="Todo with id .* not found"):
            update_todo(fake_id, update_data)


class TestDeleteTodo:
    """Test delete_todo function"""
    
    def test_delete_todo_existing(self, populated_database):
        """Test deleting existing todo"""
        todos = get_todos()
        todo_id = todos[0].id
        initial_count = len(todos)
        
        success = delete_todo(todo_id)
        
        assert success is True
        assert len(get_todos()) == initial_count - 1
        
        # Todo should no longer exist
        assert get_todo_by_id(todo_id) is None
    
    def test_delete_todo_nonexistent(self, populated_database):
        """Test deleting non-existent todo"""
        fake_id = str(uuid.uuid4())
        initial_count = len(get_todos())
        
        success = delete_todo(fake_id)
        
        assert success is False
        assert len(get_todos()) == initial_count  # Should remain unchanged
    
    def test_delete_todo_empty_database(self, clean_database):
        """Test deleting from empty database"""
        fake_id = str(uuid.uuid4())
        success = delete_todo(fake_id)
        assert success is False


class TestClearCompletedTodos:
    """Test clear_completed_todos function"""
    
    def test_clear_completed_todos(self, populated_database):
        """Test clearing completed todos"""
        todos = get_todos()
        initial_count = len(todos)
        
        # Mark some todos as completed
        update_todo(todos[0].id, TodoUpdate(completed=True))
        update_todo(todos[2].id, TodoUpdate(completed=True))
        
        deleted_count = clear_completed_todos()
        
        assert deleted_count == 2
        assert len(get_todos()) == initial_count - 2
        
        # Remaining todos should not be completed
        remaining_todos = get_todos()
        for todo in remaining_todos:
            assert not todo.completed
    
    def test_clear_completed_todos_none_completed(self, populated_database):
        """Test clearing when no todos are completed"""
        todos = get_todos()
        initial_count = len(todos)
        
        deleted_count = clear_completed_todos()
        
        assert deleted_count == 0
        assert len(get_todos()) == initial_count
    
    def test_clear_completed_todos_empty_database(self, clean_database):
        """Test clearing from empty database"""
        deleted_count = clear_completed_todos()
        assert deleted_count == 0


class TestGetTodosCount:
    """Test get_todos_count function"""
    
    def test_get_todos_count_populated(self, populated_database):
        """Test getting count from populated database"""
        count = get_todos_count()
        assert count == 3
    
    def test_get_todos_count_empty(self, clean_database):
        """Test getting count from empty database"""
        count = get_todos_count()
        assert count > 0  # Should auto-initialize
    
    def test_get_todos_count_after_operations(self, populated_database):
        """Test count after various operations"""
        initial_count = get_todos_count()
        
        # Add a todo
        todo_data = TodoCreate(text="New todo")
        create_todo(todo_data)
        assert get_todos_count() == initial_count + 1
        
        # Delete a todo
        todos = get_todos()
        delete_todo(todos[0].id)
        assert get_todos_count() == initial_count


class TestDatabaseConsistency:
    """Test database consistency and edge cases"""
    
    def test_database_consistency_after_operations(self, clean_database):
        """Test database consistency after multiple operations"""
        # Create todos
        todo1_data = TodoCreate(text="Todo 1", priority=Priority.HIGH)
        todo2_data = TodoCreate(text="Todo 2", priority=Priority.LOW)
        
        todo1 = create_todo(todo1_data)
        todo2 = create_todo(todo2_data)
        
        # Update todo1
        update_todo(todo1.id, TodoUpdate(completed=True))
        
        # Delete todo2
        delete_todo(todo2.id)
        
        # Check final state
        todos = get_todos()
        assert len(todos) == 1
        assert todos[0].id == todo1.id
        assert todos[0].completed is True
    
    def test_concurrent_operations_simulation(self, populated_database):
        """Test simulating concurrent operations"""
        todos = get_todos()
        
        # Simulate multiple updates
        for todo in todos:
            update_todo(todo.id, TodoUpdate(completed=True))
        
        # All should be completed
        updated_todos = get_todos()
        for todo in updated_todos:
            assert todo.completed is True
        
        # Clear completed
        deleted_count = clear_completed_todos()
        assert deleted_count == len(todos)
        assert len(get_todos()) == 0
