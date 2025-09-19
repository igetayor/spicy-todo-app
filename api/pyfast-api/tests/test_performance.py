"""
Performance and load tests for the Spicy Todo API
"""

import pytest
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
import json
from datetime import datetime

from main import app


class TestAPIPerformance:
    """Test API performance characteristics"""
    
    def test_root_endpoint_performance(self, client):
        """Test root endpoint response time"""
        start_time = time.time()
        response = client.get("/")
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.1  # Should respond in under 100ms
    
    def test_health_endpoint_performance(self, client):
        """Test health endpoint response time"""
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.1  # Should respond in under 100ms
    
    def test_get_todos_performance(self, client, populated_database):
        """Test get todos endpoint performance"""
        start_time = time.time()
        response = client.get("/api/todos")
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.2  # Should respond in under 200ms
    
    def test_create_todo_performance(self, client, clean_database):
        """Test create todo endpoint performance"""
        todo_data = {
            "text": "Performance test todo",
            "priority": "medium",
            "completed": False
        }
        
        start_time = time.time()
        response = client.post("/api/todos", json=todo_data)
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.3  # Should respond in under 300ms
    
    def test_update_todo_performance(self, client, populated_database):
        """Test update todo endpoint performance"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        
        update_data = {
            "text": "Updated performance test todo",
            "completed": True
        }
        
        start_time = time.time()
        response = client.put(f"/api/todos/{todo_id}", json=update_data)
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.3  # Should respond in under 300ms
    
    def test_delete_todo_performance(self, client, populated_database):
        """Test delete todo endpoint performance"""
        todos = client.get("/api/todos").json()
        todo_id = todos[0]["id"]
        
        start_time = time.time()
        response = client.delete(f"/api/todos/{todo_id}")
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.3  # Should respond in under 300ms
    
    def test_stats_endpoint_performance(self, client, populated_database):
        """Test stats endpoint performance"""
        start_time = time.time()
        response = client.get("/api/todos/stats/summary")
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.2  # Should respond in under 200ms


class TestConcurrentOperations:
    """Test concurrent operation handling"""
    
    def test_concurrent_get_requests(self, client, populated_database):
        """Test handling multiple concurrent GET requests"""
        def make_request():
            response = client.get("/api/todos")
            return response.status_code == 200
        
        # Create multiple threads making requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(20)]
            results = [future.result() for future in as_completed(futures)]
        
        # All requests should succeed
        assert all(results)
        assert len(results) == 20
    
    def test_concurrent_create_requests(self, client, clean_database):
        """Test handling multiple concurrent POST requests"""
        def create_todo(index):
            todo_data = {
                "text": f"Concurrent todo {index}",
                "priority": "medium",
                "completed": False
            }
            response = client.post("/api/todos", json=todo_data)
            return response.status_code == 200
        
        # Create multiple threads making requests
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_todo, i) for i in range(10)]
            results = [future.result() for future in as_completed(futures)]
        
        # All requests should succeed
        assert all(results)
        assert len(results) == 10
        
        # Verify all todos were created
        todos = client.get("/api/todos").json()
        assert len(todos) >= 10  # Should have at least 10 todos
    
    def test_concurrent_update_requests(self, client, populated_database):
        """Test handling multiple concurrent PUT requests"""
        # First, create more todos for concurrent updates
        for i in range(5):
            todo_data = {
                "text": f"Todo for concurrent update {i}",
                "priority": "low",
                "completed": False
            }
            client.post("/api/todos", json=todo_data)
        
        todos = client.get("/api/todos").json()
        
        def update_todo(index):
            if index < len(todos):
                todo_id = todos[index]["id"]
                update_data = {
                    "text": f"Updated concurrently {index}",
                    "completed": True
                }
                response = client.put(f"/api/todos/{todo_id}", json=update_data)
                return response.status_code == 200
            return False
        
        # Create multiple threads making requests
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(update_todo, i) for i in range(len(todos))]
            results = [future.result() for future in as_completed(futures)]
        
        # All valid requests should succeed
        successful_updates = sum(1 for r in results if r)
        assert successful_updates > 0
    
    def test_mixed_concurrent_operations(self, client, clean_database):
        """Test mixed concurrent operations (GET, POST, PUT, DELETE)"""
        def random_operation(index):
            operation = index % 4
            
            if operation == 0:  # GET
                response = client.get("/api/todos")
                return response.status_code == 200
            
            elif operation == 1:  # POST
                todo_data = {
                    "text": f"Mixed operation todo {index}",
                    "priority": "medium",
                    "completed": False
                }
                response = client.post("/api/todos", json=todo_data)
                return response.status_code == 200
            
            elif operation == 2:  # PUT (if todos exist)
                todos = client.get("/api/todos").json()
                if todos:
                    todo_id = todos[0]["id"]
                    update_data = {"completed": True}
                    response = client.put(f"/api/todos/{todo_id}", json=update_data)
                    return response.status_code == 200
                return True  # No todos to update, but that's OK
            
            else:  # DELETE (if todos exist)
                todos = client.get("/api/todos").json()
                if todos:
                    todo_id = todos[0]["id"]
                    response = client.delete(f"/api/todos/{todo_id}")
                    return response.status_code == 200
                return True  # No todos to delete, but that's OK
        
        # Create multiple threads making different operations
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(random_operation, i) for i in range(20)]
            results = [future.result() for future in as_completed(futures)]
        
        # Most operations should succeed (some might fail due to race conditions)
        successful_operations = sum(1 for r in results if r)
        assert successful_operations >= 15  # At least 75% should succeed


class TestLoadHandling:
    """Test load handling capabilities"""
    
    def test_large_number_of_todos(self, client, clean_database):
        """Test handling a large number of todos"""
        # Create many todos
        for i in range(100):
            todo_data = {
                "text": f"Load test todo {i}",
                "priority": "medium",
                "completed": i % 2 == 0
            }
            response = client.post("/api/todos", json=todo_data)
            assert response.status_code == 200
        
        # Test that we can retrieve all todos
        start_time = time.time()
        response = client.get("/api/todos")
        end_time = time.time()
        
        assert response.status_code == 200
        todos = response.json()
        assert len(todos) >= 100
        
        # Should still respond reasonably quickly
        response_time = end_time - start_time
        assert response_time < 2.0  # Under 2 seconds for 100+ todos
    
    def test_large_todo_text(self, client, clean_database):
        """Test handling todos with large text content"""
        large_text = "This is a very long todo text. " * 50  # ~1750 characters
        
        todo_data = {
            "text": large_text,
            "priority": "high",
            "completed": False
        }
        
        start_time = time.time()
        response = client.post("/api/todos", json=todo_data)
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 0.5  # Should handle large text quickly
        
        # Verify the large text was stored correctly
        created_todo = response.json()
        assert len(created_todo["text"]) == len(large_text)
    
    def test_complex_filtering_performance(self, client, populated_database):
        """Test performance of complex filtering operations"""
        # Create diverse todos for filtering
        for i in range(50):
            todo_data = {
                "text": f"Filter test todo {i} with priority {i % 3}",
                "priority": ["low", "medium", "high"][i % 3],
                "completed": i % 3 == 0
            }
            client.post("/api/todos", json=todo_data)
        
        # Test various filter combinations
        filter_tests = [
            ("?filter=active&priority=high", "Active high priority todos"),
            ("?search=priority&filter=completed", "Completed todos with 'priority' in text"),
            ("?search=test&priority=medium&filter=active", "Active medium priority todos with 'test'"),
        ]
        
        for filter_params, description in filter_tests:
            start_time = time.time()
            response = client.get(f"/api/todos{filter_params}")
            end_time = time.time()
            
            assert response.status_code == 200, f"Failed for {description}"
            response_time = end_time - start_time
            assert response_time < 0.5, f"Too slow for {description}: {response_time:.3f}s"
    
    def test_stats_calculation_performance(self, client, populated_database):
        """Test performance of statistics calculation"""
        # Create many todos with different properties
        for i in range(200):
            todo_data = {
                "text": f"Stats test todo {i}",
                "priority": ["low", "medium", "high"][i % 3],
                "completed": i % 4 == 0  # 25% completed
            }
            client.post("/api/todos", json=todo_data)
        
        # Test stats calculation performance
        start_time = time.time()
        response = client.get("/api/todos/stats/summary")
        end_time = time.time()
        
        assert response.status_code == 200
        stats = response.json()
        
        # Verify stats are calculated correctly
        assert stats["total"] >= 200
        assert stats["completion_rate"] >= 0
        assert stats["completion_rate"] <= 100
        
        # Should calculate stats quickly even with many todos
        response_time = end_time - start_time
        assert response_time < 1.0  # Under 1 second for 200+ todos


class TestMemoryUsage:
    """Test memory usage patterns"""
    
    def test_memory_doesnt_grow_excessively(self, client, clean_database):
        """Test that memory usage doesn't grow excessively with operations"""
        # This is a basic test - in a real scenario, you'd use memory profiling tools
        
        # Perform many operations
        for i in range(100):
            # Create todo
            todo_data = {
                "text": f"Memory test todo {i}",
                "priority": "medium",
                "completed": False
            }
            response = client.post("/api/todos", json=todo_data)
            assert response.status_code == 200
            
            # Update todo
            todo_id = response.json()["id"]
            update_data = {"completed": True}
            response = client.put(f"/api/todos/{todo_id}", json=update_data)
            assert response.status_code == 200
            
            # Delete some todos to prevent unlimited growth
            if i % 10 == 0:
                todos = client.get("/api/todos").json()
                if len(todos) > 50:
                    # Delete oldest half
                    for todo in todos[:len(todos)//2]:
                        client.delete(f"/api/todos/{todo['id']}")
        
        # Final verification that API still works
        response = client.get("/api/todos")
        assert response.status_code == 200
        
        response = client.get("/health")
        assert response.status_code == 200


class TestErrorHandlingPerformance:
    """Test error handling doesn't significantly impact performance"""
    
    def test_404_handling_performance(self, client, populated_database):
        """Test that 404 errors are handled quickly"""
        start_time = time.time()
        response = client.get("/api/todos/nonexistent-id")
        end_time = time.time()
        
        assert response.status_code == 404
        response_time = end_time - start_time
        assert response_time < 0.1  # 404s should be fast
    
    def test_validation_error_performance(self, client, clean_database):
        """Test that validation errors are handled quickly"""
        invalid_data = {
            "text": "",  # Invalid empty text
            "priority": "invalid_priority"
        }
        
        start_time = time.time()
        response = client.post("/api/todos", json=invalid_data)
        end_time = time.time()
        
        assert response.status_code == 422
        response_time = end_time - start_time
        assert response_time < 0.1  # Validation errors should be fast
    
    def test_concurrent_error_scenarios(self, client, populated_database):
        """Test concurrent error scenarios don't cause issues"""
        def make_invalid_request(index):
            if index % 2 == 0:
                # 404 error
                response = client.get(f"/api/todos/invalid-id-{index}")
                return response.status_code == 404
            else:
                # Validation error
                invalid_data = {"text": ""}
                response = client.post("/api/todos", json=invalid_data)
                return response.status_code == 422
        
        # Create multiple threads making invalid requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_invalid_request, i) for i in range(20)]
            results = [future.result() for future in as_completed(futures)]
        
        # All error responses should be correct
        assert all(results)
        assert len(results) == 20
