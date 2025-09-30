const Joi = require('joi');

// Priority enum validation
const prioritySchema = Joi.string().valid('low', 'medium', 'high').default('medium');

// Date validation (ISO date string)
const dateSchema = Joi.string().isoDate().messages({
  'string.isoDate': 'Due date must be a valid ISO date string (YYYY-MM-DD)'
});

// Time validation (HH:MM format)
const timeSchema = Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
  'string.pattern.base': 'Reminder time must be in HH:MM format'
});

// Base todo schema
const todoBaseSchema = Joi.object({
  text: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Todo text cannot be empty',
    'string.min': 'Todo text must be at least 1 character long',
    'string.max': 'Todo text cannot exceed 500 characters'
  }),
  priority: prioritySchema,
  completed: Joi.boolean().default(false),
  dueDate: dateSchema.allow(null).optional(),
  reminderTime: timeSchema.allow(null).optional(),
  recurrenceRule: Joi.string().valid('none', 'daily', 'weekly', 'monthly').default('none'),
  snoozedUntil: Joi.string().isoDate().allow(null).optional()
}).custom((value, helpers) => {
  // Custom validation: reminder time requires due date
  if (value.reminderTime && !value.dueDate) {
    return helpers.error('custom.reminderRequiresDueDate');
  }
  
  // Custom validation: due date cannot be in the past
  if (value.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    if (value.dueDate < today) {
      return helpers.error('custom.dueDateInPast');
    }
  }
  
  return value;
}).messages({
  'custom.reminderRequiresDueDate': 'Reminder time requires a due date to be set',
  'custom.dueDateInPast': 'Due date cannot be in the past'
});

// Todo creation schema
const todoCreateSchema = todoBaseSchema;

// Todo update schema (all fields optional)
const todoUpdateSchema = Joi.object({
  text: Joi.string().min(1).max(500).optional(),
  priority: prioritySchema.optional(),
  completed: Joi.boolean().optional(),
  dueDate: dateSchema.allow(null).optional(),
  reminderTime: timeSchema.allow(null).optional(),
  recurrenceRule: Joi.string().valid('none', 'daily', 'weekly', 'monthly').optional(),
  snoozedUntil: Joi.string().isoDate().allow(null).optional()
}).custom((value, helpers) => {
  // Custom validation: reminder time requires due date
  if (value.reminderTime && !value.dueDate) {
    return helpers.error('custom.reminderRequiresDueDate');
  }
  
  // Custom validation: due date cannot be in the past
  if (value.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    if (value.dueDate < today) {
      return helpers.error('custom.dueDateInPast');
    }
  }
  
  return value;
}).messages({
  'custom.reminderRequiresDueDate': 'Reminder time requires a due date to be set',
  'custom.dueDateInPast': 'Due date cannot be in the past'
});

// Query parameters schema
const querySchema = Joi.object({
  filter: Joi.string().valid('all', 'active', 'completed').default('all'),
  search: Joi.string().max(100).optional().allow('')
});

// ID parameter schema
const idSchema = Joi.string().uuid().required().messages({
  'string.uuid': 'Todo ID must be a valid UUID',
  'any.required': 'Todo ID is required'
});

// Error response schema
const errorResponseSchema = Joi.object({
  error: Joi.string().required(),
  message: Joi.string().optional(),
  details: Joi.object().optional(),
  timestamp: Joi.string().isoDate().optional()
});

// Todo response schema
const todoResponseSchema = Joi.object({
  id: Joi.string().uuid().required(),
  text: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high').required(),
  completed: Joi.boolean().required(),
  dueDate: Joi.string().isoDate().allow(null).optional(),
  reminderTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null).optional(),
  createdAt: Joi.string().isoDate().required(),
  updatedAt: Joi.string().isoDate().required()
});

// Statistics response schema
const statsResponseSchema = Joi.object({
  total: Joi.number().integer().min(0).required(),
  active: Joi.number().integer().min(0).required(),
  completed: Joi.number().integer().min(0).required(),
  completionRate: Joi.number().min(0).max(100).required(),
  priorityBreakdown: Joi.object({
    high: Joi.number().integer().min(0).required(),
    medium: Joi.number().integer().min(0).required(),
    low: Joi.number().integer().min(0).required()
  }).required(),
  overdueCount: Joi.number().integer().min(0).default(0),
  dueTodayCount: Joi.number().integer().min(0).default(0),
  upcomingCount: Joi.number().integer().min(0).default(0)
});

// Reminders response schema
const remindersResponseSchema = Joi.object({
  upcomingReminders: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      text: Joi.string().required(),
      priority: Joi.string().valid('low', 'medium', 'high').required(),
      dueDate: Joi.string().isoDate().required(),
      reminderTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      reminderDateTime: Joi.string().isoDate().required()
    })
  ).required(),
  count: Joi.number().integer().min(0).required()
});

module.exports = {
  todoCreateSchema,
  todoUpdateSchema,
  querySchema,
  idSchema,
  errorResponseSchema,
  todoResponseSchema,
  statsResponseSchema,
  remindersResponseSchema,
  
  // Validation helper functions
  validateTodoCreate: (data) => todoCreateSchema.validate(data),
  validateTodoUpdate: (data) => todoUpdateSchema.validate(data),
  validateQuery: (data) => querySchema.validate(data),
  validateId: (data) => idSchema.validate(data),
  validateErrorResponse: (data) => errorResponseSchema.validate(data),
  validateTodoResponse: (data) => todoResponseSchema.validate(data),
  validateStatsResponse: (data) => statsResponseSchema.validate(data),
  validateRemindersResponse: (data) => remindersResponseSchema.validate(data)
};

