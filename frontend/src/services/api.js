// API service for communicating with the backend
import { apiLogger } from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = performance.now();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    apiLogger.debug(`API request started: ${method} ${endpoint}`, {
      method,
      endpoint,
      url,
      headers: config.headers
    });

    try {
      const response = await fetch(url, config);
      const duration = performance.now() - startTime;
      
      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        apiLogger.logApiRequest(method, endpoint, response.status, duration, error);
        throw error;
      }
      
      const data = await response.json();
      apiLogger.logApiRequest(method, endpoint, response.status, duration);
      
      apiLogger.debug(`API request completed: ${method} ${endpoint}`, {
        method,
        endpoint,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`,
        dataSize: JSON.stringify(data).length
      });
      
      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      apiLogger.logApiRequest(method, endpoint, 0, duration, error);
      apiLogger.error(`API request failed: ${method} ${endpoint}`, {
        method,
        endpoint,
        error: error.message,
        duration: `${duration.toFixed(2)}ms`
      });
      throw error;
    }
  }

  // Todo operations
  async getTodos(filter = 'all', search = '', priority = '') {
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.append('filter', filter);
    if (search) params.append('search', search);
    if (priority) params.append('priority', priority);
    
    const queryString = params.toString();
    const endpoint = `/api/todos${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  async getTodo(id) {
    return this.request(`/api/todos/${id}`);
  }

  async createTodo(todoData) {
    return this.request('/api/todos', {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
  }

  async updateTodo(id, todoData) {
    return this.request(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(todoData),
    });
  }

  async deleteTodo(id) {
    return this.request(`/api/todos/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleTodo(id) {
    return this.request(`/api/todos/${id}/toggle`, {
      method: 'PATCH',
    });
  }

  async getTodoStats() {
    return this.request('/api/todos/stats/summary');
  }

  async clearCompletedTodos() {
    return this.request('/api/todos/completed', {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

