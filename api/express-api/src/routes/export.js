const express = require('express');
const router = express.Router();
const database = require('../database/database');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @swagger
 * /export/todos:
 *   get:
 *     summary: Export all todos
 *     description: Export all todos in various formats (JSON, CSV, XML)
 *     tags: [Export/Import]
 *     parameters:
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [json, csv, xml]
 *           default: json
 *         description: Export format
 *       - name: filter
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, active, completed]
 *           default: all
 *         description: Filter todos by status
 *     responses:
 *       200:
 *         description: Todos exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Todo'
 *                 format:
 *                   type: string
 *                   example: json
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 exportedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - invalid format
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
router.get('/todos', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { format = 'json', filter = 'all' } = req.query;
  
  // Validate format
  const validFormats = ['json', 'csv', 'xml'];
  if (!validFormats.includes(format)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Invalid format. Supported formats: ${validFormats.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const todos = await database.getAllTodos(filter);
    const duration = Date.now() - startTime;
    
    logger.logApiRequest('GET', '/api/export/todos', 200, duration);
    
    const exportData = {
      data: todos,
      format,
      count: todos.length,
      exportedAt: new Date().toISOString(),
      filter
    };

    // Set appropriate content type and filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `todos_${filter}_${timestamp}`;

    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(convertToCSV(todos));
        break;
        
      case 'xml':
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xml"`);
        res.send(convertToXML(todos));
        break;
        
      default: // json
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json(exportData);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('GET', '/api/export/todos', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export todos',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @swagger
 * /export/statistics:
 *   get:
 *     summary: Export todo statistics
 *     description: Export comprehensive todo statistics
 *     tags: [Export/Import]
 *     responses:
 *       200:
 *         description: Statistics exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   $ref: '#/components/schemas/TodoStats'
 *                 exportedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const stats = await database.getStatistics();
    const duration = Date.now() - startTime;
    
    logger.logApiRequest('GET', '/api/export/statistics', 200, duration);
    
    const exportData = {
      statistics: stats,
      exportedAt: new Date().toISOString()
    };

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `statistics_${timestamp}`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json(exportData);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logApiRequest('GET', '/api/export/statistics', 500, duration, error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export statistics',
      timestamp: new Date().toISOString()
    });
  }
}));

// Helper function to convert todos to CSV
function convertToCSV(todos) {
  if (todos.length === 0) {
    return 'id,text,priority,completed,dueDate,reminderTime,createdAt,updatedAt\n';
  }

  const headers = ['id', 'text', 'priority', 'completed', 'dueDate', 'reminderTime', 'createdAt', 'updatedAt'];
  const csvRows = [headers.join(',')];

  todos.forEach(todo => {
    const row = headers.map(header => {
      const value = todo[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Helper function to convert todos to XML
function convertToXML(todos) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<todos>\n';
  
  todos.forEach(todo => {
    xml += '  <todo>\n';
    xml += `    <id>${escapeXml(todo.id)}</id>\n`;
    xml += `    <text>${escapeXml(todo.text)}</text>\n`;
    xml += `    <priority>${escapeXml(todo.priority)}</priority>\n`;
    xml += `    <completed>${todo.completed}</completed>\n`;
    xml += `    <dueDate>${escapeXml(todo.dueDate || '')}</dueDate>\n`;
    xml += `    <reminderTime>${escapeXml(todo.reminderTime || '')}</reminderTime>\n`;
    xml += `    <createdAt>${escapeXml(todo.createdAt)}</createdAt>\n`;
    xml += `    <updatedAt>${escapeXml(todo.updatedAt)}</updatedAt>\n`;
    xml += '  </todo>\n';
  });
  
  xml += '</todos>';
  return xml;
}

// Helper function to escape XML special characters
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = router;
