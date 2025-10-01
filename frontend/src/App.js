import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import TodoFilter from './components/TodoFilter';
import TodoStats from './components/TodoStats';
import apiService from './services/api';
import reminderService from './services/reminderService';
import { logger, userLogger, componentLogger } from './utils/logger';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Log component mount
  useEffect(() => {
    componentLogger.logComponentLifecycle('App', 'mounted');
    logger.info('SpicyTodo app initialized');
    
    // Clean up old reminders on app start
    reminderService.cleanupOldReminders();
    
    // Cleanup reminder service on unmount
    return () => {
      reminderService.destroy();
    };
  }, []);

  // Load todos from API on component mount
  useEffect(() => {
    loadTodos();
  }, []);

  // Load todos when filter or search changes
  useEffect(() => {
    loadTodos();
  }, [filter, searchTerm]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.debug('Loading todos', { filter, searchTerm });
      const data = await apiService.getTodos(filter, searchTerm);
      setTodos(data);
      
      logger.info('Todos loaded successfully', { 
        count: data.length, 
        filter, 
        searchTerm 
      });
      
      // Update reminder service with current todos
      reminderService.updateTodos(data);
    } catch (err) {
      const errorMsg = 'Failed to load todos. Please check if the API is running.';
      setError(errorMsg);
      logger.error('Error loading todos', { 
        error: err.message, 
        filter, 
        searchTerm 
      });
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const addTodo = async (text, priority = 'medium', dueDate = null, reminderTime = null, recurrenceRule = 'none') => {
    try {
      setLoading(true);
      setError(null);
      
      userLogger.logUserAction('create_todo', { text, priority, dueDate, reminderTime, recurrenceRule });
      const newTodo = await apiService.createTodo({ 
        text, 
        priority, 
        dueDate: dueDate || null, 
        reminderTime: reminderTime || null,
        recurrenceRule
      });
      setTodos([newTodo, ...todos]);
      
      logger.info('Todo created successfully', { 
        id: newTodo.id, 
        text, 
        priority 
      });
    } catch (err) {
      setError('Failed to create todo');
      logger.error('Error creating todo', { 
        error: err.message, 
        text, 
        priority 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTodo = await apiService.updateTodo(id, updates);
      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      console.error('Error deleting todo:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const updatedTodo = await apiService.toggleTodo(id);
      setTodos(todos.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    } catch (err) {
      setError('Failed to toggle todo');
      console.error('Error toggling todo:', err);
    } finally {
      setLoading(false);
    }
  };

  const snoozeTodo = async (todo) => {
    try {
      setLoading(true);
      setError(null);
      // Default snooze: 1 hour from now
      const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const updated = await apiService.snoozeTodo(todo.id, snoozeUntil);
      setTodos(todos.map(t => t.id === todo.id ? updated : t));
    } catch (err) {
      setError('Failed to snooze todo');
      console.error('Error snoozing todo:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCompleted = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiService.clearCompletedTodos();
      setTodos(todos.filter(todo => !todo.completed));
    } catch (err) {
      setError('Failed to clear completed todos');
      console.error('Error clearing completed todos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">
            🌶️ Spicy Todo App
          </h1>
          <p className="app-subtitle">Get things done with a little spice!</p>
        </header>

        <div className="app-content">
          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
              <button onClick={loadTodos} className="retry-button">
                Retry
              </button>
            </div>
          )}

          <TodoForm onAddTodo={addTodo} loading={loading} />
          
          <TodoFilter 
            filter={filter}
            onFilterChange={setFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearCompleted={clearCompleted}
            completedCount={todos.filter(todo => todo.completed).length}
            loading={loading}
          />

          <TodoStats todos={todos} loading={loading} />

          <TodoList 
            todos={todos}
            onToggleTodo={toggleTodo}
            onUpdateTodo={updateTodo}
            onDeleteTodo={deleteTodo}
            onSnooze={snoozeTodo}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
