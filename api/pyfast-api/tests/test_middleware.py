"""
Tests for middleware functionality
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import time
from unittest.mock import patch, MagicMock
import structlog

from middleware import LoggingMiddleware, ErrorHandlingMiddleware, log_api_request


class TestLoggingMiddleware:
    """Test LoggingMiddleware functionality"""
    
    def test_middleware_initialization(self):
        """Test middleware can be initialized"""
        app = FastAPI()
        middleware = LoggingMiddleware(app)
        assert middleware.app == app
    
    def test_middleware_skips_non_http_requests(self):
        """Test middleware skips non-HTTP requests"""
        app = FastAPI()
        middleware = LoggingMiddleware(app)
        
        # Mock non-HTTP scope
        scope = {"type": "websocket"}
        receive = MagicMock()
        send = MagicMock()
        
        # Should not raise any errors
        import asyncio
        asyncio.run(middleware(scope, receive, send))
    
    @patch('middleware.logger')
    def test_middleware_logs_http_requests(self, mock_logger):
        """Test middleware logs HTTP requests"""
        app = FastAPI()
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        middleware = LoggingMiddleware(app)
        
        with TestClient(app) as client:
            # Mock the middleware's send_wrapper to avoid actual ASGI call
            with patch.object(middleware, '__call__') as mock_call:
                mock_call.side_effect = lambda scope, receive, send: asyncio.run(app(scope, receive, send))
                
                response = client.get("/test")
                assert response.status_code == 200
    
    @patch('middleware.logger')
    def test_log_api_request_function(self, mock_logger):
        """Test log_api_request helper function"""
        logger = structlog.get_logger("test")
        
        # Test successful request
        log_api_request(logger, "GET", "/test", 200, 0.1)
        mock_logger.info.assert_called()
        
        # Test error request
        log_api_request(logger, "GET", "/test", 500, 0.1)
        mock_logger.error.assert_called()
        
        # Test warning request
        log_api_request(logger, "GET", "/test", 404, 0.1)
        mock_logger.warning.assert_called()
    
    @patch('middleware.logger')
    def test_log_api_request_with_optional_params(self, mock_logger):
        """Test log_api_request with optional parameters"""
        logger = structlog.get_logger("test")
        
        log_api_request(
            logger, 
            "POST", 
            "/api/todos", 
            201, 
            0.2,
            user_agent="test-agent",
            client_ip="127.0.0.1",
            extra_param="extra_value"
        )
        
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args
        assert "user_agent" in call_args[1]
        assert "client_ip" in call_args[1]
        assert "extra_param" in call_args[1]


class TestErrorHandlingMiddleware:
    """Test ErrorHandlingMiddleware functionality"""
    
    def test_middleware_initialization(self):
        """Test middleware can be initialized"""
        app = FastAPI()
        middleware = ErrorHandlingMiddleware(app)
        assert middleware.app == app
    
    @patch('middleware.logger')
    def test_middleware_handles_http_errors(self, mock_logger):
        """Test middleware handles HTTP errors"""
        app = FastAPI()
        
        @app.get("/error")
        async def error_endpoint():
            raise HTTPException(status_code=500, detail="Test error")
        
        middleware = ErrorHandlingMiddleware(app)
        
        # The middleware should catch the exception and log it
        with TestClient(app) as client:
            response = client.get("/error")
            # FastAPI's built-in error handling should handle this
            assert response.status_code == 500
    
    @patch('middleware.logger')
    def test_middleware_handles_non_http_errors(self, mock_logger):
        """Test middleware handles non-HTTP errors"""
        app = FastAPI()
        middleware = ErrorHandlingMiddleware(app)
        
        # Mock non-HTTP scope with error
        scope = {"type": "websocket"}
        receive = MagicMock()
        send = MagicMock()
        
        # Mock the app to raise an exception
        async def error_app(scope, receive, send):
            raise Exception("Test error")
        
        middleware.app = error_app
        
        # Should log the error but re-raise for non-HTTP
        with pytest.raises(Exception, match="Test error"):
            import asyncio
            asyncio.run(middleware(scope, receive, send))
        
        mock_logger.error.assert_called_once()


class TestMiddlewareIntegration:
    """Test middleware integration with FastAPI app"""
    
    def test_middleware_order(self):
        """Test that middleware is applied in correct order"""
        app = FastAPI()
        
        # Add middleware in specific order
        app.add_middleware(ErrorHandlingMiddleware)
        app.add_middleware(LoggingMiddleware)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}
        
        with TestClient(app) as client:
            response = client.get("/test")
            assert response.status_code == 200
            assert response.json() == {"message": "success"}
    
    @patch('middleware.logger')
    def test_middleware_with_cors(self, mock_logger):
        """Test middleware works with CORS"""
        from fastapi.middleware.cors import CORSMiddleware
        
        app = FastAPI()
        
        # Add CORS and our middleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        app.add_middleware(ErrorHandlingMiddleware)
        app.add_middleware(LoggingMiddleware)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "cors test"}
        
        with TestClient(app) as client:
            response = client.get("/test")
            assert response.status_code == 200
            
            # Check CORS headers are present
            assert "access-control-allow-origin" in response.headers
    
    def test_middleware_performance(self):
        """Test middleware doesn't significantly impact performance"""
        app = FastAPI()
        app.add_middleware(LoggingMiddleware)
        
        @app.get("/fast")
        async def fast_endpoint():
            return {"message": "fast"}
        
        with TestClient(app) as client:
            # Measure response time
            start_time = time.time()
            response = client.get("/fast")
            end_time = time.time()
            
            assert response.status_code == 200
            # Should be fast (less than 1 second for simple request)
            assert (end_time - start_time) < 1.0


class TestMiddlewareErrorScenarios:
    """Test middleware error handling scenarios"""
    
    @patch('middleware.logger')
    def test_middleware_handles_malformed_requests(self, mock_logger):
        """Test middleware handles malformed requests gracefully"""
        app = FastAPI()
        app.add_middleware(LoggingMiddleware)
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        with TestClient(app) as client:
            # Test with invalid path
            response = client.get("/nonexistent")
            assert response.status_code == 404
    
    @patch('middleware.logger')
    def test_middleware_handles_large_requests(self, mock_logger):
        """Test middleware handles large requests"""
        app = FastAPI()
        app.add_middleware(LoggingMiddleware)
        
        @app.post("/large")
        async def large_endpoint(request: Request):
            body = await request.body()
            return {"size": len(body)}
        
        with TestClient(app) as client:
            # Send large payload
            large_data = "x" * 10000
            response = client.post("/large", content=large_data)
            assert response.status_code == 200
            assert response.json()["size"] == 10000
    
    @patch('middleware.logger')
    def test_middleware_handles_slow_requests(self, mock_logger):
        """Test middleware handles slow requests"""
        import asyncio
        
        app = FastAPI()
        app.add_middleware(LoggingMiddleware)
        
        @app.get("/slow")
        async def slow_endpoint():
            await asyncio.sleep(0.1)  # 100ms delay
            return {"message": "slow"}
        
        with TestClient(app) as client:
            response = client.get("/slow")
            assert response.status_code == 200
            assert response.json() == {"message": "slow"}
