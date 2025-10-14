# 🌶️ SpicyTodo Spring Boot API

An enterprise-grade Java implementation of the Spicy Todo API using Spring Boot. This is an alternative backend implementation that provides the same functionality as the FastAPI, Express, and Go versions.

## ✨ Features

### Core Functionality
- **Full CRUD Operations**: Create, Read, Update, and Delete todos
- **Due Dates & Reminders**: Set due dates and reminder times for todos
- **Priority System**: High, Medium, and Low priority levels
- **Advanced Filtering**: Filter by status (all/active/completed) and search by text
- **Statistics Dashboard**: Comprehensive todo analytics and insights

### Technical Features
- **Spring Boot 3.2**: Latest Spring Boot framework
- **RESTful API**: Clean, intuitive REST endpoints
- **Bean Validation**: Comprehensive input validation
- **Lombok**: Reduced boilerplate code
- **Maven**: Dependency management
- **Docker Support**: Full containerization for easy deployment
- **Enterprise-Ready**: Production-ready configurations

## 🚀 Quick Start

### Prerequisites
- Java 17+ or Docker
- Maven 3.9+ (if building locally)

### Option 1: Docker (Recommended)

**Build and run with Docker:**
```bash
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the API
docker-compose down
```

### Option 2: Local Development

1. **Install dependencies:**
```bash
mvn clean install
```

2. **Run the API:**
```bash
# Using Maven
mvn spring-boot:run

# Or build and run JAR
mvn clean package
java -jar target/spicy-todo-api-1.0.0.jar
```

3. **Access the API:**
- API Base: http://localhost:8000/api
- Health Check: http://localhost:8000/health

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### Health & Info
- `GET /` - API information
- `GET /health` - Health check

#### Todos
- `GET /api/todos` - Get all todos (supports filtering and search)
- `POST /api/todos` - Create new todo
- `GET /api/todos/{id}` - Get todo by ID
- `PUT /api/todos/{id}` - Update todo
- `PATCH /api/todos/{id}/toggle` - Toggle todo completion
- `DELETE /api/todos/{id}` - Delete todo
- `DELETE /api/todos/completed` - Delete all completed todos

#### Statistics & Analytics
- `GET /api/todos/stats/summary` - Get todo statistics

### Request/Response Examples

#### Create Todo
```bash
POST /api/todos
Content-Type: application/json

{
  "text": "Learn Spring Boot",
  "priority": "high",
  "dueDate": "2024-12-31",
  "reminderTime": "10:00"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "text": "Learn Spring Boot",
  "priority": "high",
  "completed": false,
  "dueDate": "2024-12-31",
  "reminderTime": "10:00",
  "createdAt": "2024-01-15T10:00:00",
  "updatedAt": "2024-01-15T10:00:00"
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
api/spring-boot-api/
├── src/
│   ├── main/
│   │   ├── java/com/spicytodo/
│   │   │   ├── SpicyTodoApplication.java
│   │   │   ├── controller/
│   │   │   │   ├── TodoController.java
│   │   │   │   └── HealthController.java
│   │   │   ├── service/
│   │   │   │   └── TodoService.java
│   │   │   ├── model/
│   │   │   │   ├── Todo.java
│   │   │   │   ├── Priority.java
│   │   │   │   └── TodoStats.java
│   │   │   └── dto/
│   │   │       ├── TodoCreateRequest.java
│   │   │       └── TodoUpdateRequest.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Configuration

**application.properties:**
```properties
server.port=8000
spring.application.name=spicy-todo-api
logging.level.root=INFO
```

### Building
```bash
# Build with Maven
mvn clean package

# Run tests
mvn test

# Skip tests
mvn clean package -DskipTests
```

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

### Docker Features
- **Multi-stage builds** for optimized image size
- **Eclipse Temurin JRE** for production runtime
- **Health checks** for container monitoring
- **Lightweight Alpine Linux** base

## 📊 Performance

### Spring Boot Advantages
- **Enterprise-Grade**: Battle-tested in production environments
- **Scalability**: Handles high concurrent loads
- **Ecosystem**: Rich ecosystem of libraries and tools
- **Community**: Large, active community support
- **Auto-Configuration**: Smart defaults and auto-configuration

## 🔧 Configuration

### CORS Configuration
The API is configured to allow requests from:
- http://localhost:3000
- http://127.0.0.1:3000

CORS is configured in the `@CrossOrigin` annotation in controllers.

## 🆚 Spring Boot vs Other Implementations

| Feature | Spring Boot | Go/Gin | Express | FastAPI |
|---------|-------------|--------|---------|---------|
| Language | Java | Go | JavaScript | Python |
| Performance | High | Very High | High | Very High |
| Type Safety | Compile-time | Compile-time | Runtime | Runtime |
| Ecosystem | Very Large | Growing | Large | Growing |
| Enterprise | Excellent | Good | Good | Good |
| Learning Curve | Moderate | Low | Low | Low |

All APIs are fully compatible and can be used interchangeably with the React frontend.

## 🧪 Testing

```bash
# Run all tests
mvn test

# Run specific test
mvn test -Dtest=TodoServiceTest

# Generate coverage report
mvn test jacoco:report
```

## 🐛 Troubleshooting

### Common Issues

#### API Not Starting
```bash
# Check if port 8000 is available
netstat -tulpn | grep :8000

# Check Docker logs
docker-compose logs spicy-todo-spring-api
```

#### Build Issues
```bash
# Clean and rebuild
mvn clean install -U

# Clear Maven cache
rm -rf ~/.m2/repository
```

### Getting Help
- Check the logs for detailed error messages
- Verify health: `curl http://localhost:8000/health`
- Review application.properties
- Check Docker status: `docker ps`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

🌶️ **Built with Spring Boot for the SpicyTodoApp** 🌶️

