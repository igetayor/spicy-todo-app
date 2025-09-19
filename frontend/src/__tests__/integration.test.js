import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock the API service
jest.mock('../services/api', () => ({
  getTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
  toggleTodo: jest.fn(),
  getTodoStats: jest.fn(),
  clearCompletedTodos: jest.fn(),
  healthCheck: jest.fn(),
}));

// Import the mocked API service
import apiService from '../services/api';

describe('Frontend-Backend Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    apiService.getTodos.mockResolvedValue([
      {
        id: '1',
        text: 'Existing todo 1',
        priority: 'high',
        completed: false,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: '2',
        text: 'Existing todo 2',
        priority: 'medium',
        completed: true,
        createdAt: '2024-01-01T11:00:00Z',
        updatedAt: '2024-01-01T11:30:00Z'
      }
    ]);
    
    apiService.getTodoStats.mockResolvedValue({
      total: 2,
      active: 1,
      completed: 1,
      completion_rate: 50.0,
      priority_breakdown: { high: 1, medium: 1, low: 0 }
    });
    
    apiService.createTodo.mockResolvedValue({
      id: '3',
      text: 'New todo',
      priority: 'medium',
      completed: false,
      createdAt: '2024-01-01T12:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z'
    });
    
    apiService.updateTodo.mockResolvedValue({
      id: '1',
      text: 'Updated todo',
      priority: 'high',
      completed: false,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z'
    });
    
    apiService.toggleTodo.mockResolvedValue({
      id: '1',
      text: 'Existing todo 1',
      priority: 'high',
      completed: true,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z'
    });
    
    apiService.deleteTodo.mockResolvedValue({
      message: 'Todo deleted successfully'
    });
    
    apiService.clearCompletedTodos.mockResolvedValue({
      message: 'Completed todos cleared',
      deleted_count: 1
    });
    
    apiService.healthCheck.mockResolvedValue({
      status: 'healthy',
      timestamp: '2024-01-01T12:00:00Z'
    });
  });

  describe('App Initialization and Data Loading', () => {
    it('should load todos and stats on app initialization', async () => {
      render(<App />);
      
      // Wait for data to load
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledWith('all', '');
        expect(apiService.getTodoStats).toHaveBeenCalled();
      });
      
      // Verify todos are displayed
      expect(screen.getByText('Existing todo 1')).toBeInTheDocument();
      expect(screen.getByText('Existing todo 2')).toBeInTheDocument();
      
      // Verify stats are displayed
      expect(screen.getByText('2')).toBeInTheDocument(); // Total todos
    });

    it('should handle loading states correctly', async () => {
      // Mock a slow response
      apiService.getTodos.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      
      render(<App />);
      
      // Should show loading state initially
      // (This depends on your loading UI implementation)
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      apiService.getTodos.mockRejectedValue(new Error('API Error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      // Should show error message
      expect(screen.getByText(/failed to load todos/i)).toBeInTheDocument();
    });
  });

  describe('Todo Creation Workflow', () => {
    it('should create a new todo and refresh the list', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      // Create a new todo
      const input = screen.getByPlaceholderText(/what needs to be done/i);
      const addButton = screen.getByRole('button', { name: /add/i });
      
      await user.type(input, 'New integration test todo');
      await user.click(addButton);
      
      // Verify API was called
      expect(apiService.createTodo).toHaveBeenCalledWith({
        text: 'New integration test todo',
        priority: 'medium'
      });
      
      // Verify the list was refreshed
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('should create todo with different priorities', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const input = screen.getByPlaceholderText(/what needs to be done/i);
      const prioritySelect = screen.getByLabelText(/priority/i);
      const addButton = screen.getByRole('button', { name: /add/i });
      
      await user.type(input, 'High priority todo');
      await user.selectOptions(prioritySelect, 'high');
      await user.click(addButton);
      
      expect(apiService.createTodo).toHaveBeenCalledWith({
        text: 'High priority todo',
        priority: 'high'
      });
    });

    it('should handle creation errors', async () => {
      const user = userEvent.setup();
      apiService.createTodo.mockRejectedValue(new Error('Creation failed'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const input = screen.getByPlaceholderText(/what needs to be done/i);
      const addButton = screen.getByRole('button', { name: /add/i });
      
      await user.type(input, 'Todo that will fail');
      await user.click(addButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create todo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Todo Editing Workflow', () => {
    it('should update a todo and refresh the list', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      // Find and edit the first todo
      const todoText = screen.getByText('Existing todo 1');
      await user.dblClick(todoText);
      
      const input = screen.getByDisplayValue('Existing todo 1');
      await user.clear(input);
      await user.type(input, 'Updated integration test todo{enter}');
      
      // Verify API was called
      expect(apiService.updateTodo).toHaveBeenCalledWith('1', {
        text: 'Updated integration test todo'
      });
      
      // Verify the list was refreshed
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledTimes(2);
      });
    });

    it('should cancel editing on Escape key', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const todoText = screen.getByText('Existing todo 1');
      await user.dblClick(todoText);
      
      const input = screen.getByDisplayValue('Existing todo 1');
      await user.clear(input);
      await user.type(input, 'This should be cancelled');
      await user.keyboard('{Escape}');
      
      // Should not call update API
      expect(apiService.updateTodo).not.toHaveBeenCalled();
      
      // Should show original text
      expect(screen.getByText('Existing todo 1')).toBeInTheDocument();
    });

    it('should handle update errors', async () => {
      const user = userEvent.setup();
      apiService.updateTodo.mockRejectedValue(new Error('Update failed'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const todoText = screen.getByText('Existing todo 1');
      await user.dblClick(todoText);
      
      const input = screen.getByDisplayValue('Existing todo 1');
      await user.clear(input);
      await user.type(input, 'Update that will fail{enter}');
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update todo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Todo Completion Workflow', () => {
    it('should toggle todo completion status', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const checkbox = screen.getAllByRole('checkbox')[0];
      await user.click(checkbox);
      
      // Verify API was called
      expect(apiService.toggleTodo).toHaveBeenCalledWith('1');
      
      // Verify the list was refreshed
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle toggle errors', async () => {
      const user = userEvent.setup();
      apiService.toggleTodo.mockRejectedValue(new Error('Toggle failed'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const checkbox = screen.getAllByRole('checkbox')[0];
      await user.click(checkbox);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to toggle todo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Todo Deletion Workflow', () => {
    it('should delete a todo and refresh the list', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Verify API was called
      expect(apiService.deleteTodo).toHaveBeenCalledWith('1');
      
      // Verify the list was refreshed
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle deletion errors', async () => {
      const user = userEvent.setup();
      apiService.deleteTodo.mockRejectedValue(new Error('Deletion failed'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to delete todo/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Search Workflow', () => {
    it('should filter todos by status', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const activeFilter = screen.getByRole('button', { name: /active/i });
      await user.click(activeFilter);
      
      // Verify API was called with filter
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledWith('active', '');
      });
    });

    it('should search todos by text', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const searchInput = screen.getByPlaceholderText(/search todos/i);
      await user.type(searchInput, 'Existing');
      
      // Should debounce the search
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledWith('all', 'Existing');
      }, { timeout: 1000 });
    });

    it('should combine filters and search', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      // Set filter
      const completedFilter = screen.getByRole('button', { name: /completed/i });
      await user.click(completedFilter);
      
      // Set search
      const searchInput = screen.getByPlaceholderText(/search todos/i);
      await user.type(searchInput, 'todo');
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledWith('completed', 'todo');
      }, { timeout: 1000 });
    });
  });

  describe('Statistics Workflow', () => {
    it('should display and refresh statistics', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodoStats).toHaveBeenCalled();
      });
      
      // Verify stats are displayed
      expect(screen.getByText('2')).toBeInTheDocument(); // Total
      expect(screen.getByText('1')).toBeInTheDocument(); // Active
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed
      expect(screen.getByText('50.0%')).toBeInTheDocument(); // Completion rate
    });

    it('should refresh stats after operations', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodoStats).toHaveBeenCalled();
      });
      
      // Perform an operation that affects stats
      const checkbox = screen.getAllByRole('checkbox')[0];
      await user.click(checkbox);
      
      // Verify stats were refreshed
      await waitFor(() => {
        expect(apiService.getTodoStats).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle stats loading errors', async () => {
      apiService.getTodoStats.mockRejectedValue(new Error('Stats failed'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodoStats).toHaveBeenCalled();
      });
      
      // Should show error message
      expect(screen.getByText(/failed to load stats/i)).toBeInTheDocument();
    });
  });

  describe('Clear Completed Workflow', () => {
    it('should clear completed todos and refresh data', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      // Find and click clear completed button
      const clearButton = screen.getByRole('button', { name: /clear completed/i });
      await user.click(clearButton);
      
      // Verify API was called
      expect(apiService.clearCompletedTodos).toHaveBeenCalled();
      
      // Verify data was refreshed
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledTimes(2);
        expect(apiService.getTodoStats).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle clear completed errors', async () => {
      const user = userEvent.setup();
      apiService.clearCompletedTodos.mockRejectedValue(new Error('Clear failed'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const clearButton = screen.getByRole('button', { name: /clear completed/i });
      await user.click(clearButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to clear completed todos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complex User Scenarios', () => {
    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      // Rapid interactions
      const input = screen.getByPlaceholderText(/what needs to be done/i);
      const addButton = screen.getByRole('button', { name: /add/i });
      const checkbox = screen.getAllByRole('checkbox')[0];
      
      await user.type(input, 'Rapid todo 1');
      await user.click(addButton);
      
      await user.type(input, 'Rapid todo 2');
      await user.click(addButton);
      
      await user.click(checkbox);
      
      // Verify all operations were called
      expect(apiService.createTodo).toHaveBeenCalledTimes(2);
      expect(apiService.toggleTodo).toHaveBeenCalledTimes(1);
      
      // Verify data was refreshed multiple times
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledTimes(4); // Initial + 3 refreshes
      });
    });

    it('should handle form validation errors', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const addButton = screen.getByRole('button', { name: /add/i });
      
      // Try to add empty todo
      await user.click(addButton);
      
      // Should not call API
      expect(apiService.createTodo).not.toHaveBeenCalled();
      
      // Button should be disabled
      expect(addButton).toBeDisabled();
    });

    it('should handle network reconnection scenarios', async () => {
      // Simulate network failure then recovery
      apiService.getTodos
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([
          {
            id: '1',
            text: 'Recovered todo',
            priority: 'medium',
            completed: false,
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z'
          }
        ]);
      
      render(<App />);
      
      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/failed to load todos/i)).toBeInTheDocument();
      });
      
      // Simulate retry (this would typically be triggered by user action)
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);
      
      // Should eventually show recovered data
      await waitFor(() => {
        expect(screen.getByText('Recovered todo')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should debounce search requests', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      const searchInput = screen.getByPlaceholderText(/search todos/i);
      
      // Type rapidly
      await user.type(searchInput, 'test');
      
      // Should not make a request for each character
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledWith('all', 'test');
      }, { timeout: 1000 });
      
      // Verify it was debounced (only called twice: initial load + debounced search)
      expect(apiService.getTodos).toHaveBeenCalledTimes(2);
    });

    it('should batch multiple operations efficiently', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalled();
      });
      
      // Perform multiple operations quickly
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      
      // Verify operations were called
      expect(apiService.toggleTodo).toHaveBeenCalledTimes(2);
      
      // Verify data was refreshed (could be batched)
      await waitFor(() => {
        expect(apiService.getTodos).toHaveBeenCalledTimes(3); // Initial + 2 refreshes
      });
    });
  });
});
