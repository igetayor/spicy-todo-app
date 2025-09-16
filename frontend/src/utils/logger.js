/**
 * Logging utility for SpicyTodo frontend
 * Provides structured logging with different levels and console/file output
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Color mapping for console output
const LOG_COLORS = {
  DEBUG: '#00BCD4',
  INFO: '#4CAF50',
  WARN: '#FF9800',
  ERROR: '#F44336',
  CRITICAL: '#E91E63'
};

class Logger {
  constructor(name, level = 'INFO') {
    this.name = name;
    this.level = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      logger: this.name,
      message,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    return logEntry;
  }

  /**
   * Get colored console output
   */
  getColoredMessage(level, message) {
    const color = LOG_COLORS[level] || LOG_COLORS.INFO;
    return `%c[${level}] %c[${this.name}] %c${message}`;
  }

  /**
   * Get console styles for colored output
   */
  getConsoleStyles(level) {
    const color = LOG_COLORS[level] || LOG_COLORS.INFO;
    return [
      `color: ${color}; font-weight: bold;`,
      'color: #666; font-size: 0.9em;',
      'color: #333;'
    ];
  }

  /**
   * Log a debug message
   */
  debug(message, context = {}) {
    if (this.level <= LOG_LEVELS.DEBUG) {
      const logEntry = this.formatMessage('DEBUG', message, context);
      console.debug(
        this.getColoredMessage('DEBUG', message),
        ...this.getConsoleStyles('DEBUG'),
        context
      );
      this.sendToServer(logEntry);
    }
  }

  /**
   * Log an info message
   */
  info(message, context = {}) {
    if (this.level <= LOG_LEVELS.INFO) {
      const logEntry = this.formatMessage('INFO', message, context);
      console.info(
        this.getColoredMessage('INFO', message),
        ...this.getConsoleStyles('INFO'),
        context
      );
      this.sendToServer(logEntry);
    }
  }

  /**
   * Log a warning message
   */
  warn(message, context = {}) {
    if (this.level <= LOG_LEVELS.WARN) {
      const logEntry = this.formatMessage('WARN', message, context);
      console.warn(
        this.getColoredMessage('WARN', message),
        ...this.getConsoleStyles('WARN'),
        context
      );
      this.sendToServer(logEntry);
    }
  }

  /**
   * Log an error message
   */
  error(message, context = {}) {
    if (this.level <= LOG_LEVELS.ERROR) {
      const logEntry = this.formatMessage('ERROR', message, context);
      console.error(
        this.getColoredMessage('ERROR', message),
        ...this.getConsoleStyles('ERROR'),
        context
      );
      this.sendToServer(logEntry);
    }
  }

  /**
   * Log a critical message
   */
  critical(message, context = {}) {
    if (this.level <= LOG_LEVELS.CRITICAL) {
      const logEntry = this.formatMessage('CRITICAL', message, context);
      console.error(
        this.getColoredMessage('CRITICAL', message),
        ...this.getConsoleStyles('CRITICAL'),
        context
      );
      this.sendToServer(logEntry);
    }
  }

  /**
   * Send log to server (if API endpoint exists)
   */
  async sendToServer(logEntry) {
    try {
      // Only send ERROR and CRITICAL logs to server
      if (logEntry.level === 'ERROR' || logEntry.level === 'CRITICAL') {
        const response = await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry)
        });
        
        if (!response.ok) {
          console.warn('Failed to send log to server:', response.status);
        }
      }
    } catch (error) {
      // Silently fail - don't create infinite logging loops
      console.warn('Failed to send log to server:', error.message);
    }
  }

  /**
   * Log API requests
   */
  logApiRequest(method, url, status, duration, error = null) {
    const context = {
      method,
      url,
      status,
      duration: `${duration}ms`,
      error: error ? error.message : null
    };

    if (error || status >= 400) {
      this.error(`API request failed: ${method} ${url}`, context);
    } else {
      this.debug(`API request: ${method} ${url}`, context);
    }
  }

  /**
   * Log user actions
   */
  logUserAction(action, context = {}) {
    this.info(`User action: ${action}`, {
      action,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log component lifecycle events
   */
  logComponentLifecycle(component, event, props = {}) {
    this.debug(`Component ${event}: ${component}`, {
      component,
      event,
      props: Object.keys(props)
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric, value, context = {}) {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      ...context
    });
  }

  /**
   * Get all logs (for debugging)
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spicy-todo-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// Create logger instances for different parts of the app
export const apiLogger = new Logger('API', process.env.REACT_APP_LOG_LEVEL || 'INFO');
export const componentLogger = new Logger('Component', process.env.REACT_APP_LOG_LEVEL || 'INFO');
export const userLogger = new Logger('User', process.env.REACT_APP_LOG_LEVEL || 'INFO');
export const performanceLogger = new Logger('Performance', process.env.REACT_APP_LOG_LEVEL || 'INFO');

// Default logger
export const logger = new Logger('App', process.env.REACT_APP_LOG_LEVEL || 'INFO');

// Log app initialization
logger.info('SpicyTodo frontend logging initialized', {
  logLevel: process.env.REACT_APP_LOG_LEVEL || 'INFO',
  userAgent: navigator.userAgent,
  url: window.location.href
});

export default logger;
