const request = require('supertest');
const app = require('../../src/app');

describe('Health API Routes', () => {
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('service');

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.environment).toBe('test');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.service).toBe('SpicyTodo Express API');
    });
  });
});

