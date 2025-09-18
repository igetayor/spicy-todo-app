"""
Tests for logging configuration and utilities
"""

import pytest
import os
import tempfile
import logging
from pathlib import Path
from unittest.mock import patch, MagicMock, call
import structlog

from logging_config import (
    setup_logging, get_logger, log_api_request, log_database_operation,
    log_business_logic, setup_environment_logging, ColoredFormatter,
    LOG_LEVELS, LOG_COLORS
)


class TestLogLevelsAndColors:
    """Test log level and color constants"""
    
    def test_log_levels_defined(self):
        """Test that all log levels are properly defined"""
        expected_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        
        for level in expected_levels:
            assert level in LOG_LEVELS
            assert LOG_LEVELS[level] == getattr(logging, level)
    
    def test_log_colors_defined(self):
        """Test that all log colors are properly defined"""
        expected_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        
        for level in expected_levels:
            assert level in LOG_COLORS
            assert isinstance(LOG_COLORS[level], str)


class TestColoredFormatter:
    """Test ColoredFormatter functionality"""
    
    def test_colored_formatter_initialization(self):
        """Test ColoredFormatter can be initialized"""
        formatter = ColoredFormatter('%(levelname)s - %(message)s')
        assert formatter is not None
    
    def test_colored_formatter_formats_records(self):
        """Test ColoredFormatter formats log records"""
        formatter = ColoredFormatter('%(levelname)s - %(message)s')
        
        # Create a mock record
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname="",
            lineno=0,
            msg="Test message",
            args=(),
            exc_info=None
        )
        
        formatted = formatter.format(record)
        assert "INFO" in formatted
        assert "Test message" in formatted


class TestLoggingSetup:
    """Test logging setup functionality"""
    
    def test_setup_logging_minimal(self):
        """Test minimal logging setup"""
        with tempfile.TemporaryDirectory() as temp_dir:
            setup_logging(
                log_level="INFO",
                log_dir=temp_dir,
                enable_console=False,
                enable_file=True,
                enable_json=False
            )
            
            # Check that log file was created
            log_files = list(Path(temp_dir).glob("*.log"))
            assert len(log_files) > 0
    
    def test_setup_logging_with_console(self):
        """Test logging setup with console output"""
        with patch('sys.stdout') as mock_stdout:
            setup_logging(
                log_level="DEBUG",
                enable_console=True,
                enable_file=False,
                enable_json=False
            )
            
            # Test that console handler was added
            root_logger = logging.getLogger()
            console_handlers = [h for h in root_logger.handlers if isinstance(h, logging.StreamHandler)]
            assert len(console_handlers) > 0
    
    def test_setup_logging_json_format(self):
        """Test logging setup with JSON format"""
        with tempfile.TemporaryDirectory() as temp_dir:
            setup_logging(
                log_level="INFO",
                log_dir=temp_dir,
                enable_console=True,
                enable_file=True,
                enable_json=True
            )
            
            # Test that JSON formatter is used
            root_logger = logging.getLogger()
            assert len(root_logger.handlers) > 0
    
    def test_setup_logging_custom_file(self):
        """Test logging setup with custom log file"""
        with tempfile.TemporaryDirectory() as temp_dir:
            custom_log_file = "custom_test.log"
            
            setup_logging(
                log_level="WARNING",
                log_file=custom_log_file,
                log_dir=temp_dir,
                enable_console=False,
                enable_file=True
            )
            
            # Check that custom log file was created
            log_file_path = Path(temp_dir) / custom_log_file
            assert log_file_path.exists()
    
    def test_setup_logging_creates_directories(self):
        """Test that setup_logging creates necessary directories"""
        with tempfile.TemporaryDirectory() as temp_dir:
            nested_dir = Path(temp_dir) / "nested" / "logs"
            
            setup_logging(
                log_level="INFO",
                log_dir=str(nested_dir),
                enable_console=False,
                enable_file=True
            )
            
            assert nested_dir.exists()
            assert nested_dir.is_dir()


