import React from 'react';
import TodoFilter from '../TodoFilter';

describe('TodoFilter - Basic Tests', () => {
  const defaultProps = {
    filter: 'all',
    onFilterChange: jest.fn(),
    searchTerm: '',
    onSearchChange: jest.fn(),
    onClearCompleted: jest.fn(),
    completedCount: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(TodoFilter).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof TodoFilter).toBe('function');
  });

  it('should accept props', () => {
    expect(() => TodoFilter(defaultProps)).not.toThrow();
  });

  it('should handle missing props', () => {
    expect(() => TodoFilter()).not.toThrow();
  });

  it('should handle partial props', () => {
    const partialProps = {
      filter: 'active',
      onFilterChange: jest.fn()
    };
    expect(() => TodoFilter(partialProps)).not.toThrow();
  });
});
