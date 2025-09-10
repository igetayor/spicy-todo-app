import React from 'react';
import App from '../App';

describe('App - Basic Tests', () => {
  it('should be defined', () => {
    expect(App).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof App).toBe('function');
  });

  it('should render without props', () => {
    expect(() => App()).not.toThrow();
  });

  it('should render with empty props', () => {
    expect(() => App({})).not.toThrow();
  });

  it('should render with null props', () => {
    expect(() => App(null)).not.toThrow();
  });
});
