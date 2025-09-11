"""
Tests for API endpoints and HTTP methods
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import uuid
from models import Priority


class TestRootEndpoint:
    """Test root endpoint"""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns welcome message"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "🌶️ Welcome to Spicy Todo API!"
        assert data["version"] == "1.0.0"


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        
        # Verify timestamp is valid ISO format
        datetime.fromisoformat(data["timestamp"])


class TestGetTodosEndpoint:
    """Test GET /api/todos endpoint"""
    
    def test_get_todos_basic(self, client, populated_database):
        """Test basic get todos functionality"""
        response = client.get("/api/todos")
        
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 3
        assert todos[0]["text"] == "Test todo 1"
    
    def test_get_todos_empty_database(self, client, clean_database):
        """Test get todos from empty database"""
        response = client.get("/api/todos")
        
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) > 0  # Should auto-initialize
    
    def test_get_todos_filter_active(self, client, populated_database):
        """Test filtering for active todos"""
        response = client.get("/api/todos?filter=active")
        
        assert response.status_code == 200
        todos = response.json()
        
        # All returned todos should be active (not completed)
        for todo in todos:
            assert not todo["completed"]
    
    def test_get_todos_filter_completed(self, client, populated_database):
        """Test filtering for completed todos"""
        response = client.get("/api/todos?filter=completed")
        
        assert response.status_code == 200
        todos = response.json()
        
        # All returned todos should be completed
        for todo in todos:
            assert todo["completed"]
    
    def test_get_todos_filter_all(self, client, populated_database):
        """Test filtering for all todos"""
        response = client.get("/api/todos?filter=all")
        
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 3
    
    def test_get_todos_search(self, client, populated_database):
        """Test searching todos by text"""
        response = client.get("/api/todos?search=test")
        
        assert response.status_code == 200
        todos = response.json()
        
        # All returned todos should contain "test" in their text
        for todo in todos:
            assert "test" in todo["text"].lower()
    
    def test_get_todos_search_case_insensitive(self, client, populated_database):
        """Test case-insensitive search"""
        response = client.get("/api/todos?search=TEST")
        
        assert response.status_code == 200
        todos = response.json()
        
        for todo in todos:
            assert "test" in todo["text"].lower()
    
    def test_get_todos_priority_filter(self, client, populated_database):
        """Test filtering by priority"""
        response = client.get("/api/todos?priority=medium")
        
        assert response.status_code == 200
        todos = response.json()
        
        for todo in todos:
            assert todo["priority"] == "medium"
    
    def test_get_todos_multiple_filters(self, client, populated_database):
        """Test multiple filters combined"""
        response = client.get("/api/todos?filter=active&search=test&priority=medium")
        
        assert response.status_code == 200
        todos = response.json()
        
        for todo in todos:
            assert not todo["completed"]  # active filter
            assert "test" in todo["text"].lower()  # search filter
            assert todo["priority"] == "medium"  # priority filter
    
    def test_get_todos_invalid_filter(self, client, populated_database):
        """Test with invalid filter value"""
        response = client.get("/api/todos?filter=invalid")
        
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 3  # Should return all todos


class TestGetTodoEndpoint:
    """Test GET /api/todos/{todo_id} endpoint"""
    
    def test_get_todo_existing(self, client, populated_database):
        """Test getting existing todo by ID"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        
        response = client.get(f"/api/todos/{todo_id}")
        
        assert response.status_code == 200
        todo = response.json()
        assert todo["id"] == todo_id
        assert todo["text"] == "Test todo 1"
    
    def test_get_todo_nonexistent(self, client, populated_database):
        """Test getting non-existent todo by ID"""
        fake_id = str(uuid.uuid4())
        
        response = client.get(f"/api/todos/{fake_id}")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Todo not found"
    
    def test_get_todo_invalid_id_format(self, client, populated_database):
        """Test getting todo with invalid ID format"""
        response = client.get("/api/todos/invalid-id")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Todo not found"