class TestLoggerUtilities:
    """Test logger utility functions"""
    
    def test_get_logger_returns_structlog_logger(self):
        """Test get_logger returns structured logger"""
        logger = get_logger("test.module")
        
        assert isinstance(logger, structlog.BoundLogger)
        assert logger._context == {}
    
    def test_get_logger_different_names(self):
        """Test get_logger with different names"""
        logger1 = get_logger("module1")
        logger2 = get_logger("module2")
        
        assert logger1 != logger2
    
    @patch('logging_config.structlog.get_logger')
    def test_get_logger_calls_structlog(self, mock_get_logger):
        """Test get_logger calls structlog.get_logger"""
        mock_logger = MagicMock()
        mock_get_logger.return_value = mock_logger
        
        result = get_logger("test")
        
        mock_get_logger.assert_called_once_with("test")
        assert result == mock_logger


class TestLoggingFunctions:
    """Test logging helper functions"""
    
    def test_log_api_request_success(self):
        """Test log_api_request for successful requests"""
        with patch('logging_config.structlog.get_logger') as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger
            
            logger = get_logger("test")
            
            log_api_request(logger, "GET", "/test", 200, 0.1)
            
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args[1]
            assert call_args["method"] == "GET"
            assert call_args["path"] == "/test"
            assert call_args["status_code"] == 200
            assert call_args["response_time_ms"] == 100.0
    
    def test_log_api_request_error(self):
        """Test log_api_request for error requests"""
        with patch('logging_config.structlog.get_logger') as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger
            
            logger = get_logger("test")
            
            log_api_request(logger, "POST", "/error", 500, 0.2)
            
            mock_logger.error.assert_called_once()
            call_args = mock_logger.error.call_args[1]
            assert call_args["status_code"] == 500
    
    def test_log_api_request_warning(self):
        """Test log_api_request for warning requests"""
        with patch('logging_config.structlog.get_logger') as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger
            
            logger = get_logger("test")
            
            log_api_request(logger, "GET", "/notfound", 404, 0.05)
            
            mock_logger.warning.assert_called_once()
            call_args = mock_logger.warning.call_args[1]
            assert call_args["status_code"] == 404
    
    def test_log_database_operation_success(self):
        """Test log_database_operation for successful operations"""
        with patch('logging_config.structlog.get_logger') as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger
            
            logger = get_logger("test")
            
            log_database_operation(
                logger, 
                "CREATE", 
                "todos", 
                "123", 
                True
            )
            
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args[1]
            assert call_args["operation"] == "CREATE"
            assert call_args["table"] == "todos"
            assert call_args["record_id"] == "123"
            assert call_args["success"] is True
    
    def test_log_database_operation_failure(self):
        """Test log_database_operation for failed operations"""
        with patch('logging_config.structlog.get_logger') as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger
            
            logger = get_logger("test")
            
            log_database_operation(
                logger, 
                "DELETE", 
                "todos", 
                "456", 
                False,
                "Record not found"
            )
            
            mock_logger.error.assert_called_once()
            call_args = mock_logger.error.call_args[1]
            assert call_args["operation"] == "DELETE"
            assert call_args["success"] is False
            assert call_args["error"] == "Record not found"
    
    def test_log_business_logic(self):
        """Test log_business_logic function"""
        with patch('logging_config.structlog.get_logger') as mock_get_logger:
            mock_logger = MagicMock()
            mock_get_logger.return_value = mock_logger
            
            logger = get_logger("test")
            
            log_business_logic(
                logger,
                "User created todo",
                "create_todo",
                True,
                user_id="123",
                todo_text="Test todo"
            )
            
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args[1]
            assert call_args["event"] == "User created todo"
            assert call_args["user_action"] == "create_todo"
            assert call_args["data_changed"] is True
            assert call_args["user_id"] == "123"
            assert call_args["todo_text"] == "Test todo"


