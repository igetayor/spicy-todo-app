import React from 'react';
import TodoList from '../TodoList';

describe('TodoList - Basic Tests', () => {
  const mockTodos = [
    {
      id: 1,
      text: 'Test todo 1',
      completed: false,
      priority: 'high',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    }
  ];

  const mockOnToggleTodo = jest.fn();
  const mockOnUpdateTodo = jest.fn();
  const mockOnDeleteTodo = jest.fn();

  beforeEach(() => {
    mockOnToggleTodo.mockClear();
    mockOnUpdateTodo.mockClear();
    mockOnDeleteTodo.mockClear();
  });

  it('should be defined', () => {
    expect(TodoList).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof TodoList).toBe('function');
  });

  it('should accept props', () => {
    const props = {
      todos: mockTodos,
      onToggleTodo: mockOnToggleTodo,
      onUpdateTodo: mockOnUpdateTodo,
      onDeleteTodo: mockOnDeleteTodo
    };
    expect(() => TodoList(props)).not.toThrow();
  });

  it('should handle empty todos array', () => {
    const props = {
      todos: [],
      onToggleTodo: mockOnToggleTodo,
      onUpdateTodo: mockOnUpdateTodo,
      onDeleteTodo: mockOnDeleteTodo
    };
    expect(() => TodoList(props)).not.toThrow();
  });
});
