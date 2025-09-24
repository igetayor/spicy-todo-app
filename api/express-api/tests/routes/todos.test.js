const request = require('supertest');
const app = require('../../src/app');

describe('Todos API Routes', () => {
  describe('GET /api/todos', () => {
    test('should return all todos', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check that todos have required properties
      response.body.forEach(todo => {
        expect(todo).toHaveProperty('id');
        expect(todo).toHaveProperty('text');
        expect(todo).toHaveProperty('priority');
        expect(todo).toHaveProperty('completed');
        expect(todo).toHaveProperty('createdAt');
        expect(todo).toHaveProperty('updatedAt');
      });
    });

    test('should filter todos by status', async () => {
      const response = await request(app)
        .get('/api/todos?filter=active')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(todo => {
        expect(todo.completed).toBe(false);
      });
    });

    test('should filter todos by search term', async () => {
      const response = await request(app)
        .get('/api/todos?search=React')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(todo => {
        expect(todo.text.toLowerCase()).toContain('react');
      });
    });

    test('should handle invalid filter parameter', async () => {
      const response = await request(app)
        .get('/api/todos?filter=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/todos/:id', () => {
    let testTodoId;

    beforeAll(async () => {
      // Create a test todo first
      const createResponse = await request(app)
        .post('/api/todos')
        .send({
          text: 'Test todo for ID endpoint',
          priority: 'medium'
        });
      
      testTodoId = createResponse.body.id;
    });

    test('should return todo by ID', async () => {
      const response = await request(app)
        .get(`/api/todos/${testTodoId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testTodoId);
      expect(response.body).toHaveProperty('text', 'Test todo for ID endpoint');
    });

    test('should return 404 for non-existent todo', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/todos/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/todos/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });
  });

  describe('POST /api/todos', () => {
    test('should create a new todo', async () => {
      const todoData = {
        text: 'New test todo',
        priority: 'high',
        dueDate: '2024-12-31',
        reminderTime: '10:00'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('text', todoData.text);
      expect(response.body).toHaveProperty('priority', todoData.priority);
      expect(response.body).toHaveProperty('completed', false);
      expect(response.body).toHaveProperty('dueDate', todoData.dueDate);
      expect(response.body).toHaveProperty('reminderTime', todoData.reminderTime);
    });

    test('should create todo with minimal data', async () => {
      const todoData = {
        text: 'Minimal todo'
      };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(201);

      expect(response.body).toHaveProperty('text', todoData.text);
      expect(response.body).toHaveProperty('priority', 'medium');
      expect(response.body).toHaveProperty('completed', false);
    });

    test('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should return 400 for text too long', async () => {
      const longText = 'a'.repeat(501);
      const response = await request(app)
        .post('/api/todos')
        .send({ text: longText })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should return 400 for invalid priority', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ 
          text: 'Valid text',
          priority: 'invalid' 
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should return 400 for past due date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const response = await request(app)
        .post('/api/todos')
        .send({
          text: 'Valid text',
          dueDate: yesterday.toISOString().split('T')[0]
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });

    test('should return 400 for reminder without due date', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({
          text: 'Valid text',
          reminderTime: '10:00'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Bad Request');
    });
  });

  describe('PUT /api/todos/:id', () => {
    let testTodoId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/todos')
        .send({
          text: 'Todo to update',
          priority: 'low'
        });
      
      testTodoId = createResponse.body.id;
    });

    test('should update todo', async () => {
      const updateData = {
        text: 'Updated todo text',
        priority: 'high',
        completed: true
      };

      const response = await request(app)
        .put(`/api/todos/${testTodoId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('text', updateData.text);
      expect(response.body).toHaveProperty('priority', updateData.priority);
      expect(response.body).toHaveProperty('completed', updateData.completed);
    });

    test('should return 404 for non-existent todo', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .put(`/api/todos/${fakeId}`)
        .send({ text: 'Updated text' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('PATCH /api/todos/:id/toggle', () => {
    let testTodoId;

    beforeAll(async () => {
      const createResponse = await request(app)
        .post('/api/todos')
        .send({
          text: 'Todo to toggle',
          completed: false
        });
      
      testTodoId = createResponse.body.id;
    });

    test('should toggle todo completion status', async () => {
      // First toggle
      const response1 = await request(app)
        .patch(`/api/todos/${testTodoId}/toggle`)
        .expect(200);

      expect(response1.body).toHaveProperty('completed', true);

      // Second toggle
      const response2 = await request(app)
        .patch(`/api/todos/${testTodoId}/toggle`)
        .expect(200);

      expect(response2.body).toHaveProperty('completed', false);
    });

    test('should return 404 for non-existent todo', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/api/todos/${fakeId}/toggle`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    test('should delete todo', async () => {
      // Create a todo first
      const createResponse = await request(app)
        .post('/api/todos')
        .send({
          text: 'Todo to delete',
          priority: 'low'
        });

      const todoId = createResponse.body.id;

      // Delete the todo
      const response = await request(app)
        .delete(`/api/todos/${todoId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Todo deleted successfully');
      expect(response.body).toHaveProperty('id', todoId);

      // Verify it's deleted
      await request(app)
        .get(`/api/todos/${todoId}`)
        .expect(404);
    });

    test('should return 404 for non-existent todo', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .delete(`/api/todos/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('DELETE /api/todos/completed', () => {
    test('should delete all completed todos', async () => {
      // Create some completed todos
      await request(app)
        .post('/api/todos')
        .send({ text: 'Completed todo 1', completed: true });

      await request(app)
        .post('/api/todos')
        .send({ text: 'Completed todo 2', completed: true });

      // Clear completed todos
      const response = await request(app)
        .delete('/api/todos/completed')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Completed todos cleared successfully');
      expect(response.body).toHaveProperty('deletedCount');
      expect(response.body.deletedCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/todos/stats/summary', () => {
    test('should return todo statistics', async () => {
      const response = await request(app)
        .get('/api/todos/stats/summary')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('completionRate');
      expect(response.body).toHaveProperty('priorityBreakdown');
      expect(response.body).toHaveProperty('overdueCount');
      expect(response.body).toHaveProperty('dueTodayCount');
      expect(response.body).toHaveProperty('upcomingCount');

      expect(response.body.priorityBreakdown).toHaveProperty('high');
      expect(response.body.priorityBreakdown).toHaveProperty('medium');
      expect(response.body.priorityBreakdown).toHaveProperty('low');

      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.completionRate).toBe('number');
    });
  });

  describe('GET /api/todos/reminders', () => {
    test('should return upcoming reminders', async () => {
      const response = await request(app)
        .get('/api/todos/reminders')
        .expect(200);

      expect(response.body).toHaveProperty('upcomingReminders');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.upcomingReminders)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });
  });
});
