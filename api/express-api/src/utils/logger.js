const winston = require('winston');
const path = require('path');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: { service: 'spicy-todo-express-api' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' 
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : consoleFormat
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add request logging method
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Add API request logging method
logger.logApiRequest = (method, endpoint, statusCode, duration, error = null) => {
  const logData = {
    method,
    endpoint,
    statusCode,
    duration: `${duration.toFixed(2)}ms`,
    error: error ? error.message : null
  };

  if (statusCode >= 400 || error) {
    logger.warn('API Request', logData);
  } else {
    logger.info('API Request', logData);
  }
};

// Add database operation logging method
logger.logDatabaseOperation = (operation, table, duration, error = null) => {
  const logData = {
    operation,
    table,
    duration: `${duration.toFixed(2)}ms`,
    error: error ? error.message : null
  };

  if (error) {
    logger.error('Database Operation', logData);
  } else {
    logger.debug('Database Operation', logData);
  }
};

// Add business logic logging method
logger.logBusinessLogic = (action, data, error = null) => {
  const logData = {
    action,
    data,
    error: error ? error.message : null
  };

  if (error) {
    logger.error('Business Logic', logData);
  } else {
    logger.info('Business Logic', logData);
  }
};

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ 
    filename: path.join(__dirname, '../../logs/exceptions.log'),
    format: fileFormat
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({ 
    filename: path.join(__dirname, '../../logs/rejections.log'),
    format: fileFormat
  })
);

module.exports = logger;
