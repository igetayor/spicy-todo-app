"""
Integration tests for complete workflows
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import uuid


class TestCompleteTodoWorkflow:
    """Test complete todo management workflow"""
    
    def test_complete_todo_lifecycle(self, client, clean_database):
        """Test complete todo lifecycle: create -> read -> update -> delete"""
        
        # 1. Create a new todo
        todo_data = {
            "text": "Complete workflow test todo",
            "priority": "high",
            "completed": False
        }
        
        create_response = client.post("/api/todos", json=todo_data)
        assert create_response.status_code == 200
        created_todo = create_response.json()
        todo_id = created_todo["id"]
        
        assert created_todo["text"] == "Complete workflow test todo"
        assert created_todo["priority"] == "high"
        assert created_todo["completed"] is False
        
        # 2. Read the created todo
        get_response = client.get(f"/api/todos/{todo_id}")
        assert get_response.status_code == 200
        retrieved_todo = get_response.json()
        
        assert retrieved_todo["id"] == todo_id
        assert retrieved_todo["text"] == "Complete workflow test todo"
        
        # 3. Update the todo
        update_data = {
            "text": "Updated workflow test todo",
            "completed": True
        }
        
        update_response = client.put(f"/api/todos/{todo_id}", json=update_data)
        assert update_response.status_code == 200
        updated_todo = update_response.json()
        
        assert updated_todo["text"] == "Updated workflow test todo"
        assert updated_todo["completed"] is True
        assert updated_todo["id"] == todo_id
        
        # 4. Verify update in list
        list_response = client.get("/api/todos")
        assert list_response.status_code == 200
        todos = list_response.json()
        
        updated_todo_in_list = next(todo for todo in todos if todo["id"] == todo_id)
        assert updated_todo_in_list["text"] == "Updated workflow test todo"
        assert updated_todo_in_list["completed"] is True
        
        # 5. Delete the todo
        delete_response = client.delete(f"/api/todos/{todo_id}")
        assert delete_response.status_code == 200
        
        # 6. Verify deletion
        get_deleted_response = client.get(f"/api/todos/{todo_id}")
        assert get_deleted_response.status_code == 404
        
        # Verify it's not in the list
        final_list_response = client.get("/api/todos")
        assert final_list_response.status_code == 200
        final_todos = final_list_response.json()
        
        todo_ids = [todo["id"] for todo in final_todos]
        assert todo_id not in todo_ids


class TestTodoManagementWorkflow:
    """Test todo management with multiple todos"""
    
    def test_multiple_todos_management(self, client, clean_database):
        """Test managing multiple todos with different priorities and states"""
        
        # Create multiple todos
        todos_data = [
            {"text": "High priority urgent task", "priority": "high", "completed": False},
            {"text": "Medium priority regular task", "priority": "medium", "completed": False},
            {"text": "Low priority nice-to-have", "priority": "low", "completed": False},
            {"text": "Already completed task", "priority": "medium", "completed": True}
        ]
        
        created_todos = []
        for todo_data in todos_data:
            response = client.post("/api/todos", json=todo_data)
            assert response.status_code == 200
            created_todos.append(response.json())
        
        # Test filtering by priority
        high_priority_response = client.get("/api/todos?priority=high")
        assert high_priority_response.status_code == 200
        high_todos = high_priority_response.json()
        assert len(high_todos) == 1
        assert high_todos[0]["text"] == "High priority urgent task"
        
        # Test filtering by completion status
        active_response = client.get("/api/todos?filter=active")
        assert active_response.status_code == 200
        active_todos = active_response.json()
        assert len(active_todos) == 3  # All except the completed one
        
        completed_response = client.get("/api/todos?filter=completed")
        assert completed_response.status_code == 200
        completed_todos = completed_response.json()
        assert len(completed_todos) == 1
        assert completed_todos[0]["text"] == "Already completed task"
        
        # Test search functionality
        search_response = client.get("/api/todos?search=priority")
        assert search_response.status_code == 200
        search_todos = search_response.json()
        assert len(search_todos) == 2  # Two todos contain "priority"
        
        # Test statistics
        stats_response = client.get("/api/todos/stats/summary")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        assert stats["total"] == 4
        assert stats["active"] == 3
        assert stats["completed"] == 1
        assert stats["completion_rate"] == 25.0
        
        # Test clearing completed todos
        clear_response = client.delete("/api/todos/completed")
        assert clear_response.status_code == 200
        clear_data = clear_response.json()
        assert clear_data["deleted_count"] == 1
        
        # Verify only active todos remain
        final_response = client.get("/api/todos")
        assert final_response.status_code == 200
        final_todos = final_response.json()
        assert len(final_todos) == 3
        
        for todo in final_todos:
            assert not todo["completed"]


class TestToggleWorkflow:
    """Test todo toggle functionality"""
    
    def test_toggle_workflow(self, client, clean_database):
        """Test toggling todos multiple times"""
        
        # Create a todo
        todo_data = {"text": "Toggle test todo", "priority": "medium"}
        create_response = client.post("/api/todos", json=todo_data)
        assert create_response.status_code == 200
        created_todo = create_response.json()
        todo_id = created_todo["id"]
        
        # Initially should be not completed
        assert created_todo["completed"] is False
        
        # Toggle to completed
        toggle1_response = client.patch(f"/api/todos/{todo_id}/toggle")
        assert toggle1_response.status_code == 200
        toggled_todo = toggle1_response.json()
        assert toggled_todo["completed"] is True
        
        # Toggle back to not completed
        toggle2_response = client.patch(f"/api/todos/{todo_id}/toggle")
        assert toggle2_response.status_code == 200
        toggled_todo2 = toggle2_response.json()
        assert toggled_todo2["completed"] is False
        
        # Toggle again to completed
        toggle3_response = client.patch(f"/api/todos/{todo_id}/toggle")
        assert toggle3_response.status_code == 200
        toggled_todo3 = toggle3_response.json()
        assert toggled_todo3["completed"] is True
        
        # Verify in stats
        stats_response = client.get("/api/todos/stats/summary")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert stats["completed"] == 1
        assert stats["active"] == 0


class TestSearchAndFilterCombinations:
    """Test various combinations of search and filters"""
    
    def test_search_filter_combinations(self, client, clean_database):
        """Test different combinations of search and filter parameters"""
        
        # Create diverse todos
        todos_data = [
            {"text": "High priority urgent task", "priority": "high", "completed": False},
            {"text": "Medium priority regular task", "priority": "medium", "completed": True},
            {"text": "Low priority nice-to-have", "priority": "low", "completed": False},
            {"text": "Another high priority task", "priority": "high", "completed": True},
            {"text": "Regular medium task", "priority": "medium", "completed": False}
        ]
        
        for todo_data in todos_data:
            response = client.post("/api/todos", json=todo_data)
            assert response.status_code == 200
        
        # Test: Active + High priority
        response = client.get("/api/todos?filter=active&priority=high")
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 1
        assert todos[0]["text"] == "High priority urgent task"
        
        # Test: Completed + Medium priority
        response = client.get("/api/todos?filter=completed&priority=medium")
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 1
        assert todos[0]["text"] == "Medium priority regular task"
        
        # Test: Search + Priority
        response = client.get("/api/todos?search=priority&priority=high")
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 2  # Both high priority todos contain "priority"
        
        # Test: Search + Filter + Priority
        response = client.get("/api/todos?search=task&filter=active&priority=medium")
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 1
        assert todos[0]["text"] == "Regular medium task"


class TestErrorRecovery:
    """Test error recovery and edge cases"""
    
    def test_error_recovery_workflow(self, client, clean_database):
        """Test that the API recovers gracefully from errors"""
        
        # Try to get non-existent todo
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/todos/{fake_id}")
        assert response.status_code == 404
        
        # Try to update non-existent todo
        response = client.put(f"/api/todos/{fake_id}", json={"text": "This should fail"})
        assert response.status_code == 404
        
        # Try to delete non-existent todo
        response = client.delete(f"/api/todos/{fake_id}")
        assert response.status_code == 404
        
        # Try to toggle non-existent todo
        response = client.patch(f"/api/todos/{fake_id}/toggle")
        assert response.status_code == 404
        
        # After all these errors, normal operations should still work
        todo_data = {"text": "Recovery test todo"}
        response = client.post("/api/todos", json=todo_data)
        assert response.status_code == 200
        
        created_todo = response.json()
        todo_id = created_todo["id"]
        
        # Normal operations should work
        response = client.get(f"/api/todos/{todo_id}")
        assert response.status_code == 200
        
        response = client.put(f"/api/todos/{todo_id}", json={"completed": True})
        assert response.status_code == 200
        
        response = client.delete(f"/api/todos/{todo_id}")
        assert response.status_code == 200


class TestConcurrentOperations:
    """Test simulating concurrent operations"""
    
    def test_concurrent_like_operations(self, client, clean_database):
        """Test operations that might happen concurrently"""
        
        # Create multiple todos quickly
        todo_ids = []
        for i in range(5):
            todo_data = {"text": f"Concurrent todo {i+1}", "priority": "medium"}
            response = client.post("/api/todos", json=todo_data)
            assert response.status_code == 200
            todo_ids.append(response.json()["id"])
        
        # Update multiple todos
        for i, todo_id in enumerate(todo_ids):
            update_data = {"completed": i % 2 == 0}  # Alternate completion
            response = client.put(f"/api/todos/{todo_id}", json=update_data)
            assert response.status_code == 200
        
        # Verify final state
        response = client.get("/api/todos")
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) == 5
        
        completed_count = sum(1 for todo in todos if todo["completed"])
        assert completed_count == 3  # 0, 2, 4 are completed (0-indexed)
        
        # Test statistics accuracy
        stats_response = client.get("/api/todos/stats/summary")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        assert stats["total"] == 5
        assert stats["completed"] == 3
        assert stats["active"] == 2
        assert stats["completion_rate"] == 60.0


class TestDataConsistency:
    """Test data consistency across operations"""
    
    def test_data_consistency(self, client, clean_database):
        """Test that data remains consistent across operations"""
        
        # Create a todo
        todo_data = {"text": "Consistency test todo", "priority": "high"}
        response = client.post("/api/todos", json=todo_data)
        assert response.status_code == 200
        created_todo = response.json()
        todo_id = created_todo["id"]
        
        # Verify creation timestamp
        created_at = datetime.fromisoformat(created_todo["created_at"])
        updated_at = datetime.fromisoformat(created_todo["updated_at"])
        assert created_at == updated_at  # Should be same on creation
        
        # Update the todo
        update_data = {"text": "Updated consistency test todo"}
        response = client.put(f"/api/todos/{todo_id}", json=update_data)
        assert response.status_code == 200
        updated_todo = response.json()
        
        # Verify update timestamp changed
        new_updated_at = datetime.fromisoformat(updated_todo["updated_at"])
        assert new_updated_at > updated_at
        
        # Verify created_at didn't change
        new_created_at = datetime.fromisoformat(updated_todo["created_at"])
        assert new_created_at == created_at
        
        # Verify consistency across different endpoints
        # Get by ID
        get_response = client.get(f"/api/todos/{todo_id}")
        assert get_response.status_code == 200
        get_todo = get_response.json()
        
        # Get from list
        list_response = client.get("/api/todos")
        assert list_response.status_code == 200
        list_todos = list_response.json()
        list_todo = next(todo for todo in list_todos if todo["id"] == todo_id)
        
        # Both should have same data
        assert get_todo["text"] == list_todo["text"]
        assert get_todo["priority"] == list_todo["priority"]
        assert get_todo["completed"] == list_todo["completed"]
        assert get_todo["created_at"] == list_todo["created_at"]
        assert get_todo["updated_at"] == list_todo["updated_at"]