class TestCreateTodoEndpoint:
    """Test POST /api/todos endpoint"""
    
    def test_create_todo_valid(self, client, clean_database):
        """Test creating a valid todo"""
        todo_data = {
            "text": "New test todo",
            "priority": "high",
            "completed": False
        }
        
        response = client.post("/api/todos", json=todo_data)
        
        assert response.status_code == 200
        created_todo = response.json()
        assert created_todo["text"] == "New test todo"
        assert created_todo["priority"] == "high"
        assert created_todo["completed"] is False
        assert "id" in created_todo
        assert "created_at" in created_todo
        assert "updated_at" in created_todo
    
    def test_create_todo_minimal(self, client, clean_database):
        """Test creating todo with minimal data"""
        todo_data = {"text": "Minimal todo"}
        
        response = client.post("/api/todos", json=todo_data)
        
        assert response.status_code == 200
        created_todo = response.json()
        assert created_todo["text"] == "Minimal todo"
        assert created_todo["priority"] == "medium"  # default
        assert created_todo["completed"] is False  # default
    
    def test_create_todo_invalid_data(self, client, clean_database):
        """Test creating todo with invalid data"""
        invalid_data = {
            "text": "",  # Empty text should fail
            "priority": "invalid_priority",
            "completed": "not_a_boolean"
        }
        
        response = client.post("/api/todos", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_create_todo_missing_text(self, client, clean_database):
        """Test creating todo without required text field"""
        invalid_data = {"priority": "high"}
        
        response = client.post("/api/todos", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_create_todo_text_too_long(self, client, clean_database):
        """Test creating todo with text too long"""
        invalid_data = {
            "text": "x" * 501,  # Exceeds max length
            "priority": "medium"
        }
        
        response = client.post("/api/todos", json=invalid_data)
        
        assert response.status_code == 422


class TestUpdateTodoEndpoint:
    """Test PUT /api/todos/{todo_id} endpoint"""
    
    def test_update_todo_existing(self, client, populated_database):
        """Test updating existing todo"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        
        update_data = {
            "text": "Updated text",
            "priority": "high",
            "completed": True
        }
        
        response = client.put(f"/api/todos/{todo_id}", json=update_data)
        
        assert response.status_code == 200
        updated_todo = response.json()
        assert updated_todo["text"] == "Updated text"
        assert updated_todo["priority"] == "high"
        assert updated_todo["completed"] is True
        assert updated_todo["id"] == todo_id
    
    def test_update_todo_partial(self, client, populated_database):
        """Test partial update of todo"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        original_priority = todos[0]["priority"]
        
        update_data = {"text": "Only text updated"}
        
        response = client.put(f"/api/todos/{todo_id}", json=update_data)
        
        assert response.status_code == 200
        updated_todo = response.json()
        assert updated_todo["text"] == "Only text updated"
        assert updated_todo["priority"] == original_priority  # Should remain unchanged
    
    def test_update_todo_nonexistent(self, client, populated_database):
        """Test updating non-existent todo"""
        fake_id = str(uuid.uuid4())
        update_data = {"text": "This should fail"}
        
        response = client.put(f"/api/todos/{fake_id}", json=update_data)
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Todo not found"
    
    def test_update_todo_invalid_data(self, client, populated_database):
        """Test updating with invalid data"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        
        invalid_data = {
            "text": "",  # Empty text should fail
            "priority": "invalid_priority"
        }
        
        response = client.put(f"/api/todos/{todo_id}", json=invalid_data)
        
        assert response.status_code == 422


class TestDeleteTodoEndpoint:
    """Test DELETE /api/todos/{todo_id} endpoint"""
    
    def test_delete_todo_existing(self, client, populated_database):
        """Test deleting existing todo"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        initial_count = len(todos)
        
        response = client.delete(f"/api/todos/{todo_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Todo deleted successfully"
        
        # Verify todo is deleted
        remaining_todos = client.get("/api/todos").json()
        assert len(remaining_todos) == initial_count - 1
    
    def test_delete_todo_nonexistent(self, client, populated_database):
        """Test deleting non-existent todo"""
        fake_id = str(uuid.uuid4())
        
        response = client.delete(f"/api/todos/{fake_id}")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Todo not found"


class TestToggleTodoEndpoint:
    """Test PATCH /api/todos/{todo_id}/toggle endpoint"""
    
    def test_toggle_todo_existing(self, client, populated_database):
        """Test toggling existing todo"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        original_completed = todos[0]["completed"]
        
        response = client.patch(f"/api/todos/{todo_id}/toggle")
        
        assert response.status_code == 200
        toggled_todo = response.json()
        assert toggled_todo["completed"] != original_completed
        assert toggled_todo["id"] == todo_id
    
    def test_toggle_todo_nonexistent(self, client, populated_database):
        """Test toggling non-existent todo"""
        fake_id = str(uuid.uuid4())
        
        response = client.patch(f"/api/todos/{fake_id}/toggle")
        
        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Todo not found"


class TestStatsEndpoint:
    """Test GET /api/todos/stats/summary endpoint"""
    
    def test_get_stats(self, client, populated_database):
        """Test getting todo statistics"""
        response = client.get("/api/todos/stats/summary")
        
        assert response.status_code == 200
        stats = response.json()
        
        assert "total" in stats
        assert "active" in stats
        assert "completed" in stats
        assert "completion_rate" in stats
        assert "priority_breakdown" in stats
        
        assert stats["total"] == 3
        assert stats["active"] + stats["completed"] == stats["total"]
        assert isinstance(stats["completion_rate"], (int, float))
        
        priority_breakdown = stats["priority_breakdown"]
        assert "high" in priority_breakdown
        assert "medium" in priority_breakdown
        assert "low" in priority_breakdown
    
    def test_get_stats_empty_database(self, client, clean_database):
        """Test getting stats from empty database"""
        response = client.get("/api/todos/stats/summary")
        
        assert response.status_code == 200
        stats = response.json()
        
        assert stats["total"] > 0  # Should auto-initialize
        assert stats["active"] + stats["completed"] == stats["total"]


class TestClearCompletedEndpoint:
    """Test DELETE /api/todos/completed endpoint"""
    
    def test_clear_completed_todos(self, client, populated_database):
        """Test clearing completed todos"""
        # First, mark some todos as completed
        todos = client.get("/api/todos").json()
        client.put(f"/api/todos/{todos[0]['id']}", json={"completed": True})
        client.put(f"/api/todos/{todos[2]['id']}", json={"completed": True})
        
        response = client.delete("/api/todos/completed")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "deleted_count" in data
        assert data["deleted_count"] == 2
        
        # Verify completed todos are deleted
        remaining_todos = client.get("/api/todos").json()
        for todo in remaining_todos:
            assert not todo["completed"]
    
    def test_clear_completed_todos_none_completed(self, client, populated_database):
        """Test clearing when no todos are completed"""
        response = client.delete("/api/todos/completed")
        
        assert response.status_code == 200
        data = response.json()
        assert data["deleted_count"] == 0


class TestCORSHeaders:
    """Test CORS headers"""
    
    def test_cors_headers(self, client):
        """Test that CORS headers are present"""
        response = client.options("/api/todos")
        
        # Should not fail due to CORS
        assert response.status_code in [200, 405]  # 405 is OK for OPTIONS on non-OPTIONS endpoint


class TestErrorHandling:
    """Test error handling"""
    
    def test_invalid_json(self, client, clean_database):
        """Test handling of invalid JSON"""
        response = client.post(
            "/api/todos",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422
    
    def test_missing_content_type(self, client, clean_database):
        """Test handling of missing content type"""
        response = client.post("/api/todos", data='{"text": "test"}')
        
        assert response.status_code == 422
    
    def test_unsupported_method(self, client):
        """Test handling of unsupported HTTP method"""
        response = client.patch("/api/todos")
        
        assert response.status_code == 405  # Method Not Allowed
