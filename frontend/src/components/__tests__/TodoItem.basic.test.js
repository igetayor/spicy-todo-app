import React from 'react';
import TodoItem from '../TodoItem';

describe('TodoItem - Basic Tests', () => {
  const mockTodo = {
    id: 1,
    text: 'Test todo',
    completed: false,
    priority: 'medium',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  };

  const mockOnToggleTodo = jest.fn();
  const mockOnUpdateTodo = jest.fn();
  const mockOnDeleteTodo = jest.fn();

  beforeEach(() => {
    mockOnToggleTodo.mockClear();
    mockOnUpdateTodo.mockClear();
    mockOnDeleteTodo.mockClear();
  });

  it('should be defined', () => {
    expect(TodoItem).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof TodoItem).toBe('function');
  });

  it('should accept props', () => {
    const props = {
      todo: mockTodo,
      onToggleTodo: mockOnToggleTodo,
      onUpdateTodo: mockOnUpdateTodo,
      onDeleteTodo: mockOnDeleteTodo
    };
    expect(() => TodoItem(props)).not.toThrow();
  });

  it('should handle missing props', () => {
    expect(() => TodoItem()).not.toThrow();
  });
});
