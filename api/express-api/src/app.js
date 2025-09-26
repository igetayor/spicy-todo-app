const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { specs, swaggerUi, swaggerOptions } = require('./middleware/swagger');

// Import routes
const todosRoutes = require('./routes/todos');
const healthRoutes = require('./routes/health');
const exportRoutes = require('./routes/export');
const importRoutes = require('./routes/import');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Custom request logging
app.use(requestLogger);

// Routes
app.use('/api/todos', todosRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🌶️ SpicyTodo Express API',
    version: '1.0.0',
    description: 'Express.js alternative to FastAPI for SpicyTodoApp',
    endpoints: {
      health: '/api/health',
      todos: '/api/todos',
      docs: '/api/docs',
      export: '/api/export',
      import: '/api/import'
    },
    timestamp: new Date().toISOString()
  });
});

// Swagger API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Legacy API documentation endpoint (redirects to Swagger)
app.get('/api/documentation', (req, res) => {
  res.redirect('/api/docs');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/docs',
      'GET /api/todos',
      'POST /api/todos',
      'GET /api/todos/:id',
      'PUT /api/todos/:id',
      'PATCH /api/todos/:id/toggle',
      'DELETE /api/todos/:id',
      'DELETE /api/todos/completed',
      'GET /api/todos/stats/summary',
      'GET /api/todos/reminders'
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🌶️ SpicyTodo Express API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
