const Todo = require('../../src/models/Todo');

describe('Todo Model', () => {
  describe('Constructor', () => {
    test('should create a todo with default values', () => {
      const todo = new Todo();
      
      expect(todo.id).toBeDefined();
      expect(todo.text).toBe('');
      expect(todo.priority).toBe('medium');
      expect(todo.completed).toBe(false);
      expect(todo.dueDate).toBeNull();
      expect(todo.reminderTime).toBeNull();
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    test('should create a todo with provided data', () => {
      const data = {
        id: 'test-id',
        text: 'Test todo',
        priority: 'high',
        completed: true,
        dueDate: '2024-12-31',
        reminderTime: '10:00'
      };
      
      const todo = new Todo(data);
      
      expect(todo.id).toBe(data.id);
      expect(todo.text).toBe(data.text);
      expect(todo.priority).toBe(data.priority);
      expect(todo.completed).toBe(data.completed);
      expect(todo.dueDate).toBe(data.dueDate);
      expect(todo.reminderTime).toBe(data.reminderTime);
    });
  });

  describe('toJSON', () => {
    test('should return JSON representation of todo', () => {
      const data = {
        id: 'test-id',
        text: 'Test todo',
        priority: 'high',
        completed: true,
        dueDate: '2024-12-31',
        reminderTime: '10:00'
      };
      
      const todo = new Todo(data);
      const json = todo.toJSON();
      
      expect(json).toEqual({
        id: data.id,
        text: data.text,
        priority: data.priority,
        completed: data.completed,
        dueDate: data.dueDate,
        reminderTime: data.reminderTime,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt
      });
    });
  });

  describe('update', () => {
    test('should update todo properties', () => {
      const todo = new Todo({ text: 'Original text', priority: 'low' });
      const updateData = { text: 'Updated text', priority: 'high' };
      
      todo.update(updateData);
      
      expect(todo.text).toBe('Updated text');
      expect(todo.priority).toBe('high');
      expect(todo.updatedAt).not.toBe(todo.createdAt);
    });

    test('should only update allowed fields', () => {
      const todo = new Todo({ text: 'Original text' });
      const updateData = { 
        text: 'Updated text', 
        id: 'new-id', // Should not be updated
        createdAt: '2024-01-01' // Should not be updated
      };
      
      const originalId = todo.id;
      const originalCreatedAt = todo.createdAt;
      
      todo.update(updateData);
      
      expect(todo.text).toBe('Updated text');
      expect(todo.id).toBe(originalId);
      expect(todo.createdAt).toBe(originalCreatedAt);
    });
  });

  describe('toggle', () => {
    test('should toggle completion status', () => {
      const todo = new Todo({ completed: false });
      
      todo.toggle();
      expect(todo.completed).toBe(true);
      
      todo.toggle();
      expect(todo.completed).toBe(false);
    });

    test('should update updatedAt timestamp', () => {
      const todo = new Todo({ completed: false });
      const originalUpdatedAt = todo.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        todo.toggle();
        expect(todo.updatedAt).not.toBe(originalUpdatedAt);
      }, 1);
    });
  });

  describe('due date status methods', () => {
    test('isOverdue should return true for past due dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todo = new Todo({ 
        dueDate: yesterday.toISOString().split('T')[0],
        completed: false 
      });
      
      expect(todo.isOverdue()).toBe(true);
    });

    test('isOverdue should return false for completed todos', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todo = new Todo({ 
        dueDate: yesterday.toISOString().split('T')[0],
        completed: true 
      });
      
      expect(todo.isOverdue()).toBe(false);
    });

    test('isDueToday should return true for today\'s due date', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const todo = new Todo({ 
        dueDate: today,
        completed: false 
      });
      
      expect(todo.isDueToday()).toBe(true);
    });

    test('isDueSoon should return true for dates within next 7 days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todo = new Todo({ 
        dueDate: tomorrow.toISOString().split('T')[0],
        completed: false 
      });
      
      expect(todo.isDueSoon()).toBe(true);
    });
  });

  describe('getDueDateStatus', () => {
    test('should return correct status for overdue todo', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todo = new Todo({ 
        dueDate: yesterday.toISOString().split('T')[0],
        completed: false 
      });
      
      expect(todo.getDueDateStatus()).toBe('overdue');
    });

    test('should return correct status for completed todo', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todo = new Todo({ 
        dueDate: yesterday.toISOString().split('T')[0],
        completed: true 
      });
      
      expect(todo.getDueDateStatus()).toBe('completed');
    });

    test('should return empty string for todo without due date', () => {
      const todo = new Todo({ completed: false });
      expect(todo.getDueDateStatus()).toBe('');
    });
  });

  describe('validate', () => {
    test('should validate correct todo data', () => {
      const todo = new Todo({
        text: 'Valid todo',
        priority: 'high',
        dueDate: '2024-12-31',
        reminderTime: '10:00'
      });
      
      const validation = todo.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should fail validation for empty text', () => {
      const todo = new Todo({ text: '' });
      
      const validation = todo.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Todo text is required');
    });

    test('should fail validation for text too long', () => {
      const longText = 'a'.repeat(501);
      const todo = new Todo({ text: longText });
      
      const validation = todo.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Todo text cannot exceed 500 characters');
    });

    test('should fail validation for invalid priority', () => {
      const todo = new Todo({ text: 'Valid text', priority: 'invalid' });
      
      const validation = todo.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Priority must be low, medium, or high');
    });

    test('should fail validation for past due date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todo = new Todo({
        text: 'Valid text',
        dueDate: yesterday.toISOString().split('T')[0]
      });
      
      const validation = todo.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Due date cannot be in the past');
    });

    test('should fail validation for reminder without due date', () => {
      const todo = new Todo({
        text: 'Valid text',
        reminderTime: '10:00'
      });
      
      const validation = todo.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Reminder time requires a due date');
    });

    test('should fail validation for invalid time format', () => {
      const todo = new Todo({
        text: 'Valid text',
        dueDate: '2024-12-31',
        reminderTime: '25:00'
      });
      
      const validation = todo.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Reminder time must be in HH:MM format');
    });
  });

  describe('createSampleTodos', () => {
    test('should create sample todos with valid data', () => {
      const sampleTodos = Todo.createSampleTodos();
      
      expect(sampleTodos).toBeInstanceOf(Array);
      expect(sampleTodos.length).toBeGreaterThan(0);
      
      sampleTodos.forEach(todo => {
        expect(todo).toBeInstanceOf(Todo);
        expect(todo.text).toBeDefined();
        expect(todo.priority).toMatch(/^(low|medium|high)$/);
      });
    });
  });

  describe('fromJSON', () => {
    test('should create todo from JSON data', () => {
      const jsonData = {
        id: 'test-id',
        text: 'Test todo',
        priority: 'high',
        completed: true,
        dueDate: '2024-12-31',
        reminderTime: '10:00',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      };
      
      const todo = Todo.fromJSON(jsonData);
      
      expect(todo).toBeInstanceOf(Todo);
      expect(todo.id).toBe(jsonData.id);
      expect(todo.text).toBe(jsonData.text);
      expect(todo.priority).toBe(jsonData.priority);
      expect(todo.completed).toBe(jsonData.completed);
      expect(todo.dueDate).toBe(jsonData.dueDate);
      expect(todo.reminderTime).toBe(jsonData.reminderTime);
      expect(todo.createdAt).toBe(jsonData.createdAt);
      expect(todo.updatedAt).toBe(jsonData.updatedAt);
    });
  });
});

