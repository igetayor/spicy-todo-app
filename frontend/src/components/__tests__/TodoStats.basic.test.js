import React from 'react';
import TodoStats from '../TodoStats';

describe('TodoStats - Basic Tests', () => {
  const mockTodos = [
    {
      id: 1,
      text: 'Test todo 1',
      completed: false,
      priority: 'high',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      text: 'Test todo 2',
      completed: true,
      priority: 'medium',
      createdAt: '2024-01-01T11:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z'
    }
  ];

  it('should be defined', () => {
    expect(TodoStats).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof TodoStats).toBe('function');
  });

  it('should accept todos prop', () => {
    expect(() => TodoStats({ todos: mockTodos })).not.toThrow();
  });

  it('should handle empty todos array', () => {
    expect(() => TodoStats({ todos: [] })).not.toThrow();
  });

  it('should handle missing props', () => {
    expect(() => TodoStats()).not.toThrow();
  });

  it('should handle undefined todos', () => {
    expect(() => TodoStats({ todos: undefined })).not.toThrow();
  });
});
