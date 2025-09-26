const express = require('express');
const router = express.Router();
const database = require('../database/database');
const logger = require('../utils/logger');
const { 
  validateTodoCreate, 
  validateTodoUpdate, 
  validateQuery, 
  validateId,
  asyncHandler,
  handleValidationError
} = require('../middleware/errorHandler');

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Get all todos
 *     description: Retrieve all todos with optional filtering and search
 *     tags: [Todos]
 *     parameters:
 *       - $ref: '#/components/parameters/Filter'
 *       - $ref: '#/components/parameters/Search'
 *     responses:
 *       200:
 *         description: List of todos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       400:
 *         description: Bad request - invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate query parameters
  const { error: queryError, value: queryParams } = validateQuery(req.query);
  if (queryError) {
    return res.status(400).json({
      error: 'Bad Request',
      message: queryError.details.map(detail => detail.message).join(', '),
      timestamp: new Date().toISOString()
    });
  }

  const { filter, search } = queryParams;
  
  try {
    const todos = await database.getAllTodos(filter, search);
    const duration = Date.now() - startTime;
    
    logger.logApiRequest('GET', '/api/todos', 200, duration);
    
    res.json(todos);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('GET', '/api/todos', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve todos',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get todo by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate ID parameter
  const { error: idError, value: id } = validateId(req.params.id);
  if (idError) {
    return res.status(400).json({
      error: 'Bad Request',
      message: idError.details.map(detail => detail.message).join(', '),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const todo = await database.getTodoById(id);
    const duration = Date.now() - startTime;
    
    if (!todo) {
      logger.logApiRequest('GET', `/api/todos/${id}`, 404, duration);
      return res.status(404).json({
        error: 'Not Found',
        message: `Todo with id ${id} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.logApiRequest('GET', `/api/todos/${id}`, 200, duration);
    res.json(todo);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('GET', `/api/todos/${id}`, 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve todo',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Create a new todo
 *     description: Create a new todo with optional due date and reminder
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TodoCreate'
 *           example:
 *             text: "Learn Express.js and build amazing APIs"
 *             priority: "high"
 *             dueDate: "2024-12-31"
 *             reminderTime: "10:00"
 *     responses:
 *       201:
 *         description: Todo created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       400:
 *         description: Bad request - validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate request body
  const { error: validationError, value: todoData } = validateTodoCreate(req.body);
  if (validationError) {
    return res.status(400).json({
      error: 'Bad Request',
      message: validationError.details.map(detail => detail.message).join(', '),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const newTodo = await database.createTodo(todoData);
    const duration = Date.now() - startTime;
    
    logger.logBusinessLogic('create_todo', { id: newTodo.id, text: newTodo.text });
    logger.logApiRequest('POST', '/api/todos', 201, duration);
    
    res.status(201).json(newTodo);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('POST', '/api/todos', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create todo',
      timestamp: new Date().toISOString()
    });
  }
}));

// Update todo
router.put('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate ID parameter
  const { error: idError, value: id } = validateId(req.params.id);
  if (idError) {
    return res.status(400).json({
      error: 'Bad Request',
      message: idError.details.map(detail => detail.message).join(', '),
      timestamp: new Date().toISOString()
    });
  }

  // Validate request body
  const { error: validationError, value: updateData } = validateTodoUpdate(req.body);
  if (validationError) {
    return res.status(400).json({
      error: 'Bad Request',
      message: validationError.details.map(detail => detail.message).join(', '),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const updatedTodo = await database.updateTodo(id, updateData);
    const duration = Date.now() - startTime;
    
    logger.logBusinessLogic('update_todo', { id, updateData });
    logger.logApiRequest('PUT', `/api/todos/${id}`, 200, duration);
    
    res.json(updatedTodo);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.message.includes('not found')) {
      logger.logApiRequest('PUT', `/api/todos/${id}`, 404, duration);
      return res.status(404).json({
        error: 'Not Found',
        message: `Todo with id ${id} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.logApiRequest('PUT', `/api/todos/${id}`, 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update todo',
      timestamp: new Date().toISOString()
    });
  }
}));

// Toggle todo completion status
router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate ID parameter
  const { error: idError, value: id } = validateId(req.params.id);
  if (idError) {
    return res.status(400).json({
      error: 'Bad Request',
      message: idError.details.map(detail => detail.message).join(', '),
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Get the current todo to toggle its status
    const todo = await database.getTodoById(id);
    if (!todo) {
      const duration = Date.now() - startTime;
      logger.logApiRequest('PATCH', `/api/todos/${id}/toggle`, 404, duration);
      return res.status(404).json({
        error: 'Not Found',
        message: `Todo with id ${id} not found`,
        timestamp: new Date().toISOString()
      });
    }

    // Toggle completion status
    const updatedTodo = await database.updateTodo(id, { completed: !todo.completed });
    const duration = Date.now() - startTime;
    
    logger.logBusinessLogic('toggle_todo', { id, completed: updatedTodo.completed });
    logger.logApiRequest('PATCH', `/api/todos/${id}/toggle`, 200, duration);
    
    res.json(updatedTodo);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('PATCH', `/api/todos/${id}/toggle`, 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to toggle todo',
      timestamp: new Date().toISOString()
    });
  }
}));

// Delete todo
router.delete('/:id', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Validate ID parameter
  const { error: idError, value: id } = validateId(req.params.id);
  if (idError) {
    return res.status(400).json({
      error: 'Bad Request',
      message: idError.details.map(detail => detail.message).join(', '),
      timestamp: new Date().toISOString()
    });
  }

  try {
    const deleted = await database.deleteTodo(id);
    const duration = Date.now() - startTime;
    
    if (!deleted) {
      logger.logApiRequest('DELETE', `/api/todos/${id}`, 404, duration);
      return res.status(404).json({
        error: 'Not Found',
        message: `Todo with id ${id} not found`,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.logBusinessLogic('delete_todo', { id });
    logger.logApiRequest('DELETE', `/api/todos/${id}`, 200, duration);
    
    res.status(200).json({
      message: 'Todo deleted successfully',
      id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('DELETE', `/api/todos/${id}`, 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete todo',
      timestamp: new Date().toISOString()
    });
  }
}));

// Delete all completed todos
router.delete('/completed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const deletedCount = await database.clearCompletedTodos();
    const duration = Date.now() - startTime;
    
    logger.logBusinessLogic('clear_completed_todos', { deletedCount });
    logger.logApiRequest('DELETE', '/api/todos/completed', 200, duration);
    
    res.json({
      message: 'Completed todos cleared successfully',
      deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('DELETE', '/api/todos/completed', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to clear completed todos',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @swagger
 * /todos/stats/summary:
 *   get:
 *     summary: Get todo statistics
 *     description: Retrieve comprehensive statistics about todos
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodoStats'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const stats = await database.getStatistics();
    const duration = Date.now() - startTime;
    
    logger.logApiRequest('GET', '/api/todos/stats/summary', 200, duration);
    
    res.json(stats);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('GET', '/api/todos/stats/summary', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch statistics',
      timestamp: new Date().toISOString()
    });
  }
}));

// Get upcoming reminders
router.get('/reminders', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const reminders = await database.getUpcomingReminders();
    const duration = Date.now() - startTime;
    
    logger.logApiRequest('GET', '/api/todos/reminders', 200, duration);
    
    res.json(reminders);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('GET', '/api/todos/reminders', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reminders',
      timestamp: new Date().toISOString()
    });
  }
}));

module.exports = router;
