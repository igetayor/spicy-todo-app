const express = require('express');
const multer = require('multer');
const router = express.Router();
const database = require('../database/database');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateTodoCreate } = require('../models/validation');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'text/csv', 'application/xml', 'text/xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, CSV, and XML files are allowed.'), false);
    }
  }
});

/**
 * @swagger
 * /import/todos:
 *   post:
 *     summary: Import todos from file
 *     description: Import todos from JSON, CSV, or XML file
 *     tags: [Export/Import]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File containing todos (JSON, CSV, or XML)
 *               mode:
 *                 type: string
 *                 enum: [replace, append, update]
 *                 default: append
 *                 description: Import mode
 *     responses:
 *       200:
 *         description: Todos imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Todos imported successfully
 *                 imported:
 *                   type: integer
 *                   example: 5
 *                 skipped:
 *                   type: integer
 *                   example: 2
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 importedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - invalid file or mode
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
router.post('/todos', upload.single('file'), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'No file provided',
      timestamp: new Date().toISOString()
    });
  }

  const { mode = 'append' } = req.body;
  const validModes = ['replace', 'append', 'update'];
  
  if (!validModes.includes(mode)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid mode. Valid modes: ${validModes.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const fileContent = req.file.buffer.toString('utf8');
    const fileType = req.file.mimetype;
    
    let todos;
    
    // Parse file based on type
    switch (fileType) {
      case 'application/json':
        todos = parseJSON(fileContent);
        break;
      case 'text/csv':
        todos = parseCSV(fileContent);
        break;
      case 'application/xml':
      case 'text/xml':
        todos = parseXML(fileContent);
        break;
      default:
        throw new Error('Unsupported file type');
    }

    // Validate and import todos
    const result = await importTodos(todos, mode);
    const duration = Date.now() - startTime;
    
    logger.logBusinessLogic('import_todos', { 
      count: todos.length, 
      mode, 
      imported: result.imported,
      skipped: result.skipped 
    });
    logger.logApiRequest('POST', '/api/import/todos', 200, duration);
    
    res.json({
      message: 'Todos imported successfully',
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
      importedAt: new Date().toISOString()
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('POST', '/api/import/todos', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to import todos',
      timestamp: new Date().toISOString()
    });
  }
}));

// Helper function to parse JSON
function parseJSON(content) {
  try {
    const data = JSON.parse(content);
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.todos && Array.isArray(data.todos)) {
      return data.todos;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      throw new Error('Invalid JSON structure. Expected array of todos or object with todos/data array.');
    }
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

// Helper function to parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const todos = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} values but expected ${headers.length}`);
    }

    const todo = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Convert string values to appropriate types
      if (header === 'completed') {
        value = value.toLowerCase() === 'true';
      } else if (header === 'id' && !value) {
        // Generate new ID if not provided
        value = require('uuid').v4();
      }
      
      todo[header] = value || null;
    });

    todos.push(todo);
  }

  return todos;
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

// Helper function to parse XML
function parseXML(content) {
  try {
    const xml2js = require('xml2js');
    const parser = new xml2js.Parser();
    
    return new Promise((resolve, reject) => {
      parser.parseString(content, (err, result) => {
        if (err) {
          reject(new Error(`Invalid XML: ${err.message}`));
          return;
        }

        try {
          let todos;
          
          if (result.todos && result.todos.todo) {
            todos = result.todos.todo.map(todo => ({
              id: todo.id?.[0] || require('uuid').v4(),
              text: todo.text?.[0] || '',
              priority: todo.priority?.[0] || 'medium',
              completed: todo.completed?.[0] === 'true',
              dueDate: todo.dueDate?.[0] || null,
              reminderTime: todo.reminderTime?.[0] || null,
              createdAt: todo.createdAt?.[0] || new Date().toISOString(),
              updatedAt: todo.updatedAt?.[0] || new Date().toISOString()
            }));
          } else {
            throw new Error('Invalid XML structure. Expected <todos><todo>...</todo></todos>');
          }
          
          resolve(todos);
        } catch (error) {
          reject(new Error(`Error parsing XML structure: ${error.message}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`XML parsing failed: ${error.message}`);
  }
}

// Helper function to import todos
async function importTodos(todos, mode) {
  const result = {
    imported: 0,
    skipped: 0,
    errors: []
  };

  // If replace mode, clear existing todos
  if (mode === 'replace') {
    const existingTodos = await database.getAllTodos();
    for (const todo of existingTodos) {
      await database.deleteTodo(todo.id);
    }
  }

  for (let i = 0; i < todos.length; i++) {
    try {
      const todo = todos[i];
      
      // Validate todo data
      const { error, value } = validateTodoCreate(todo);
      if (error) {
        result.errors.push(`Row ${i + 1}: ${error.details.map(d => d.message).join(', ')}`);
        result.skipped++;
        continue;
      }

      if (mode === 'update' && todo.id) {
        // Try to update existing todo
        const existingTodo = await database.getTodoById(todo.id);
        if (existingTodo) {
          await database.updateTodo(todo.id, value);
          result.imported++;
        } else {
          // Create new todo if not found
          await database.createTodo(value);
          result.imported++;
        }
      } else {
        // Create new todo
        await database.createTodo(value);
        result.imported++;
      }
    } catch (error) {
      result.errors.push(`Row ${i + 1}: ${error.message}`);
      result.skipped++;
    }
  }

  return result;
}

module.exports = router;

