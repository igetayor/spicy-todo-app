const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const Todo = require('../models/Todo');

class Database {
  constructor() {
    this.db = null;
    this.usePersistentStorage = process.env.USE_PERSISTENT_STORAGE === 'true';
    this.databaseUrl = process.env.DATABASE_URL || 'sqlite:./data/app.db';
    this.todos = []; // In-memory storage fallback
  }

  async initialize() {
    if (this.usePersistentStorage) {
      await this.initializeSQLite();
    } else {
      this.initializeInMemory();
    }
    
    logger.info('Database initialized', {
      type: this.usePersistentStorage ? 'SQLite' : 'In-Memory',
      url: this.databaseUrl
    });
  }

  async initializeSQLite() {
    try {
      // Extract database path from URL
      const dbPath = this.databaseUrl.replace('sqlite:', '');
      const dbDir = path.dirname(dbPath);
      
      // Ensure directory exists
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Error opening SQLite database', { error: err.message });
          throw err;
        }
      });

      // Create tables
      await this.createTables();
      
      // Check if we need to seed data
      const count = await this.getTodosCount();
      if (count === 0) {
        await this.seedData();
      }
      
    } catch (error) {
      logger.error('Failed to initialize SQLite database', { error: error.message });
      logger.warn('Falling back to in-memory storage');
      this.usePersistentStorage = false;
      this.initializeInMemory();
    }
  }

  initializeInMemory() {
    this.todos = Todo.createSampleTodos();
    logger.info('In-memory database initialized with sample data', {
      count: this.todos.length
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS todos (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'medium',
          completed BOOLEAN NOT NULL DEFAULT 0,
          due_date TEXT,
          reminder_time TEXT,
          recurrence_rule TEXT DEFAULT 'none',
          snoozed_until TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async seedData() {
    const sampleTodos = Todo.createSampleTodos();
    
    for (const todo of sampleTodos) {
      await this.createTodo(todo);
    }
    
    logger.info('Database seeded with sample data', {
      count: sampleTodos.length
    });
  }

  // CRUD Operations
  async getAllTodos(filter = 'all', searchTerm = '') {
    const startTime = Date.now();
    
    try {
      let todos;
      
      if (this.usePersistentStorage) {
        todos = await this.getAllTodosFromSQLite(filter, searchTerm);
      } else {
        todos = this.getAllTodosFromMemory(filter, searchTerm);
      }
      
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('SELECT_ALL', 'todos', duration);
      
      return todos;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('SELECT_ALL', 'todos', duration, error);
      throw error;
    }
  }

  getAllTodosFromMemory(filter, searchTerm) {
    let todos = [...this.todos];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      todos = todos.filter(todo => 
        todo.text.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (filter === 'active') {
      todos = todos.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      todos = todos.filter(todo => todo.completed);
    }
    
    return todos;
  }

  async getAllTodosFromSQLite(filter, searchTerm) {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM todos WHERE 1=1';
      const params = [];
      
      // Apply search filter
      if (searchTerm) {
        sql += ' AND text LIKE ?';
        params.push(`%${searchTerm}%`);
      }
      
      // Apply status filter
      if (filter === 'active') {
        sql += ' AND completed = 0';
      } else if (filter === 'completed') {
        sql += ' AND completed = 1';
      }
      
      sql += ' ORDER BY created_at DESC';
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const todos = rows.map(row => new Todo({
            id: row.id,
            text: row.text,
            priority: row.priority,
            completed: Boolean(row.completed),
            dueDate: row.due_date,
            reminderTime: row.reminder_time,
            recurrenceRule: row.recurrence_rule || 'none',
            snoozedUntil: row.snoozed_until || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
          resolve(todos);
        }
      });
    });
  }

  async getTodoById(id) {
    const startTime = Date.now();
    
    try {
      let todo;
      
      if (this.usePersistentStorage) {
        todo = await this.getTodoByIdFromSQLite(id);
      } else {
        todo = this.getTodoByIdFromMemory(id);
      }
      
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('SELECT_BY_ID', 'todos', duration);
      
      return todo;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('SELECT_BY_ID', 'todos', duration, error);
      throw error;
    }
  }

  getTodoByIdFromMemory(id) {
    return this.todos.find(todo => todo.id === id) || null;
  }

  async getTodoByIdFromSQLite(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          const todo = new Todo({
            id: row.id,
            text: row.text,
            priority: row.priority,
            completed: Boolean(row.completed),
            dueDate: row.due_date,
            reminderTime: row.reminder_time,
            recurrenceRule: row.recurrence_rule || 'none',
            snoozedUntil: row.snoozed_until || null,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          });
          resolve(todo);
        }
      });
    });
  }

  async createTodo(todoData) {
    const startTime = Date.now();
    
    try {
      const todo = new Todo(todoData);
      const validation = todo.validate();
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      let result;
      
      if (this.usePersistentStorage) {
        result = await this.createTodoInSQLite(todo);
      } else {
        result = this.createTodoInMemory(todo);
      }
      
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('INSERT', 'todos', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('INSERT', 'todos', duration, error);
      throw error;
    }
  }

  createTodoInMemory(todo) {
    this.todos.unshift(todo); // Add to beginning
    return todo;
  }

  async createTodoInSQLite(todo) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO todos (id, text, priority, completed, due_date, reminder_time, recurrence_rule, snoozed_until, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        todo.id,
        todo.text,
        todo.priority,
        todo.completed ? 1 : 0,
        todo.dueDate,
        todo.reminderTime,
        todo.recurrenceRule,
        todo.snoozedUntil,
        todo.createdAt,
        todo.updatedAt
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(todo);
        }
      });
    });
  }

  async updateTodo(id, updateData) {
    const startTime = Date.now();
    
    try {
      let result;
      
      if (this.usePersistentStorage) {
        result = await this.updateTodoInSQLite(id, updateData);
      } else {
        result = this.updateTodoInMemory(id, updateData);
      }
      
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('UPDATE', 'todos', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('UPDATE', 'todos', duration, error);
      throw error;
    }
  }

  updateTodoInMemory(id, updateData) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }
    
    const todo = this.todos[todoIndex];
    todo.update(updateData);
    
    return todo;
  }

  async updateTodoInSQLite(id, updateData) {
    return new Promise((resolve, reject) => {
      // First, get the existing todo
      this.getTodoById(id).then(existingTodo => {
        if (!existingTodo) {
          reject(new Error(`Todo with id ${id} not found`));
          return;
        }
        
        // Update the todo
        const updatedTodo = existingTodo.update(updateData);
        
        // Update in database
        const sql = `
          UPDATE todos 
          SET text = ?, priority = ?, completed = ?, due_date = ?, reminder_time = ?, recurrence_rule = ?, snoozed_until = ?, updated_at = ?
          WHERE id = ?
        `;
        
        const params = [
          updatedTodo.text,
          updatedTodo.priority,
          updatedTodo.completed ? 1 : 0,
          updatedTodo.dueDate,
          updatedTodo.reminderTime,
          updatedTodo.recurrenceRule,
          updatedTodo.snoozedUntil,
          updatedTodo.updatedAt,
          id
        ];
        
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(updatedTodo);
          }
        });
      }).catch(reject);
    });
  }

  async deleteTodo(id) {
    const startTime = Date.now();
    
    try {
      let result;
      
      if (this.usePersistentStorage) {
        result = await this.deleteTodoInSQLite(id);
      } else {
        result = this.deleteTodoInMemory(id);
      }
      
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('DELETE', 'todos', duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('DELETE', 'todos', duration, error);
      throw error;
    }
  }

  deleteTodoInMemory(id) {
    const todoIndex = this.todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
      return false;
    }
    
    this.todos.splice(todoIndex, 1);
    return true;
  }

  async deleteTodoInSQLite(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async clearCompletedTodos() {
    const startTime = Date.now();
    
    try {
      let count;
      
      if (this.usePersistentStorage) {
        count = await this.clearCompletedTodosInSQLite();
      } else {
        count = this.clearCompletedTodosInMemory();
      }
      
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('DELETE_COMPLETED', 'todos', duration);
      
      return count;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logDatabaseOperation('DELETE_COMPLETED', 'todos', duration, error);
      throw error;
    }
  }

  clearCompletedTodosInMemory() {
    const initialCount = this.todos.length;
    this.todos = this.todos.filter(todo => !todo.completed);
    return initialCount - this.todos.length;
  }

  async clearCompletedTodosInSQLite() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM todos WHERE completed = 1', function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async getTodosCount() {
    if (this.usePersistentStorage) {
      return new Promise((resolve, reject) => {
        this.db.get('SELECT COUNT(*) as count FROM todos', (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        });
      });
    } else {
      return this.todos.length;
    }
  }

  async getStatistics() {
    const todos = await this.getAllTodos();
    const today = new Date().toISOString().split('T')[0];
    
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;
    
    const priorityBreakdown = {
      high: todos.filter(todo => todo.priority === 'high').length,
      medium: todos.filter(todo => todo.priority === 'medium').length,
      low: todos.filter(todo => todo.priority === 'low').length
    };
    
    const overdueCount = todos.filter(todo => 
      !todo.completed && todo.dueDate && todo.dueDate < today
    ).length;
    
    const dueTodayCount = todos.filter(todo => 
      !todo.completed && todo.dueDate && todo.dueDate === today
    ).length;
    
    const upcomingCount = todos.filter(todo => {
      if (!todo.completed && todo.dueDate && todo.dueDate > today) {
        const dueDate = new Date(todo.dueDate);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return dueDate <= nextWeek;
      }
      return false;
    }).length;
    
    return {
      total,
      active,
      completed,
      completionRate,
      priorityBreakdown,
      overdueCount,
      dueTodayCount,
      upcomingCount
    };
  }

  async getUpcomingReminders() {
    const todos = await this.getAllTodos();
    const now = new Date();
    const upcomingReminders = [];
    
    todos.forEach(todo => {
      if (todo.dueDate && todo.reminderTime && !todo.completed) {
        const reminderDateTime = new Date(`${todo.dueDate}T${todo.reminderTime}`);
        const timeDiff = reminderDateTime - now;
        
        // Check if reminder time is within the next hour
        if (timeDiff >= 0 && timeDiff <= 60 * 60 * 1000) {
          upcomingReminders.push({
            id: todo.id,
            text: todo.text,
            priority: todo.priority,
            dueDate: todo.dueDate,
            reminderTime: todo.reminderTime,
            reminderDateTime: reminderDateTime.toISOString()
          });
        }
      }
    });
    
    return {
      upcomingReminders,
      count: upcomingReminders.length
    };
  }

  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;