class TestEnvironmentLogging:
    """Test environment-based logging configuration"""
    
    @patch.dict(os.environ, {
        'LOG_LEVEL': 'DEBUG',
        'LOG_DIR': '/tmp/test_logs',
        'LOG_CONSOLE': 'true',
        'LOG_FILE': 'false',
        'LOG_JSON': 'true'
    })
    @patch('logging_config.setup_logging')
    def test_setup_environment_logging_with_env_vars(self, mock_setup):
        """Test setup_environment_logging reads environment variables"""
        setup_environment_logging()
        
        mock_setup.assert_called_once_with(
            log_level='DEBUG',
            log_dir='/tmp/test_logs',
            enable_console=True,
            enable_file=False,
            enable_json=True
        )
    
    @patch.dict(os.environ, {}, clear=True)
    @patch('logging_config.setup_logging')
    def test_setup_environment_logging_defaults(self, mock_setup):
        """Test setup_environment_logging uses defaults when no env vars"""
        setup_environment_logging()
        
        mock_setup.assert_called_once_with(
            log_level='INFO',
            log_dir='logs',
            enable_console=True,
            enable_file=True,
            enable_json=False
        )
    
    @patch.dict(os.environ, {
        'LOG_CONSOLE': 'false',
        'LOG_FILE': 'true',
        'LOG_JSON': 'false'
    })
    @patch('logging_config.setup_logging')
    def test_setup_environment_logging_boolean_conversion(self, mock_setup):
        """Test setup_environment_logging converts string booleans"""
        setup_environment_logging()
        
        mock_setup.assert_called_once()
        call_args = mock_setup.call_args[1]
        assert call_args['enable_console'] is False
        assert call_args['enable_file'] is True
        assert call_args['enable_json'] is False


class TestLoggingIntegration:
    """Test logging integration scenarios"""
    
    def test_logging_with_real_logger(self):
        """Test logging with actual logger instance"""
        with tempfile.TemporaryDirectory() as temp_dir:
            setup_logging(
                log_level="INFO",
                log_dir=temp_dir,
                enable_console=False,
                enable_file=True
            )
            
            logger = get_logger("integration.test")
            
            # Test that we can actually log messages
            logger.info("Test message", extra_data="test")
            
            # Check that log file was written to
            log_files = list(Path(temp_dir).glob("*.log"))
            assert len(log_files) > 0
            
            # Read the log file and check content
            with open(log_files[0], 'r') as f:
                log_content = f.read()
                assert "Test message" in log_content
    
    def test_multiple_loggers(self):
        """Test multiple logger instances work correctly"""
        with tempfile.TemporaryDirectory() as temp_dir:
            setup_logging(
                log_level="DEBUG",
                log_dir=temp_dir,
                enable_console=False,
                enable_file=True
            )
            
            logger1 = get_logger("module1")
            logger2 = get_logger("module2")
            
            logger1.info("Message from module1")
            logger2.warning("Message from module2")
            
            # Check both messages are in log file
            log_files = list(Path(temp_dir).glob("*.log"))
            with open(log_files[0], 'r') as f:
                log_content = f.read()
                assert "Message from module1" in log_content
                assert "Message from module2" in log_content
    
    def test_logging_performance(self):
        """Test that logging doesn't significantly impact performance"""
        import time
        
        with tempfile.TemporaryDirectory() as temp_dir:
            setup_logging(
                log_level="INFO",
                log_dir=temp_dir,
                enable_console=False,
                enable_file=True
            )
            
            logger = get_logger("performance.test")
            
            # Measure time for multiple log operations
            start_time = time.time()
            for i in range(100):
                logger.info(f"Performance test message {i}")
            end_time = time.time()
            
            # Should complete quickly (less than 1 second for 100 messages)
            assert (end_time - start_time) < 1.0
