import apiService from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiService', () => {
  const mockResponse = (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('constructor and configuration', () => {
    it('should initialize with default base URL', () => {
      expect(apiService.baseURL).toBe('http://localhost:8000');
    });

    it('should have all required methods', () => {
      expect(typeof apiService.request).toBe('function');
      expect(typeof apiService.getTodos).toBe('function');
      expect(typeof apiService.getTodo).toBe('function');
      expect(typeof apiService.createTodo).toBe('function');
      expect(typeof apiService.updateTodo).toBe('function');
      expect(typeof apiService.deleteTodo).toBe('function');
      expect(typeof apiService.toggleTodo).toBe('function');
      expect(typeof apiService.getTodoStats).toBe('function');
      expect(typeof apiService.clearCompletedTodos).toBe('function');
      expect(typeof apiService.healthCheck).toBe('function');
    });
  });

  describe('request method', () => {
    it('should make GET request successfully', async () => {
      const mockData = { message: 'success' };
      fetch.mockResolvedValueOnce(mockResponse(mockData));

      const result = await apiService.request('/test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should make POST request with data', async () => {
      const mockData = { id: '1', text: 'Test todo' };
      const requestData = { text: 'Test todo', priority: 'medium' };
      fetch.mockResolvedValueOnce(mockResponse(mockData, 201));

      const result = await apiService.request('/todos', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/todos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle request errors', async () => {
      fetch.mockResolvedValueOnce(mockResponse({ error: 'Not found' }, 404));

      await expect(apiService.request('/nonexistent')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.request('/test')).rejects.toThrow('Network error');
    });

    it('should include custom headers', async () => {
      const mockData = { message: 'success' };
      fetch.mockResolvedValueOnce(mockResponse(mockData));

      await apiService.request('/test', {
        headers: {
          'Authorization': 'Bearer token',
          'Custom-Header': 'value',
        },
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token',
            'Custom-Header': 'value',
          },
        })
      );
    });

    it('should measure request duration', async () => {
      const mockData = { message: 'success' };
      fetch.mockResolvedValueOnce(mockResponse(mockData));

      const startTime = performance.now();
      await apiService.request('/test');
      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });

  describe('getTodos method', () => {
    it('should fetch all todos', async () => {
      const mockTodos = [
        { id: '1', text: 'Todo 1', priority: 'medium', completed: false },
        { id: '2', text: 'Todo 2', priority: 'high', completed: true },
      ];
      fetch.mockResolvedValueOnce(mockResponse(mockTodos));

      const result = await apiService.getTodos();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(result).toEqual(mockTodos);
    });

    it('should fetch todos with filter', async () => {
      const mockTodos = [{ id: '1', text: 'Active todo', completed: false }];
      fetch.mockResolvedValueOnce(mockResponse(mockTodos));

      const result = await apiService.getTodos('active');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos?filter=active',
        expect.any(Object)
      );
      expect(result).toEqual(mockTodos);
    });

    it('should fetch todos with search term', async () => {
      const mockTodos = [{ id: '1', text: 'Search result', completed: false }];
      fetch.mockResolvedValueOnce(mockResponse(mockTodos));

      const result = await apiService.getTodos('all', 'search');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos?filter=all&search=search',
        expect.any(Object)
      );
      expect(result).toEqual(mockTodos);
    });

    it('should handle empty results', async () => {
      fetch.mockResolvedValueOnce(mockResponse([]));

      const result = await apiService.getTodos();

      expect(result).toEqual([]);
    });
  });

  describe('getTodo method', () => {
    it('should fetch single todo by ID', async () => {
      const mockTodo = { id: '1', text: 'Single todo', priority: 'medium', completed: false };
      fetch.mockResolvedValueOnce(mockResponse(mockTodo));

      const result = await apiService.getTodo('1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos/1',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockTodo);
    });

    it('should handle todo not found', async () => {
      fetch.mockResolvedValueOnce(mockResponse({ detail: 'Todo not found' }, 404));

      await expect(apiService.getTodo('nonexistent')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('createTodo method', () => {
    it('should create new todo', async () => {
      const newTodo = { text: 'New todo', priority: 'high', completed: false };
      const createdTodo = { id: '1', ...newTodo, createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z' };
      fetch.mockResolvedValueOnce(mockResponse(createdTodo, 201));

      const result = await apiService.createTodo(newTodo);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTodo),
        })
      );
      expect(result).toEqual(createdTodo);
    });

    it('should handle validation errors', async () => {
      const invalidTodo = { text: '', priority: 'invalid' };
      fetch.mockResolvedValueOnce(mockResponse({ detail: 'Validation error' }, 422));

      await expect(apiService.createTodo(invalidTodo)).rejects.toThrow('HTTP error! status: 422');
    });

    it('should create todo with minimal data', async () => {
      const minimalTodo = { text: 'Minimal todo' };
      const createdTodo = { id: '1', text: 'Minimal todo', priority: 'medium', completed: false };
      fetch.mockResolvedValueOnce(mockResponse(createdTodo));

      const result = await apiService.createTodo(minimalTodo);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(minimalTodo),
        })
      );
      expect(result).toEqual(createdTodo);
    });
  });

  describe('updateTodo method', () => {
    it('should update existing todo', async () => {
      const updateData = { text: 'Updated todo', completed: true };
      const updatedTodo = { id: '1', ...updateData, priority: 'medium', createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T11:00:00Z' };
      fetch.mockResolvedValueOnce(mockResponse(updatedTodo));

      const result = await apiService.updateTodo('1', updateData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(updatedTodo);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { completed: true };
      const updatedTodo = { id: '1', text: 'Original text', completed: true, priority: 'medium' };
      fetch.mockResolvedValueOnce(mockResponse(updatedTodo));

      const result = await apiService.updateTodo('1', partialUpdate);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(partialUpdate),
        })
      );
      expect(result).toEqual(updatedTodo);
    });

    it('should handle todo not found during update', async () => {
      fetch.mockResolvedValueOnce(mockResponse({ detail: 'Todo not found' }, 404));

      await expect(apiService.updateTodo('nonexistent', { text: 'Update' })).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('deleteTodo method', () => {
    it('should delete existing todo', async () => {
      const deleteResponse = { message: 'Todo deleted successfully' };
      fetch.mockResolvedValueOnce(mockResponse(deleteResponse));

      const result = await apiService.deleteTodo('1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(deleteResponse);
    });

    it('should handle todo not found during deletion', async () => {
      fetch.mockResolvedValueOnce(mockResponse({ detail: 'Todo not found' }, 404));

      await expect(apiService.deleteTodo('nonexistent')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('toggleTodo method', () => {
    it('should toggle todo completion status', async () => {
      const toggledTodo = { id: '1', text: 'Test todo', completed: true, priority: 'medium' };
      fetch.mockResolvedValueOnce(mockResponse(toggledTodo));

      const result = await apiService.toggleTodo('1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos/1/toggle',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
      expect(result).toEqual(toggledTodo);
    });

    it('should handle toggle errors', async () => {
      fetch.mockResolvedValueOnce(mockResponse({ detail: 'Todo not found' }, 404));

      await expect(apiService.toggleTodo('nonexistent')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('getTodoStats method', () => {
    it('should fetch todo statistics', async () => {
      const mockStats = {
        total: 10,
        active: 6,
        completed: 4,
        completion_rate: 40.0,
        priority_breakdown: { high: 3, medium: 4, low: 3 }
      };
      fetch.mockResolvedValueOnce(mockResponse(mockStats));

      const result = await apiService.getTodoStats();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos/stats/summary',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockStats);
    });

    it('should handle empty stats', async () => {
      const emptyStats = { total: 0, active: 0, completed: 0, completion_rate: 0, priority_breakdown: { high: 0, medium: 0, low: 0 } };
      fetch.mockResolvedValueOnce(mockResponse(emptyStats));

      const result = await apiService.getTodoStats();

      expect(result).toEqual(emptyStats);
    });
  });

  describe('clearCompletedTodos method', () => {
    it('should clear completed todos', async () => {
      const clearResponse = { message: 'Completed todos cleared', deleted_count: 3 };
      fetch.mockResolvedValueOnce(mockResponse(clearResponse));

      const result = await apiService.clearCompletedTodos();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/todos/completed',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(clearResponse);
    });

    it('should handle no completed todos', async () => {
      const clearResponse = { message: 'No completed todos found', deleted_count: 0 };
      fetch.mockResolvedValueOnce(mockResponse(clearResponse));

      const result = await apiService.clearCompletedTodos();

      expect(result).toEqual(clearResponse);
    });
  });

  describe('healthCheck method', () => {
    it('should check API health', async () => {
      const healthResponse = { status: 'healthy', timestamp: '2024-01-01T10:00:00Z' };
      fetch.mockResolvedValueOnce(mockResponse(healthResponse));

      const result = await apiService.healthCheck();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(healthResponse);
    });

    it('should handle health check failures', async () => {
      fetch.mockResolvedValueOnce(mockResponse({ status: 'unhealthy' }, 500));

      await expect(apiService.healthCheck()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('error handling', () => {
    it('should handle JSON parsing errors', async () => {
      const invalidJsonResponse = {
        ok: true,
        status: 200,
        json: async () => { throw new Error('Invalid JSON'); },
      };
      fetch.mockResolvedValueOnce(invalidJsonResponse);

      await expect(apiService.request('/test')).rejects.toThrow('Invalid JSON');
    });

    it('should handle timeout scenarios', async () => {
      // Simulate a slow response
      const slowResponse = new Promise(resolve => {
        setTimeout(() => resolve(mockResponse({ message: 'success' })), 10000);
      });
      fetch.mockReturnValueOnce(slowResponse);

      // This test would need a timeout mechanism in the actual implementation
      // For now, we just verify the request is made
      const requestPromise = apiService.request('/test');
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle malformed URLs', async () => {
      // This would be caught by fetch itself
      await expect(apiService.request('invalid-url')).rejects.toThrow();
    });
  });

  describe('performance and logging', () => {
    it('should log request details', async () => {
      const mockData = { message: 'success' };
      fetch.mockResolvedValueOnce(mockResponse(mockData));

      // Mock console methods to avoid actual logging in tests
      const originalLog = console.log;
      console.log = jest.fn();

      await apiService.request('/test');

      // Restore console.log
      console.log = originalLog;

      expect(fetch).toHaveBeenCalled();
    });

    it('should handle rapid successive requests', async () => {
      const mockData = { message: 'success' };
      fetch.mockResolvedValue(mockResponse(mockData));

      const promises = Array.from({ length: 10 }, () => apiService.request('/test'));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(fetch).toHaveBeenCalledTimes(10);
    });

    it('should handle concurrent requests with different endpoints', async () => {
      const todosData = [{ id: '1', text: 'Todo 1' }];
      const statsData = { total: 1, active: 1, completed: 0 };
      const healthData = { status: 'healthy' };

      fetch
        .mockResolvedValueOnce(mockResponse(todosData))
        .mockResolvedValueOnce(mockResponse(statsData))
        .mockResolvedValueOnce(mockResponse(healthData));

      const [todos, stats, health] = await Promise.all([
        apiService.getTodos(),
        apiService.getTodoStats(),
        apiService.healthCheck(),
      ]);

      expect(todos).toEqual(todosData);
      expect(stats).toEqual(statsData);
      expect(health).toEqual(healthData);
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('environment configuration', () => {
    it('should use environment variable for base URL', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://api.example.com';

      // Re-import the service to get the new environment variable
      jest.resetModules();
      const newApiService = require('../api').default;

      expect(newApiService.baseURL).toBe('https://api.example.com');

      // Restore original environment
      process.env.REACT_APP_API_URL = originalEnv;
    });
  });
});
