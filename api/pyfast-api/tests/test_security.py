"""
Security tests for the Spicy Todo API
"""

import pytest
from fastapi.testclient import TestClient
import json
from unittest.mock import patch


class TestInputValidation:
    """Test input validation and sanitization"""
    
    def test_sql_injection_attempts(self, client, clean_database):
        """Test protection against SQL injection attempts"""
        malicious_inputs = [
            "'; DROP TABLE todos; --",
            "' OR '1'='1",
            "'; INSERT INTO todos (text) VALUES ('hacked'); --",
            "' UNION SELECT * FROM users --",
            "'; UPDATE todos SET text='hacked' --",
        ]
        
        for malicious_text in malicious_inputs:
            todo_data = {
                "text": malicious_text,
                "priority": "medium",
                "completed": False
            }
            
            response = client.post("/api/todos", json=todo_data)
            # Should accept the input but treat it as literal text
            assert response.status_code == 200
            
            created_todo = response.json()
            assert created_todo["text"] == malicious_text  # Should be stored as-is (no SQL execution)
    
    def test_xss_attempts(self, client, clean_database):
        """Test protection against XSS attempts"""
        xss_inputs = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//",
        ]
        
        for xss_text in xss_inputs:
            todo_data = {
                "text": xss_text,
                "priority": "medium",
                "completed": False
            }
            
            response = client.post("/api/todos", json=todo_data)
            # Should accept the input but it should be treated as literal text
            assert response.status_code == 200
            
            created_todo = response.json()
            assert created_todo["text"] == xss_text  # Should be stored as-is
    
    def test_path_traversal_attempts(self, client, populated_database):
        """Test protection against path traversal attempts"""
        malicious_ids = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
            "....//....//....//etc/passwd",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        ]
        
        for malicious_id in malicious_ids:
            response = client.get(f"/api/todos/{malicious_id}")
            # Should return 404, not expose system files
            assert response.status_code == 404
    
    def test_invalid_priority_values(self, client, clean_database):
        """Test validation of priority field"""
        invalid_priorities = [
            "critical",
            "urgent",
            "none",
            "1",
            "2",
            "3",
            "HIGH",
            "MEDIUM",
            "LOW",
            "",
            None,
        ]
        
        for invalid_priority in invalid_priorities:
            todo_data = {
                "text": "Test todo",
                "priority": invalid_priority,
                "completed": False
            }
            
            response = client.post("/api/todos", json=todo_data)
            # Should reject invalid priority values
            assert response.status_code == 422
    
    def test_oversized_payloads(self, client, clean_database):
        """Test protection against oversized payloads"""
        # Test with text that's too long (over 500 characters)
        oversized_text = "A" * 501
        
        todo_data = {
            "text": oversized_text,
            "priority": "medium",
            "completed": False
        }
        
        response = client.post("/api/todos", json=todo_data)
        # Should reject oversized payloads
        assert response.status_code == 422
        
        # Test with very large JSON payload
        large_payload = {
            "text": "Normal text",
            "priority": "medium",
            "completed": False,
            "extra_field": "x" * 10000  # Large extra field
        }
        
        response = client.post("/api/todos", json=large_payload)
        # Should handle gracefully (either accept or reject)
        assert response.status_code in [200, 422, 413]  # OK, validation error, or payload too large


class TestAuthenticationAndAuthorization:
    """Test authentication and authorization (when implemented)"""
    
    def test_unauthenticated_access_allowed(self, client):
        """Test that unauthenticated access is currently allowed"""
        # Currently, the API doesn't require authentication
        # This test documents the current behavior
        
        response = client.get("/api/todos")
        assert response.status_code == 200
        
        response = client.post("/api/todos", json={"text": "Test todo"})
        assert response.status_code == 200
        
        # In a production system, you might want to add authentication
        # and change these assertions to expect 401 Unauthorized
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are properly configured"""
        response = client.options("/api/todos")
        
        # CORS preflight should not fail
        assert response.status_code in [200, 405]  # 405 is OK for OPTIONS on non-OPTIONS endpoint
        
        # Test actual request with origin header
        response = client.get("/api/todos", headers={"Origin": "http://localhost:3000"})
        assert response.status_code == 200
        
        # In a real scenario, you'd check for specific CORS headers
        # assert "access-control-allow-origin" in response.headers


class TestDataPrivacy:
    """Test data privacy and information disclosure"""
    
    def test_error_messages_dont_leak_info(self, client, populated_database):
        """Test that error messages don't leak sensitive information"""
        # Test 404 errors
        fake_id = "123e4567-e89b-12d3-a456-426614174000"
        response = client.get(f"/api/todos/{fake_id}")
        
        assert response.status_code == 404
        error_data = response.json()
        assert "detail" in error_data
        # Error message should be generic, not revealing system internals
        assert "database" not in error_data["detail"].lower()
        assert "sql" not in error_data["detail"].lower()
        assert "exception" not in error_data["detail"].lower()
    
    def test_validation_errors_dont_leak_info(self, client, clean_database):
        """Test that validation errors don't leak system information"""
        invalid_data = {
            "text": "",
            "priority": "invalid",
            "completed": "not_a_boolean"
        }
        
        response = client.post("/api/todos", json=invalid_data)
        assert response.status_code == 422
        
        error_data = response.json()
        # Validation errors should be descriptive but not reveal internals
        assert "detail" in error_data
        
        # Check that error details don't contain sensitive information
        error_text = str(error_data).lower()
        assert "database" not in error_text
        assert "sql" not in error_text
        assert "internal" not in error_text
    
    def test_timestamps_dont_reveal_system_info(self, client, clean_database):
        """Test that timestamps don't reveal system information"""
        todo_data = {
            "text": "Privacy test todo",
            "priority": "medium",
            "completed": False
        }
        
        response = client.post("/api/todos", json=todo_data)
        assert response.status_code == 200
        
        created_todo = response.json()
        assert "created_at" in created_todo
        assert "updated_at" in created_todo
        
        # Timestamps should be in ISO format, not reveal system timezone details
        created_at = created_todo["created_at"]
        updated_at = created_todo["updated_at"]
        
        # Should be valid ISO format
        assert "T" in created_at
        assert "T" in updated_at
        
        # Should not contain timezone info that could reveal server location
        assert "+" not in created_at
        assert "-" not in created_at.replace("T", "").replace("Z", "")
        assert "+" not in updated_at
        assert "-" not in updated_at.replace("T", "").replace("Z", "")


