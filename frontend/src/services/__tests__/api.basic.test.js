import apiService from '../api';

describe('ApiService - Basic Tests', () => {
  it('should be defined', () => {
    expect(apiService).toBeDefined();
  });

  it('should be an object', () => {
    expect(typeof apiService).toBe('object');
  });

  it('should have required methods', () => {
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

  it('should have baseURL property', () => {
    expect(apiService.baseURL).toBeDefined();
    expect(typeof apiService.baseURL).toBe('string');
  });

  it('should have default baseURL', () => {
    expect(apiService.baseURL).toBe('http://localhost:8000');
  });
});
