const { v4: uuidv4 } = require('uuid');

class Todo {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.text = data.text || '';
    this.priority = data.priority || 'medium';
    this.completed = data.completed || false;
    this.dueDate = data.dueDate || null;
    this.reminderTime = data.reminderTime || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Convert to JSON object
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      priority: this.priority,
      completed: this.completed,
      dueDate: this.dueDate,
      reminderTime: this.reminderTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Update todo properties
  update(data) {
    const allowedFields = ['text', 'priority', 'completed', 'dueDate', 'reminderTime'];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        this[field] = data[field];
      }
    });
    
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Toggle completion status
  toggle() {
    this.completed = !this.completed;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Check if todo is overdue
  isOverdue() {
    if (!this.dueDate || this.completed) {
      return false;
    }
    
    const today = new Date().toISOString().split('T')[0];
    return this.dueDate < today;
  }

  // Check if todo is due today
  isDueToday() {
    if (!this.dueDate || this.completed) {
      return false;
    }
    
    const today = new Date().toISOString().split('T')[0];
    return this.dueDate === today;
  }

  // Check if todo is due within next 7 days
  isDueSoon() {
    if (!this.dueDate || this.completed) {
      return false;
    }
    
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return dueDate > today && dueDate <= nextWeek;
  }

  // Get due date status
  getDueDateStatus() {
    if (!this.dueDate) {
      return '';
    }
    
    if (this.completed) {
      return 'completed';
    }
    
    if (this.isOverdue()) {
      return 'overdue';
    }
    
    if (this.isDueToday()) {
      return 'due-today';
    }
    
    if (this.isDueSoon()) {
      return 'due-soon';
    }
    
    return 'upcoming';
  }

  // Validate todo data
  validate() {
    const errors = [];
    
    if (!this.text || this.text.trim().length === 0) {
      errors.push('Todo text is required');
    }
    
    if (this.text && this.text.length > 500) {
      errors.push('Todo text cannot exceed 500 characters');
    }
    
    if (!['low', 'medium', 'high'].includes(this.priority)) {
      errors.push('Priority must be low, medium, or high');
    }
    
    if (this.dueDate) {
      const today = new Date().toISOString().split('T')[0];
      if (this.dueDate < today) {
        errors.push('Due date cannot be in the past');
      }
    }
    
    if (this.reminderTime && !this.dueDate) {
      errors.push('Reminder time requires a due date');
    }
    
    if (this.reminderTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(this.reminderTime)) {
        errors.push('Reminder time must be in HH:MM format');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create todo from JSON data
  static fromJSON(jsonData) {
    return new Todo(jsonData);
  }

  // Create sample todos for testing/demo
  static createSampleTodos() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      new Todo({
        text: 'Learn React hooks and state management',
        priority: 'high',
        completed: false,
        dueDate: tomorrow.toISOString().split('T')[0],
        reminderTime: '09:00'
      }),
      new Todo({
        text: 'Build a spicy todo application',
        priority: 'high',
        completed: true,
        dueDate: yesterday.toISOString().split('T')[0],
        reminderTime: '14:30'
      }),
      new Todo({
        text: 'Add beautiful animations and transitions',
        priority: 'medium',
        completed: false,
        dueDate: nextWeek.toISOString().split('T')[0],
        reminderTime: '16:00'
      }),
      new Todo({
        text: 'Implement dark mode toggle',
        priority: 'low',
        completed: false,
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reminderTime: '10:30'
      }),
      new Todo({
        text: 'Write comprehensive tests',
        priority: 'medium',
        completed: false,
        dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reminderTime: '13:00'
      }),
      new Todo({
        text: 'Deploy to production',
        priority: 'high',
        completed: true,
        dueDate: yesterday.toISOString().split('T')[0],
        reminderTime: '09:00'
      }),
      new Todo({
        text: 'Optimize performance and bundle size',
        priority: 'medium',
        completed: false,
        dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reminderTime: '15:30'
      }),
      new Todo({
        text: 'Add keyboard shortcuts for power users',
        priority: 'low',
        completed: false,
        dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reminderTime: '11:00'
      })
    ];
  }
}

module.exports = Todo;
