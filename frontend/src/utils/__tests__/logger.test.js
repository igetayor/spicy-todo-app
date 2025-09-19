import { logger, userLogger, componentLogger, apiLogger } from '../logger';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Replace global console with mock
Object.assign(console, mockConsole);

describe('Logger utilities', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  describe('logger', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalledWith('Test info message');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(console.warn).toHaveBeenCalledWith('Test warning message');
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith('Test error message');
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(console.debug).toHaveBeenCalledWith('Test debug message');
    });

    it('should log messages with context', () => {
      logger.info('Test message', { userId: '123', action: 'login' });
      expect(console.info).toHaveBeenCalledWith('Test message', { userId: '123', action: 'login' });
    });
  });

  describe('userLogger', () => {
    it('should be defined', () => {
      expect(userLogger).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof userLogger.logUserAction).toBe('function');
      expect(typeof userLogger.logUserError).toBe('function');
      expect(typeof userLogger.logUserEvent).toBe('function');
    });

    it('should log user actions', () => {
      userLogger.logUserAction('create_todo', { todoId: '123', priority: 'high' });
      expect(console.info).toHaveBeenCalledWith(
        '[USER ACTION] create_todo',
        { todoId: '123', priority: 'high' }
      );
    });

    it('should log user errors', () => {
      const error = new Error('User error');
      userLogger.logUserError('Failed to create todo', error, { todoText: 'Test todo' });
      expect(console.error).toHaveBeenCalledWith(
        '[USER ERROR] Failed to create todo',
        error,
        { todoText: 'Test todo' }
      );
    });

    it('should log user events', () => {
      userLogger.logUserEvent('todo_completed', { todoId: '123', completedAt: '2024-01-01T10:00:00Z' });
      expect(console.info).toHaveBeenCalledWith(
        '[USER EVENT] todo_completed',
        { todoId: '123', completedAt: '2024-01-01T10:00:00Z' }
      );
    });

    it('should handle user actions without context', () => {
      userLogger.logUserAction('delete_todo');
      expect(console.info).toHaveBeenCalledWith('[USER ACTION] delete_todo', undefined);
    });

    it('should handle user events without context', () => {
      userLogger.logUserEvent('app_started');
      expect(console.info).toHaveBeenCalledWith('[USER EVENT] app_started', undefined);
    });
  });

  describe('componentLogger', () => {
    it('should be defined', () => {
      expect(componentLogger).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof componentLogger.logComponentLifecycle).toBe('function');
      expect(typeof componentLogger.logComponentError).toBe('function');
      expect(typeof componentLogger.logComponentState).toBe('function');
    });

    it('should log component lifecycle events', () => {
      componentLogger.logComponentLifecycle('TodoForm', 'mounted');
      expect(console.info).toHaveBeenCalledWith(
        '[COMPONENT] TodoForm lifecycle: mounted'
      );
    });

    it('should log component errors', () => {
      const error = new Error('Component error');
      componentLogger.logComponentError('TodoList', error, { todoCount: 5 });
      expect(console.error).toHaveBeenCalledWith(
        '[COMPONENT ERROR] TodoList',
        error,
        { todoCount: 5 }
      );
    });

    it('should log component state changes', () => {
      componentLogger.logComponentState('TodoForm', 'formSubmitted', { text: 'Test todo', priority: 'high' });
      expect(console.debug).toHaveBeenCalledWith(
        '[COMPONENT STATE] TodoForm state change: formSubmitted',
        { text: 'Test todo', priority: 'high' }
      );
    });

    it('should handle component lifecycle without context', () => {
      componentLogger.logComponentLifecycle('App', 'unmounted');
      expect(console.info).toHaveBeenCalledWith('[COMPONENT] App lifecycle: unmounted');
    });

    it('should handle component state without context', () => {
      componentLogger.logComponentState('TodoList', 'filterChanged');
      expect(console.debug).toHaveBeenCalledWith('[COMPONENT STATE] TodoList state change: filterChanged', undefined);
    });
  });

  describe('apiLogger', () => {
    it('should be defined', () => {
      expect(apiLogger).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof apiLogger.debug).toBe('function');
      expect(typeof apiLogger.logApiRequest).toBe('function');
      expect(typeof apiLogger.logApiError).toBe('function');
    });

    it('should log debug messages', () => {
      apiLogger.debug('API debug message', { endpoint: '/api/todos', method: 'GET' });
      expect(console.debug).toHaveBeenCalledWith(
        '[API DEBUG] API debug message',
        { endpoint: '/api/todos', method: 'GET' }
      );
    });

    it('should log API requests', () => {
      apiLogger.logApiRequest('GET', '/api/todos', 200, 150.5);
      expect(console.info).toHaveBeenCalledWith(
        '[API REQUEST] GET /api/todos - 200 (150.5ms)'
      );
    });

    it('should log API errors', () => {
      const error = new Error('Network error');
      apiLogger.logApiError('POST', '/api/todos', error, { todoText: 'Test todo' });
      expect(console.error).toHaveBeenCalledWith(
        '[API ERROR] POST /api/todos',
        error,
        { todoText: 'Test todo' }
      );
    });

    it('should handle API requests without duration', () => {
      apiLogger.logApiRequest('DELETE', '/api/todos/123', 204);
      expect(console.info).toHaveBeenCalledWith(
        '[API REQUEST] DELETE /api/todos/123 - 204 (0ms)'
      );
    });

    it('should handle API errors without context', () => {
      const error = new Error('Request failed');
      apiLogger.logApiError('GET', '/api/todos', error);
      expect(console.error).toHaveBeenCalledWith(
        '[API ERROR] GET /api/todos',
        error,
        undefined
      );
    });

    it('should format API request logs correctly', () => {
      apiLogger.logApiRequest('PUT', '/api/todos/123', 200, 250.75);
      expect(console.info).toHaveBeenCalledWith(
        '[API REQUEST] PUT /api/todos/123 - 200 (250.75ms)'
      );
    });

    it('should handle different HTTP status codes', () => {
      const statusCodes = [200, 201, 400, 401, 404, 500];
      
      statusCodes.forEach(status => {
        apiLogger.logApiRequest('GET', '/api/todos', status, 100);
        expect(console.info).toHaveBeenLastCalledWith(
          `[API REQUEST] GET /api/todos - ${status} (100ms)`
        );
      });
    });
  });

  describe('logger integration', () => {
    it('should handle multiple loggers simultaneously', () => {
      logger.info('General info');
      userLogger.logUserAction('test_action');
      componentLogger.logComponentLifecycle('TestComponent', 'mounted');
      apiLogger.debug('API debug');

      expect(console.info).toHaveBeenCalledTimes(3);
      expect(console.debug).toHaveBeenCalledTimes(1);
    });

    it('should handle complex logging scenarios', () => {
      // Simulate a complex user interaction
      componentLogger.logComponentLifecycle('TodoForm', 'mounted');
      userLogger.logUserAction('form_submitted', { todoText: 'Test todo', priority: 'high' });
      apiLogger.logApiRequest('POST', '/api/todos', 201, 200);
      logger.info('Todo created successfully');

      expect(console.info).toHaveBeenCalledTimes(3);
    });

    it('should handle error scenarios across loggers', () => {
      const error = new Error('Test error');
      
      logger.error('General error');
      userLogger.logUserError('User action failed', error);
      componentLogger.logComponentError('TodoList', error);
      apiLogger.logApiError('GET', '/api/todos', error);

      expect(console.error).toHaveBeenCalledTimes(4);
    });
  });

  describe('logger performance', () => {
    it('should handle rapid logging without issues', () => {
      // Log many messages quickly
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
        userLogger.logUserAction(`action_${i}`);
        componentLogger.logComponentState('TestComponent', `state_${i}`);
        apiLogger.debug(`API debug ${i}`);
      }

      expect(console.info).toHaveBeenCalledTimes(200);
      expect(console.debug).toHaveBeenCalledTimes(100);
    });

    it('should handle large context objects', () => {
      const largeContext = {
        todos: Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Todo ${i}` })),
        user: { id: '123', name: 'Test User', preferences: { theme: 'dark' } },
        metadata: { timestamp: Date.now(), version: '1.0.0' }
      };

      logger.info('Large context test', largeContext);
      expect(console.info).toHaveBeenCalledWith('Large context test', largeContext);
    });
  });

  describe('logger edge cases', () => {
    it('should handle null and undefined values', () => {
      logger.info('Null test', null);
      logger.info('Undefined test', undefined);
      
      expect(console.info).toHaveBeenCalledWith('Null test', null);
      expect(console.info).toHaveBeenCalledWith('Undefined test', undefined);
    });

    it('should handle circular references', () => {
      const circular = { name: 'test' };
      circular.self = circular;

      // This should not throw an error
      expect(() => logger.info('Circular test', circular)).not.toThrow();
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      logger.info(longMessage);
      
      expect(console.info).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      logger.info(specialMessage);
      
      expect(console.info).toHaveBeenCalledWith(specialMessage);
    });

    it('should handle Unicode characters', () => {
      const unicodeMessage = 'Unicode: 🌶️ ñáéíóú 中文 🎉';
      logger.info(unicodeMessage);
      
      expect(console.info).toHaveBeenCalledWith(unicodeMessage);
    });
  });

  describe('logger method chaining', () => {
    it('should support method chaining if implemented', () => {
      // This test would be relevant if the logger supported method chaining
      // For now, we just test that methods return expected values
      const result = logger.info('Test');
      expect(result).toBeUndefined(); // Most loggers return undefined
    });
  });

  describe('logger configuration', () => {
    it('should work in different environments', () => {
      // Test that loggers work regardless of environment
      logger.info('Environment test');
      userLogger.logUserAction('env_test');
      componentLogger.logComponentLifecycle('EnvTest', 'mounted');
      apiLogger.debug('Environment API test');

      expect(console.info).toHaveBeenCalledTimes(3);
      expect(console.debug).toHaveBeenCalledTimes(1);
    });
  });
});
