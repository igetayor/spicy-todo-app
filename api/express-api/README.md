# 🌶️ SpicyTodo Express API

A modern Express.js RESTful API for managing todos with due dates and reminders. This is an alternative implementation to the FastAPI backend, providing the same functionality with Node.js and Express.

## ✨ Features

### Core Functionality
- **Full CRUD Operations**: Create, Read, Update, and Delete todos
- **Due Dates & Reminders**: Set due dates and reminder times for todos
- **Priority System**: High, Medium, and Low priority levels
- **Advanced Filtering**: Filter by status (all/active/completed) and search by text
- **Statistics Dashboard**: Comprehensive todo analytics and insights
- **Reminder Notifications**: Get upcoming reminders for todos

### Technical Features
- **RESTful API**: Clean, intuitive REST endpoints
- **Data Validation**: Comprehensive input validation with Joi
- **Error Handling**: Graceful error handling with detailed error messages
- **Logging**: Structured logging with Winston
- **Database Support**: Both in-memory and SQLite database options
- **Docker Support**: Full containerization for easy deployment
- **Comprehensive Testing**: 80%+ test coverage with Jest
- **Security**: Helmet, CORS, rate limiting, and input sanitization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Docker
- npm or yarn

### Option 1: Docker (Recommended)

**Windows Users:**
```cmd
start-docker.bat
```

**Linux/Mac Users:**
```bash
chmod +x start-docker.sh
./start-docker.sh
```

**Manual Docker Commands:**
```bash
# Production deployment
docker-compose up --build -d

# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose logs -f

# Stop the API
docker-compose down
```

### Option 2: Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start the API:**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

4. **Access the API:**
- API Base: http://localhost:8000/api
- Health Check: http://localhost:8000/api/health
- Documentation: http://localhost:8000/api/docs

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication
Currently no authentication required. All endpoints are public.

### Endpoints

#### Health & Info
- `GET /` - API information
- `GET /health` - Health check
- `GET /docs` - API documentation

#### Todos
- `GET /todos` - Get all todos (supports filtering and search)
- `POST /todos` - Create new todo
- `GET /todos/:id` - Get todo by ID
- `PUT /todos/:id` - Update todo
- `PATCH /todos/:id/toggle` - Toggle todo completion
- `DELETE /todos/:id` - Delete todo
- `DELETE /todos/completed` - Delete all completed todos

#### Statistics & Analytics
- `GET /todos/stats/summary` - Get todo statistics
- `GET /todos/reminders` - Get upcoming reminders

### Request/Response Examples

#### Create Todo
```bash
POST /api/todos
Content-Type: application/json

{
  "text": "Learn Express.js",
  "priority": "high",
  "dueDate": "2024-12-31",
  "reminderTime": "10:00"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "text": "Learn Express.js",
  "priority": "high",
  "completed": false,
  "dueDate": "2024-12-31",
  "reminderTime": "10:00",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### Get Todos with Filtering
```bash
GET /api/todos?filter=active&search=learn
```

#### Get Statistics
```bash
GET /api/todos/stats/summary
```

**Response:**
```json
{
  "total": 10,
  "active": 7,
  "completed": 3,
  "completionRate": 30.0,
  "priorityBreakdown": {
    "high": 3,
    "medium": 4,
    "low": 3
  },
  "overdueCount": 1,
  "dueTodayCount": 2,
  "upcomingCount": 4
}
```

## 🛠️ Development

### Project Structure
```
api/express-api/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── models/
│   │   ├── Todo.js           # Todo model class
│   │   └── validation.js     # Joi validation schemas
│   ├── routes/
│   │   ├── todos.js          # Todo API routes
│   │   └── health.js         # Health check routes
│   ├── middleware/
│   │   ├── errorHandler.js   # Error handling middleware
│   │   └── requestLogger.js  # Request logging middleware
│   ├── database/
│   │   └── database.js       # Database abstraction layer
│   └── utils/
│       └── logger.js         # Winston logger configuration
├── tests/
│   ├── models/
│   ├── routes/
│   ├── database/
│   └── setup.js
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Environment Variables
```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DATABASE_URL=sqlite:./data/app.db
USE_PERSISTENT_STORAGE=true

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Available Scripts
```bash
# Development
npm run dev          # Start with nodemon (hot reload)
npm start            # Start in production mode

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/models/Todo.test.js
```

### Test Coverage
- **Models**: Todo class, validation, business logic
- **Routes**: All API endpoints, error handling
- **Database**: CRUD operations, queries, statistics
- **Middleware**: Error handling, request logging

### Coverage Thresholds
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Development with Hot Reload
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Docker Features
- **Multi-stage builds** for optimized production images
- **Non-root user** for security
- **Health checks** for container monitoring
- **Volume mounts** for data persistence
- **Environment-specific** configurations

## 📊 Monitoring & Logging

### Logging
- **Structured logging** with Winston
- **Multiple transports**: Console, File
- **Log levels**: Error, Warn, Info, Debug
- **Request/Response logging** with timing
- **Database operation logging**

### Health Monitoring
- **Health check endpoint**: `/api/health`
- **Docker health checks** configured
- **Uptime tracking** and service status

### Performance Monitoring
- **Request timing** in logs
- **Database operation timing**
- **Memory usage** tracking
- **Response time** metrics

## 🔧 Configuration

### Database Options

#### In-Memory (Default for Development)
```env
USE_PERSISTENT_STORAGE=false
```

#### SQLite (Production)
```env
USE_PERSISTENT_STORAGE=true
DATABASE_URL=sqlite:./data/app.db
```

### CORS Configuration
```env
CORS_ORIGIN=http://localhost:3000
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure persistent database storage
- [ ] Set up proper logging level
- [ ] Configure CORS origins
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Set up SSL/TLS certificates

### Environment-Specific Configs

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
USE_PERSISTENT_STORAGE=false
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=info
USE_PERSISTENT_STORAGE=true
DATABASE_URL=sqlite:/app/data/app.db
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Run linting: `npm run lint`
7. Commit changes: `git commit -m "Add feature"`
8. Push to branch: `git push origin feature-name`
9. Submit a pull request

### Code Style
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for functions
- Write tests for new features
- Keep functions small and focused

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆚 Express vs FastAPI

This Express.js API provides the same functionality as the FastAPI backend:

| Feature | Express API | FastAPI |
|---------|-------------|---------|
| Language | JavaScript/Node.js | Python |
| Framework | Express.js | FastAPI |
| Validation | Joi | Pydantic |
| Database | SQLite + In-Memory | SQLite + In-Memory |
| Testing | Jest | pytest |
| Documentation | Auto-generated JSON | Swagger UI |
| Performance | High | Very High |
| Type Safety | Runtime validation | Compile-time + Runtime |

Both APIs are fully compatible and can be used interchangeably with the React frontend.

## 🐛 Troubleshooting

### Common Issues

#### API Not Starting
```bash
# Check if port 8000 is available
netstat -tulpn | grep :8000

# Check Docker logs
docker-compose logs spicy-todo-express-api
```

#### Database Issues
```bash
# Reset database
rm -rf data/
docker-compose restart
```

#### Permission Issues
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER data/ logs/
```

### Getting Help
- Check the logs: `docker-compose logs -f`
- Verify health: `curl http://localhost:8000/api/health`
- Review environment variables
- Check Docker status: `docker ps`

---

🌶️ **Built with Express.js for the SpicyTodoApp** 🌶️

