const database = require('../../src/database/database');
const Todo = require('../../src/models/Todo');

describe('Database', () => {
  beforeAll(async () => {
    await database.initialize();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('getAllTodos', () => {
    test('should return all todos', async () => {
      const todos = await database.getAllTodos();
      
      expect(Array.isArray(todos)).toBe(true);
      expect(todos.length).toBeGreaterThan(0);
      
      todos.forEach(todo => {
        expect(todo).toBeInstanceOf(Todo);
      });
    });

    test('should filter todos by status', async () => {
      const activeTodos = await database.getAllTodos('active');
      
      activeTodos.forEach(todo => {
        expect(todo.completed).toBe(false);
      });
    });

    test('should search todos by text', async () => {
      const searchResults = await database.getAllTodos('all', 'React');
      
      searchResults.forEach(todo => {
        expect(todo.text.toLowerCase()).toContain('react');
      });
    });
  });

  describe('getTodoById', () => {
    let testTodoId;

    beforeAll(async () => {
      const newTodo = await database.createTodo({
        text: 'Test todo for getById',
        priority: 'medium'
      });
      testTodoId = newTodo.id;
    });

    test('should return todo by ID', async () => {
      const todo = await database.getTodoById(testTodoId);
      
      expect(todo).toBeInstanceOf(Todo);
      expect(todo.id).toBe(testTodoId);
      expect(todo.text).toBe('Test todo for getById');
    });

    test('should return null for non-existent ID', async () => {
      const todo = await database.getTodoById('00000000-0000-0000-0000-000000000000');
      
      expect(todo).toBeNull();
    });
  });

  describe('createTodo', () => {
    test('should create a new todo', async () => {
      const todoData = {
        text: 'New test todo',
        priority: 'high',
        dueDate: '2024-12-31',
        reminderTime: '10:00'
      };

      const todo = await database.createTodo(todoData);
      
      expect(todo).toBeInstanceOf(Todo);
      expect(todo.text).toBe(todoData.text);
      expect(todo.priority).toBe(todoData.priority);
      expect(todo.dueDate).toBe(todoData.dueDate);
      expect(todo.reminderTime).toBe(todoData.reminderTime);
      expect(todo.completed).toBe(false);
      expect(todo.id).toBeDefined();
    });

    test('should throw error for invalid data', async () => {
      const invalidData = {
        text: '', // Empty text should fail validation
        priority: 'invalid'
      };

      await expect(database.createTodo(invalidData)).rejects.toThrow();
    });
  });

  describe('updateTodo', () => {
    let testTodoId;

    beforeAll(async () => {
      const newTodo = await database.createTodo({
        text: 'Todo to update',
        priority: 'low'
      });
      testTodoId = newTodo.id;
    });

    test('should update todo', async () => {
      const updateData = {
        text: 'Updated todo text',
        priority: 'high',
        completed: true
      };

      const updatedTodo = await database.updateTodo(testTodoId, updateData);
      
      expect(updatedTodo.text).toBe(updateData.text);
      expect(updatedTodo.priority).toBe(updateData.priority);
      expect(updatedTodo.completed).toBe(updateData.completed);
    });

    test('should throw error for non-existent ID', async () => {
      const updateData = { text: 'Updated text' };
      
      await expect(
        database.updateTodo('00000000-0000-0000-0000-000000000000', updateData)
      ).rejects.toThrow('not found');
    });
  });

  describe('deleteTodo', () => {
    let testTodoId;

    beforeAll(async () => {
      const newTodo = await database.createTodo({
        text: 'Todo to delete',
        priority: 'medium'
      });
      testTodoId = newTodo.id;
    });

    test('should delete todo', async () => {
      const deleted = await database.deleteTodo(testTodoId);
      
      expect(deleted).toBe(true);
      
      // Verify it's deleted
      const todo = await database.getTodoById(testTodoId);
      expect(todo).toBeNull();
    });

    test('should return false for non-existent ID', async () => {
      const deleted = await database.deleteTodo('00000000-0000-0000-0000-000000000000');
      
      expect(deleted).toBe(false);
    });
  });

  describe('clearCompletedTodos', () => {
    test('should delete all completed todos', async () => {
      // Create some completed todos
      await database.createTodo({ text: 'Completed todo 1', completed: true });
      await database.createTodo({ text: 'Completed todo 2', completed: true });
      
      const deletedCount = await database.clearCompletedTodos();
      
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getTodosCount', () => {
    test('should return total number of todos', async () => {
      const count = await database.getTodosCount();
      
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStatistics', () => {
    test('should return todo statistics', async () => {
      const stats = await database.getStatistics();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('completionRate');
      expect(stats).toHaveProperty('priorityBreakdown');
      expect(stats).toHaveProperty('overdueCount');
      expect(stats).toHaveProperty('dueTodayCount');
      expect(stats).toHaveProperty('upcomingCount');

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.completionRate).toBe('number');
      expect(stats.priorityBreakdown).toHaveProperty('high');
      expect(stats.priorityBreakdown).toHaveProperty('medium');
      expect(stats.priorityBreakdown).toHaveProperty('low');
    });
  });

  describe('getUpcomingReminders', () => {
    test('should return upcoming reminders', async () => {
      const reminders = await database.getUpcomingReminders();
      
      expect(reminders).toHaveProperty('upcomingReminders');
      expect(reminders).toHaveProperty('count');
      expect(Array.isArray(reminders.upcomingReminders)).toBe(true);
      expect(typeof reminders.count).toBe('number');
    });
  });
});
