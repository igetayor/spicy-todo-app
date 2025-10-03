const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SpicyTodo Express API',
      version: '1.0.0',
      description: 'A modern Express.js RESTful API for managing todos with due dates and reminders',
      contact: {
        name: 'SpicyTodoApp Team',
        email: 'team@spicytodoapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.spicytodoapp.com/api',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Todo: {
          type: 'object',
          required: ['text'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the todo',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            text: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Todo text content',
              example: 'Learn Express.js and build amazing APIs'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              default: 'medium',
              description: 'Todo priority level',
              example: 'high'
            },
            completed: {
              type: 'boolean',
              default: false,
              description: 'Completion status',
              example: false
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Due date for the todo (YYYY-MM-DD)',
              example: '2024-12-31'
            },
            reminderTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Reminder time for the todo (HH:MM)',
              example: '10:00'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-01-15T10:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-15T10:00:00.000Z'
            }
          }
        },
        TodoCreate: {
          type: 'object',
          required: ['text'],
          properties: {
            text: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Todo text content',
              example: 'Learn Express.js and build amazing APIs'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              default: 'medium',
              description: 'Todo priority level',
              example: 'high'
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Due date for the todo (YYYY-MM-DD)',
              example: '2024-12-31'
            },
            reminderTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Reminder time for the todo (HH:MM)',
              example: '10:00'
            }
          }
        },
        TodoUpdate: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              minLength: 1,
              maxLength: 500,
              description: 'Updated todo text content',
              example: 'Updated todo text'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Updated priority level',
              example: 'medium'
            },
            completed: {
              type: 'boolean',
              description: 'Updated completion status',
              example: true
            },
            dueDate: {
              type: 'string',
              format: 'date',
              description: 'Updated due date (YYYY-MM-DD)',
              example: '2024-12-31'
            },
            reminderTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              description: 'Updated reminder time (HH:MM)',
              example: '14:30'
            }
          }
        },
        TodoStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              minimum: 0,
              description: 'Total number of todos',
              example: 10
            },
            active: {
              type: 'integer',
              minimum: 0,
              description: 'Number of active todos',
              example: 7
            },
            completed: {
              type: 'integer',
              minimum: 0,
              description: 'Number of completed todos',
              example: 3
            },
            completionRate: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Completion rate percentage',
              example: 30.0
            },
            priorityBreakdown: {
              type: 'object',
              properties: {
                high: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Number of high priority todos',
                  example: 3
                },
                medium: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Number of medium priority todos',
                  example: 4
                },
                low: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Number of low priority todos',
                  example: 3
                }
              }
            },
            overdueCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of overdue todos',
              example: 1
            },
            dueTodayCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of todos due today',
              example: 2
            },
            upcomingCount: {
              type: 'integer',
              minimum: 0,
              description: 'Number of todos due in the next 7 days',
              example: 4
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
              example: 'Bad Request'
            },
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
              example: '2024-01-15T10:00:00.000Z'
            }
          }
        }
      },
      parameters: {
        TodoId: {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Todo ID'
        },
        Filter: {
          name: 'filter',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['all', 'active', 'completed'],
            default: 'all'
          },
          description: 'Filter todos by status'
        },
        Search: {
          name: 'search',
          in: 'query',
          schema: {
            type: 'string',
            maxLength: 100
          },
          description: 'Search todos by text content'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions: {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true
    }
  }
};