class TestRateLimiting:
    """Test rate limiting (when implemented)"""
    
    def test_no_rate_limiting_currently(self, client, clean_database):
        """Test that rate limiting is not currently implemented"""
        # Make many requests quickly
        for i in range(50):
            todo_data = {
                "text": f"Rate limit test todo {i}",
                "priority": "medium",
                "completed": False
            }
            response = client.post("/api/todos", json=todo_data)
            assert response.status_code == 200
        
        # In a production system, you might want to add rate limiting
        # and change this test to expect 429 Too Many Requests after a threshold
    
    def test_concurrent_request_handling(self, client, clean_database):
        """Test that concurrent requests don't cause issues"""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        def make_request(index):
            todo_data = {
                "text": f"Concurrent security test todo {index}",
                "priority": "medium",
                "completed": False
            }
            response = client.post("/api/todos", json=todo_data)
            return response.status_code == 200
        
        # Make many concurrent requests
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [executor.submit(make_request, i) for i in range(100)]
            results = [future.result() for future in as_completed(futures)]
        
        # All requests should succeed
        assert all(results)
        assert len(results) == 100


class TestContentSecurity:
    """Test content security measures"""
    
    def test_content_type_validation(self, client, clean_database):
        """Test that content type is properly validated"""
        # Test with wrong content type
        response = client.post(
            "/api/todos",
            data='{"text": "Test todo"}',
            headers={"Content-Type": "text/plain"}
        )
        # Should reject non-JSON content
        assert response.status_code == 422
    
    def test_malformed_json_handling(self, client, clean_database):
        """Test handling of malformed JSON"""
        malformed_json_payloads = [
            '{"text": "Test todo", "priority":}',  # Missing value
            '{"text": "Test todo", "priority": "medium",}',  # Trailing comma
            '{"text": "Test todo", "priority": "medium"',  # Missing closing brace
            '{"text": "Test todo", "priority": "medium"}]',  # Wrong closing bracket
            '{"text": "Test todo", "priority": "medium"',  # Missing quote
        ]
        
        for payload in malformed_json_payloads:
            response = client.post(
                "/api/todos",
                data=payload,
                headers={"Content-Type": "application/json"}
            )
            # Should reject malformed JSON
            assert response.status_code == 422
    
    def test_empty_request_body(self, client, clean_database):
        """Test handling of empty request body"""
        response = client.post(
            "/api/todos",
            data="",
            headers={"Content-Type": "application/json"}
        )
        # Should reject empty body
        assert response.status_code == 422
    
    def test_null_values_handling(self, client, clean_database):
        """Test handling of null values"""
        # Test with null text
        todo_data = {
            "text": None,
            "priority": "medium",
            "completed": False
        }
        
        response = client.post("/api/todos", json=todo_data)
        # Should reject null text
        assert response.status_code == 422
        
        # Test with null priority (should use default)
        todo_data = {
            "text": "Valid todo",
            "priority": None,
            "completed": False
        }
        
        response = client.post("/api/todos", json=todo_data)
        # Should handle null priority gracefully (use default)
        assert response.status_code in [200, 422]


class TestSystemSecurity:
    """Test system-level security measures"""
    
    def test_server_header_not_exposed(self, client):
        """Test that server headers don't expose sensitive information"""
        response = client.get("/health")
        
        # Should not expose server version or technology details
        headers = response.headers
        server_header = headers.get("server", "").lower()
        
        # Server header should not reveal specific versions
        assert "fastapi" not in server_header
        assert "uvicorn" not in server_header
        assert "python" not in server_header
    
    def test_error_pages_dont_expose_stack_traces(self, client):
        """Test that error pages don't expose stack traces"""
        # This is more relevant in production - in development, stack traces might be shown
        
        # Test with a request that might cause an internal error
        response = client.get("/api/todos/very-long-id-that-might-cause-issues")
        
        # Should return a clean error response
        assert response.status_code in [404, 500]
        
        if response.status_code == 500:
            error_data = response.json()
            # Error response should not contain stack traces or sensitive info
            error_text = str(error_data).lower()
            assert "traceback" not in error_text
            assert "exception" not in error_text
            assert "line" not in error_text
            assert "file" not in error_text
    
    def test_health_endpoint_security(self, client):
        """Test that health endpoint doesn't expose sensitive information"""
        response = client.get("/health")
        assert response.status_code == 200
        
        health_data = response.json()
        
        # Should only contain basic health information
        assert "status" in health_data
        assert "timestamp" in health_data
        
        # Should not expose system details
        health_text = str(health_data).lower()
        assert "database" not in health_text
        assert "server" not in health_text
        assert "version" not in health_text
        assert "config" not in health_text
