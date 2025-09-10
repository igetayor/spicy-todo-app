// API service for communicating with the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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

