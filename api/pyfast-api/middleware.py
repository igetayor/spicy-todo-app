"""
Middleware for SpicyTodo API
Includes request/response logging and error handling
"""

import time
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger("api.middleware")

class LoggingMiddleware:
    """Middleware for logging API requests and responses"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Extract request information
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # Start timing
        start_time = time.time()
        
        # Log request start
        logger.info(
            "API request started",
            method=method,
            path=path,
            client_ip=client_ip,
            user_agent=user_agent,
            query_params=dict(request.query_params) if request.query_params else None
        )
        
        # Process request
        response_sent = False
        status_code = 500
        
        async def send_wrapper(message):
            nonlocal response_sent, status_code
            
            if message["type"] == "http.response.start":
                status_code = message["status"]
                response_sent = True
                
                # Calculate response time
                response_time = time.time() - start_time
                
                # Log request completion
                log_api_request(
                    logger=logger,
                    method=method,
                    path=path,
                    status_code=status_code,
                    response_time=response_time,
                    user_agent=user_agent,
                    client_ip=client_ip
                )
            
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            # Log error
            response_time = time.time() - start_time
            logger.error(
                "API request failed",
                method=method,
                path=path,
                error=str(e),
                error_type=type(e).__name__,
                response_time=response_time,
                client_ip=client_ip
            )
            
            # Send error response
            if not response_sent:
                error_response = JSONResponse(
                    status_code=500,
                    content={"detail": "Internal server error"}
                )
                await error_response(scope, receive, send)

def log_api_request(
    logger: structlog.BoundLogger,
    method: str,
    path: str,
    status_code: int,
    response_time: float,
    user_agent: str = None,
    client_ip: str = None,
    **kwargs
) -> None:
    """
    Log API request details
    
    Args:
        logger: Logger instance
        method: HTTP method
        path: Request path
        status_code: Response status code
        response_time: Response time in seconds
        user_agent: User agent string
        client_ip: Client IP address
        **kwargs: Additional context
    """
    log_level = "info" if status_code < 400 else "warning" if status_code < 500 else "error"
    
    getattr(logger, log_level)(
        "API request completed",
        method=method,
        path=path,
        status_code=status_code,
        response_time_ms=round(response_time * 1000, 2),
        user_agent=user_agent,
        client_ip=client_ip,
        **kwargs
    )

class ErrorHandlingMiddleware:
    """Middleware for global error handling and logging"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        try:
            await self.app(scope, receive, send)
        except Exception as e:
            logger.error(
                "Unhandled exception in middleware",
                error=str(e),
                error_type=type(e).__name__,
                scope_type=scope.get("type", "unknown")
            )
            
            # Send error response for HTTP requests
            if scope["type"] == "http":
                error_response = JSONResponse(
                    status_code=500,
                    content={"detail": "Internal server error"}
                )
                await error_response(scope, receive, send)
            else:
                raise
