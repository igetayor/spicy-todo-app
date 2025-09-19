"""
End-to-end workflow tests for the Spicy Todo API
These tests simulate real user workflows and interactions
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


class TestCompleteUserWorkflows:
    """Test complete user workflows from start to finish"""
    
    def test_new_user_onboarding_workflow(self, client, clean_database):
        """Test complete workflow for a new user getting started"""
        
        # 1. User checks if API is healthy
        health_response = client.get("/health")
        assert health_response.status_code == 200
        health_data = health_response.json()
        assert health_data["status"] == "healthy"
        
        # 2. User gets welcome message
        welcome_response = client.get("/")
        assert welcome_response.status_code == 200
        welcome_data = welcome_response.json()
        assert "Spicy Todo API" in welcome_data["message"]
        
        # 3. User checks initial todo list (should auto-initialize)
        todos_response = client.get("/api/todos")
        assert todos_response.status_code == 200
        initial_todos = todos_response.json()
        assert len(initial_todos) > 0
        
        # 4. User checks statistics
        stats_response = client.get("/api/todos/stats/summary")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        assert stats["total"] > 0
        
        # 5. User creates their first todo
        first_todo = {
            "text": "Learn how to use the Spicy Todo API",
            "priority": "high",
            "completed": False
        }
        create_response = client.post("/api/todos", json=first_todo)
        assert create_response.status_code == 200
        created_todo = create_response.json()
        assert created_todo["text"] == first_todo["text"]
        assert created_todo["priority"] == first_todo["priority"]
        
        # 6. User verifies their todo was created
        get_response = client.get(f"/api/todos/{created_todo['id']}")
        assert get_response.status_code == 200
        retrieved_todo = get_response.json()
        assert retrieved_todo["id"] == created_todo["id"]
        
        # 7. User updates their todo
        update_data = {
            "text": "Learn how to use the Spicy Todo API - Updated!",
            "completed": True
        }
        update_response = client.put(f"/api/todos/{created_todo['id']}", json=update_data)
        assert update_response.status_code == 200
        updated_todo = update_response.json()
        assert updated_todo["completed"] is True
        
        # 8. User checks updated statistics
        updated_stats = client.get("/api/todos/stats/summary").json()
        assert updated_stats["completed"] >= 1
        
        # 9. User creates more todos to build their list
        additional_todos = [
            {"text": "Set up development environment", "priority": "high"},
            {"text": "Read API documentation", "priority": "medium"},
            {"text": "Practice with sample data", "priority": "low"}
        ]
        
        created_todo_ids = []
        for todo_data in additional_todos:
            response = client.post("/api/todos", json=todo_data)
            assert response.status_code == 200
            created_todo_ids.append(response.json()["id"])
        
        # 10. User filters their todos
        high_priority_response = client.get("/api/todos?priority=high")
        assert high_priority_response.status_code == 200
        high_priority_todos = high_priority_response.json()
        assert len(high_priority_todos) >= 2  # At least the two high priority todos
        
        # 11. User searches for specific todos
        search_response = client.get("/api/todos?search=API")
        assert search_response.status_code == 200
        search_results = search_response.json()
        assert len(search_results) >= 1  # At least one todo contains "API"
        
        # 12. User completes more todos
        for todo_id in created_todo_ids[:2]:  # Complete first two
            toggle_response = client.patch(f"/api/todos/{todo_id}/toggle")
            assert toggle_response.status_code == 200
        
        # 13. User checks final statistics
        final_stats = client.get("/api/todos/stats/summary").json()
        assert final_stats["completed"] >= 3  # At least 3 completed todos
        
        # 14. User clears completed todos
        clear_response = client.delete("/api/todos/completed")
        assert clear_response.status_code == 200
        clear_data = clear_response.json()
        assert clear_data["deleted_count"] >= 3
        
        # 15. User verifies completed todos are gone
        final_todos = client.get("/api/todos").json()
        for todo in final_todos:
            assert not todo["completed"]  # No completed todos should remain
    
    def test_power_user_workflow(self, client, clean_database):
        """Test workflow for a power user with many todos and complex operations"""
        
        # 1. Create a large number of todos with different priorities and states
        todo_templates = [
            {"text": f"Urgent task {i}", "priority": "high", "completed": i % 3 == 0}
            for i in range(20)
        ] + [
            {"text": f"Regular task {i}", "priority": "medium", "completed": i % 4 == 0}
            for i in range(30)
        ] + [
            {"text": f"Low priority task {i}", "priority": "low", "completed": i % 5 == 0}
            for i in range(25)
        ]
        
        created_todos = []
        for template in todo_templates:
            response = client.post("/api/todos", json=template)
            assert response.status_code == 200
            created_todos.append(response.json())
        
        # 2. Verify all todos were created
        all_todos = client.get("/api/todos").json()
        assert len(all_todos) >= 75  # Should have all created todos plus any auto-initialized ones
        
        # 3. Test complex filtering scenarios
        filter_tests = [
            ("?filter=active&priority=high", "Active high priority todos"),
            ("?filter=completed&priority=medium", "Completed medium priority todos"),
            ("?search=Urgent&filter=active", "Active urgent tasks"),
            ("?search=task&priority=low&filter=completed", "Completed low priority tasks"),
        ]
        
        for filter_params, description in filter_tests:
            response = client.get(f"/api/todos{filter_params}")
            assert response.status_code == 200, f"Failed for {description}"
            filtered_todos = response.json()
            
            # Verify filter worked correctly
            for todo in filtered_todos:
                if "active" in filter_params:
                    assert not todo["completed"]
                if "completed" in filter_params:
                    assert todo["completed"]
                if "priority=" in filter_params:
                    priority = filter_params.split("priority=")[1].split("&")[0]
                    assert todo["priority"] == priority
                if "search=" in filter_params:
                    search_term = filter_params.split("search=")[1].split("&")[0]
                    assert search_term.lower() in todo["text"].lower()
        
        # 4. Bulk operations - complete many todos
        active_todos = [todo for todo in all_todos if not todo["completed"]]
        todos_to_complete = active_todos[:10]  # Complete first 10 active todos
        
        for todo in todos_to_complete:
            response = client.patch(f"/api/todos/{todo['id']}/toggle")
            assert response.status_code == 200
        
        # 5. Verify bulk completion
        updated_todos = client.get("/api/todos").json()
        completed_count = sum(1 for todo in updated_todos if todo["completed"])
        assert completed_count >= 10
        
        # 6. Bulk updates - update priority of many todos
        high_priority_todos = [todo for todo in updated_todos if todo["priority"] == "high" and not todo["completed"]]
        
        for todo in high_priority_todos[:5]:  # Update first 5 high priority todos
            update_data = {"priority": "medium"}
            response = client.put(f"/api/todos/{todo['id']}", json=update_data)
            assert response.status_code == 200
        
        # 7. Verify bulk updates
        final_todos = client.get("/api/todos").json()
        medium_priority_count = sum(1 for todo in final_todos if todo["priority"] == "medium")
        assert medium_priority_count >= 5
        
        # 8. Complex statistics verification
        final_stats = client.get("/api/todos/stats/summary").json()
        assert final_stats["total"] >= 75
        assert final_stats["completed"] >= 10
        assert final_stats["active"] == final_stats["total"] - final_stats["completed"]
        assert 0 <= final_stats["completion_rate"] <= 100
        
        priority_breakdown = final_stats["priority_breakdown"]
        assert priority_breakdown["high"] >= 0
        assert priority_breakdown["medium"] >= 5  # At least 5 from our updates
        assert priority_breakdown["low"] >= 0
    
    def test_error_recovery_workflow(self, client, clean_database):
        """Test how the system handles and recovers from various error scenarios"""
        
        # 1. Test recovery from invalid requests
        invalid_requests = [
            ("POST", "/api/todos", {"text": "", "priority": "invalid"}),
            ("PUT", "/api/todos/invalid-id", {"text": "Update"}),
            ("DELETE", "/api/todos/nonexistent-id", None),
            ("PATCH", "/api/todos/invalid-id/toggle", None),
        ]
        
        for method, endpoint, data in invalid_requests:
            if method == "POST":
                response = client.post(endpoint, json=data)
            elif method == "PUT":
                response = client.put(endpoint, json=data)
            elif method == "DELETE":
                response = client.delete(endpoint)
            elif method == "PATCH":
                response = client.patch(endpoint)
            
            # Should return appropriate error codes
            assert response.status_code in [400, 404, 422]
        
        # 2. Verify system is still functional after errors
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        # 3. Create a todo to verify normal operations still work
        todo_data = {"text": "Recovery test todo", "priority": "medium"}
        create_response = client.post("/api/todos", json=todo_data)
        assert create_response.status_code == 200
        
        # 4. Test partial failure scenarios
        created_todo = create_response.json()
        
        # Try to update with invalid data, then with valid data
        invalid_update = {"text": "", "priority": "invalid"}
        invalid_response = client.put(f"/api/todos/{created_todo['id']}", json=invalid_update)
        assert invalid_response.status_code == 422
        
        # Valid update should still work
        valid_update = {"text": "Updated recovery test todo", "completed": True}
        valid_response = client.put(f"/api/todos/{created_todo['id']}", json=valid_update)
        assert valid_response.status_code == 200
        
        # 5. Test network-like error simulation (rapid requests)
        rapid_requests = []
        for i in range(50):
            todo_data = {"text": f"Rapid request test {i}", "priority": "low"}
            response = client.post("/api/todos", json=todo_data)
            rapid_requests.append(response.status_code == 200)
        
        # Most requests should succeed
        success_rate = sum(rapid_requests) / len(rapid_requests)
        assert success_rate >= 0.9  # At least 90% should succeed
        
        # 6. Verify system stability after rapid requests
        final_health = client.get("/health")
        assert final_health.status_code == 200
        
        final_stats = client.get("/api/todos/stats/summary")
        assert final_stats.status_code == 200


class TestConcurrentUserWorkflows:
    """Test multiple users working simultaneously"""
    
    def test_multiple_users_creating_todos(self, client, clean_database):
        """Test multiple users creating todos simultaneously"""
        
        def create_todos_for_user(user_id, todo_count=10):
            """Simulate a user creating multiple todos"""
            results = []
            for i in range(todo_count):
                todo_data = {
                    "text": f"User {user_id} todo {i}",
                    "priority": ["low", "medium", "high"][i % 3],
                    "completed": i % 2 == 0
                }
                try:
                    response = client.post("/api/todos", json=todo_data)
                    results.append(response.status_code == 200)
                except Exception:
                    results.append(False)
            return results
        
        # Simulate 5 users creating todos simultaneously
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_todos_for_user, user_id, 10) for user_id in range(5)]
            all_results = [future.result() for future in as_completed(futures)]
        
        # Verify most operations succeeded
        total_operations = sum(len(results) for results in all_results)
        successful_operations = sum(sum(results) for results in all_results)
        success_rate = successful_operations / total_operations
        
        assert success_rate >= 0.95  # At least 95% should succeed
        
        # Verify todos were created
        final_todos = client.get("/api/todos").json()
        assert len(final_todos) >= 40  # Should have many todos from all users
    
    def test_multiple_users_mixed_operations(self, client, clean_database):
        """Test multiple users performing different operations simultaneously"""
        
        # First, create some base todos
        base_todos = []
        for i in range(20):
            todo_data = {"text": f"Base todo {i}", "priority": "medium"}
            response = client.post("/api/todos", json=todo_data)
            if response.status_code == 200:
                base_todos.append(response.json())
        
        def user_operations(user_id, operations_count=15):
            """Simulate a user performing various operations"""
            results = []
            todos = client.get("/api/todos").json()
            
            for i in range(operations_count):
                operation = i % 4
                try:
                    if operation == 0 and todos:  # Create
                        todo_data = {
                            "text": f"User {user_id} created todo {i}",
                            "priority": "low"
                        }
                        response = client.post("/api/todos", json=todo_data)
                        results.append(response.status_code == 200)
                        
                    elif operation == 1 and todos:  # Update
                        todo = todos[i % len(todos)]
                        update_data = {"completed": not todo.get("completed", False)}
                        response = client.put(f"/api/todos/{todo['id']}", json=update_data)
                        results.append(response.status_code == 200)
                        
                    elif operation == 2 and todos:  # Toggle
                        todo = todos[i % len(todos)]
                        response = client.patch(f"/api/todos/{todo['id']}/toggle")
                        results.append(response.status_code == 200)
                        
                    else:  # Get stats
                        response = client.get("/api/todos/stats/summary")
                        results.append(response.status_code == 200)
                        
                except Exception:
                    results.append(False)
                    
                # Refresh todos list periodically
                if i % 5 == 0:
                    todos = client.get("/api/todos").json()
            
            return results
        
        # Simulate 3 users performing mixed operations
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(user_operations, user_id, 20) for user_id in range(3)]
            all_results = [future.result() for future in as_completed(futures)]
        
        # Verify operations succeeded
        total_operations = sum(len(results) for results in all_results)
        successful_operations = sum(sum(results) for results in all_results)
        success_rate = successful_operations / total_operations
        
        assert success_rate >= 0.85  # At least 85% should succeed
        
        # Verify system is still stable
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        final_todos = client.get("/api/todos").json()
        assert len(final_todos) > 0


class TestDataConsistencyWorkflows:
    """Test data consistency across complex workflows"""
    
    def test_data_consistency_under_load(self, client, clean_database):
        """Test that data remains consistent under various load scenarios"""
        
        # Create initial dataset
        initial_todos = []
        for i in range(30):
            todo_data = {
                "text": f"Consistency test todo {i}",
                "priority": ["low", "medium", "high"][i % 3],
                "completed": i % 3 == 0
            }
            response = client.post("/api/todos", json=todo_data)
            if response.status_code == 200:
                initial_todos.append(response.json())
        
        # Perform various operations and verify consistency
        consistency_checks = []
        
        for iteration in range(10):
            # 1. Create new todo
            todo_data = {
                "text": f"Consistency iteration {iteration}",
                "priority": "medium"
            }
            create_response = client.post("/api/todos", json=todo_data)
            assert create_response.status_code == 200
            created_todo = create_response.json()
            
            # 2. Update the todo
            update_data = {"completed": True, "priority": "high"}
            update_response = client.put(f"/api/todos/{created_todo['id']}", json=update_data)
            assert update_response.status_code == 200
            updated_todo = update_response.json()
            
            # 3. Verify consistency by getting the todo directly
            get_response = client.get(f"/api/todos/{created_todo['id']}")
            assert get_response.status_code == 200
            retrieved_todo = get_response.json()
            
            # 4. Check consistency between updated and retrieved todos
            consistency_checks.append({
                "created_id": created_todo["id"],
                "updated_completed": updated_todo["completed"],
                "retrieved_completed": retrieved_todo["completed"],
                "updated_priority": updated_todo["priority"],
                "retrieved_priority": retrieved_todo["priority"],
                "updated_text": updated_todo["text"],
                "retrieved_text": retrieved_todo["text"]
            })
            
            # 5. Verify in list view
            list_response = client.get("/api/todos")
            assert list_response.status_code == 200
            list_todos = list_response.json()
            
            list_todo = next((t for t in list_todos if t["id"] == created_todo["id"]), None)
            assert list_todo is not None
            assert list_todo["completed"] == updated_todo["completed"]
            assert list_todo["priority"] == updated_todo["priority"]
            assert list_todo["text"] == updated_todo["text"]
        
        # Verify all consistency checks passed
        for check in consistency_checks:
            assert check["updated_completed"] == check["retrieved_completed"]
            assert check["updated_priority"] == check["retrieved_priority"]
            assert check["updated_text"] == check["retrieved_text"]
    
    def test_timestamp_consistency(self, client, clean_database):
        """Test that timestamps are consistent and logical"""
        
        # Create a todo
        todo_data = {"text": "Timestamp test todo", "priority": "medium"}
        create_response = client.post("/api/todos", json=todo_data)
        assert create_response.status_code == 200
        created_todo = create_response.json()
        
        created_at = datetime.fromisoformat(created_todo["created_at"].replace("Z", "+00:00"))
        updated_at = datetime.fromisoformat(created_todo["updated_at"].replace("Z", "+00:00"))
        
        # Created and updated should be the same initially
        assert abs((created_at - updated_at).total_seconds()) < 1
        
        # Wait a moment
        time.sleep(0.1)
        
        # Update the todo
        update_data = {"completed": True}
        update_response = client.put(f"/api/todos/{created_todo['id']}", json=update_data)
        assert update_response.status_code == 200
        updated_todo = update_response.json()
        
        new_updated_at = datetime.fromisoformat(updated_todo["updated_at"].replace("Z", "+00:00"))
        
        # Updated timestamp should be later
        assert new_updated_at > updated_at
        
        # Created timestamp should remain the same
        new_created_at = datetime.fromisoformat(updated_todo["created_at"].replace("Z", "+00:00"))
        assert abs((created_at - new_created_at).total_seconds()) < 1
    
    def test_statistics_accuracy_workflow(self, client, clean_database):
        """Test that statistics remain accurate through various operations"""
        
        # Create todos with known states
        todos_by_priority = {"high": 5, "medium": 8, "low": 7}
        todos_by_completion = {"completed": 7, "active": 13}
        
        created_todos = []
        
        # Create high priority todos
        for i in range(todos_by_priority["high"]):
            todo_data = {
                "text": f"High priority todo {i}",
                "priority": "high",
                "completed": i < 2  # First 2 completed
            }
            response = client.post("/api/todos", json=todo_data)
            if response.status_code == 200:
                created_todos.append(response.json())
        
        # Create medium priority todos
        for i in range(todos_by_priority["medium"]):
            todo_data = {
                "text": f"Medium priority todo {i}",
                "priority": "medium",
                "completed": i < 3  # First 3 completed
            }
            response = client.post("/api/todos", json=todo_data)
            if response.status_code == 200:
                created_todos.append(response.json())
        
        # Create low priority todos
        for i in range(todos_by_priority["low"]):
            todo_data = {
                "text": f"Low priority todo {i}",
                "priority": "low",
                "completed": i < 2  # First 2 completed
            }
            response = client.post("/api/todos", json=todo_data)
            if response.status_code == 200:
                created_todos.append(response.json())
        
        # Get initial statistics
        stats = client.get("/api/todos/stats/summary").json()
        
        # Verify statistics accuracy
        assert stats["total"] >= 20  # Should have at least our created todos
        assert stats["completed"] >= 7  # Should have at least 7 completed
        assert stats["active"] >= 13  # Should have at least 13 active
        assert stats["active"] + stats["completed"] == stats["total"]
        
        # Verify priority breakdown
        priority_breakdown = stats["priority_breakdown"]
        assert priority_breakdown["high"] >= 5
        assert priority_breakdown["medium"] >= 8
        assert priority_breakdown["low"] >= 7
        
        # Verify completion rate
        expected_completion_rate = (stats["completed"] / stats["total"]) * 100
        assert abs(stats["completion_rate"] - expected_completion_rate) < 0.1
        
        # Perform operations and verify statistics update correctly
        active_todos = [todo for todo in created_todos if not todo["completed"]]
        
        # Complete 3 more todos
        for todo in active_todos[:3]:
            client.patch(f"/api/todos/{todo['id']}/toggle")
        
        # Get updated statistics
        updated_stats = client.get("/api/todos/stats/summary").json()
        
        # Verify statistics updated correctly
        assert updated_stats["completed"] == stats["completed"] + 3
        assert updated_stats["active"] == stats["active"] - 3
        assert updated_stats["total"] == stats["total"]
        
        # Delete some completed todos
        client.delete("/api/todos/completed")
        
        # Get final statistics
        final_stats = client.get("/api/todos/stats/summary").json()
        
        # Verify final state
        assert final_stats["completed"] == 0  # All completed todos should be deleted
        assert final_stats["active"] == final_stats["total"]  # All remaining should be active
