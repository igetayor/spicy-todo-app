"""
Logging configuration for SpicyTodo API
Provides structured logging with different levels and outputs
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import structlog
from colorama import Fore, Style, init

# Initialize colorama for colored console output
init(autoreset=True)

# Log levels
LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

# Color mapping for different log levels
LOG_COLORS = {
    "DEBUG": Fore.CYAN,
    "INFO": Fore.GREEN,
    "WARNING": Fore.YELLOW,
    "ERROR": Fore.RED,
    "CRITICAL": Fore.MAGENTA + Style.BRIGHT,
}

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output"""
    
    def format(self, record):
        # Add color to the level name
        if record.levelname in LOG_COLORS:
            record.levelname = f"{LOG_COLORS[record.levelname]}{record.levelname}{Style.RESET_ALL}"
        
        # Add color to the message for ERROR and CRITICAL
        if record.levelno >= logging.ERROR:
            record.msg = f"{Fore.RED}{record.msg}{Style.RESET_ALL}"
        
        return super().format(record)

def setup_logging(
    log_level: str = "INFO",
    log_file: str = None,
    log_dir: str = "logs",
    enable_console: bool = True,
    enable_file: bool = True,
    enable_json: bool = False
) -> None:
    """
    Setup structured logging for the application
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Log file name (default: auto-generated)
        log_dir: Directory for log files
        enable_console: Enable console logging
        enable_file: Enable file logging
        enable_json: Use JSON format for logs
    """
    
    # Create logs directory if it doesn't exist
    if enable_file:
        Path(log_dir).mkdir(exist_ok=True)
    
    # Generate log file name if not provided
    if log_file is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = f"spicy_todo_api_{timestamp}.log"
    
    log_file_path = Path(log_dir) / log_file
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if enable_json else structlog.dev.ConsoleRenderer(colors=True),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVELS.get(log_level.upper(), logging.INFO))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(LOG_LEVELS.get(log_level.upper(), logging.INFO))
        
        if enable_json:
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        else:
            console_formatter = ColoredFormatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        
        console_handler.setFormatter(console_formatter)
        root_logger.addHandler(console_handler)
    
    # File handler with rotation
    if enable_file:
        file_handler = logging.handlers.RotatingFileHandler(
            log_file_path,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(LOG_LEVELS.get(log_level.upper(), logging.INFO))
        
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
    
    # Error file handler (separate file for errors)
    if enable_file:
        error_file_handler = logging.handlers.RotatingFileHandler(
            Path(log_dir) / f"error_{log_file}",
            maxBytes=5 * 1024 * 1024,  # 5MB
            backupCount=3,
            encoding='utf-8'
        )
        error_file_handler.setLevel(logging.ERROR)
        error_file_handler.setFormatter(file_formatter)
        root_logger.addHandler(error_file_handler)
    
    # Configure uvicorn logging
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    
    # Configure FastAPI logging
    logging.getLogger("fastapi").setLevel(logging.INFO)
    
    # Log the logging setup
    logger = structlog.get_logger("logging_setup")
    logger.info(
        "Logging system initialized",
        log_level=log_level,
        console_enabled=enable_console,
        file_enabled=enable_file,
        log_file=str(log_file_path) if enable_file else None,
        json_format=enable_json
    )

def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a structured logger instance
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Structured logger instance
    """
    return structlog.get_logger(name)

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

def log_database_operation(
    logger: structlog.BoundLogger,
    operation: str,
    table: str = "todos",
    record_id: str = None,
    success: bool = True,
    error: str = None,
    **kwargs
) -> None:
    """
    Log database operations
    
    Args:
        logger: Logger instance
        operation: Database operation (CREATE, READ, UPDATE, DELETE)
        table: Table name
        record_id: Record ID
        success: Operation success status
        error: Error message if failed
        **kwargs: Additional context
    """
    log_level = "info" if success else "error"
    
    getattr(logger, log_level)(
        f"Database {operation.lower()} operation",
        operation=operation,
        table=table,
        record_id=record_id,
        success=success,
        error=error,
        **kwargs
    )

def log_business_logic(
    logger: structlog.BoundLogger,
    event: str,
    user_action: str = None,
    data_changed: bool = False,
    **kwargs
) -> None:
    """
    Log business logic events
    
    Args:
        logger: Logger instance
        event: Event description
        user_action: User action performed
        data_changed: Whether data was modified
        **kwargs: Additional context
    """
    logger.info(
        "Business logic event",
        event=event,
        user_action=user_action,
        data_changed=data_changed,
        **kwargs
    )

# Environment-based logging configuration
def setup_environment_logging() -> None:
    """Setup logging based on environment variables"""
    
    # Get configuration from environment
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_dir = os.getenv("LOG_DIR", "logs")
    enable_console = os.getenv("LOG_CONSOLE", "true").lower() == "true"
    enable_file = os.getenv("LOG_FILE", "true").lower() == "true"
    enable_json = os.getenv("LOG_JSON", "false").lower() == "true"
    
    # Setup logging
    setup_logging(
        log_level=log_level,
        log_dir=log_dir,
        enable_console=enable_console,
        enable_file=enable_file,
        enable_json=enable_json
    )

# Initialize logging on module import
setup_environment_logging()
