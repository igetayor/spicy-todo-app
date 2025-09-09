import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import TodoFilter from './components/TodoFilter';
import TodoStats from './components/TodoStats';
import { sampleTodos } from './data/sampleData';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load sample data on component mount
  useEffect(() => {
    setTodos(sampleTodos);
  }, []);

  // Filter todos based on current filter and search term
  const filteredTodos = todos.filter(todo => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && !todo.completed) ||
                         (filter === 'completed' && todo.completed);
    
    const matchesSearch = todo.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // CRUD Operations
  const addTodo = (text, priority = 'medium') => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTodos([newTodo, ...todos]);
  };

  const updateTodo = (id, updates) => {
    setTodos(todos.map(todo => 
      todo.id === id 
        ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
        : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id) => {
    updateTodo(id, { completed: !todos.find(todo => todo.id === id).completed });
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
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
          <TodoForm onAddTodo={addTodo} />
          
          <TodoFilter 
            filter={filter}
            onFilterChange={setFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearCompleted={clearCompleted}
            completedCount={todos.filter(todo => todo.completed).length}
          />

          <TodoStats todos={todos} />

          <TodoList 
            todos={filteredTodos}
            onToggleTodo={toggleTodo}
            onUpdateTodo={updateTodo}
            onDeleteTodo={deleteTodo}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
