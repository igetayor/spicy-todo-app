import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import TodoFilter from './components/TodoFilter';
import TodoStats from './components/TodoStats';
import apiService from './services/api';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const data = await apiService.getTodos(filter, searchTerm);
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos. Please check if the API is running.');
      console.error('Error loading todos:', err);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const addTodo = async (text, priority = 'medium') => {
    try {
      setLoading(true);
      setError(null);
      const newTodo = await apiService.createTodo({ text, priority });
      setTodos([newTodo, ...todos]);
    } catch (err) {
      setError('Failed to create todo');
      console.error('Error creating todo:', err);
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
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
