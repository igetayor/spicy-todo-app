import React from 'react';
import EmptyState from '../EmptyState';

describe('EmptyState - Basic Tests', () => {
  it('should be defined', () => {
    expect(EmptyState).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof EmptyState).toBe('function');
  });

  it('should render without props', () => {
    expect(() => EmptyState()).not.toThrow();
  });

  it('should render with empty props', () => {
    expect(() => EmptyState({})).not.toThrow();
  });

  it('should render with null props', () => {
    expect(() => EmptyState(null)).not.toThrow();
  });
});
