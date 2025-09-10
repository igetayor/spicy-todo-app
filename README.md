# 🌶️ Spicy Todo App - Full Stack

A modern, full-stack todo application built with React frontend and FastAPI backend, fully containerized with Docker for easy deployment and development.

## ✨ Features

### Frontend (React)
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Real-time Updates**: Live synchronization with backend API
- **Advanced Filtering**: Filter by status, priority, and search
- **Statistics Dashboard**: Visual insights into your productivity
- **Error Handling**: Graceful error handling with retry functionality
- **Loading States**: Smooth loading indicators for better UX

### Backend (FastAPI)
- **RESTful API**: Complete CRUD operations for todos
- **Advanced Filtering**: Server-side filtering and search
- **Data Validation**: Comprehensive input validation with Pydantic
- **CORS Support**: Configured for seamless frontend integration
- **Auto Documentation**: Interactive API docs with Swagger UI
- **Health Checks**: Built-in health monitoring

### Docker Integration
- **No Local Dependencies**: Runs without Python or Node.js installation
- **Development Mode**: Hot reload for both frontend and backend
- **Production Ready**: Optimized builds with security best practices
- **Cross-Platform**: Works on Windows, Mac, and Linux

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- No Python or Node.js installation required!

### Option 1: Production Deployment

**Windows Users:**
```cmd
start-fullstack.bat
```

**Linux/Mac Users:**
```bash
./start-fullstack.sh
```

**Manual Commands:**
```bash
# Build and start the full stack
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Option 2: Development Mode (with Hot Reload)

**Windows Users:**
```cmd
start-dev.bat
```

**Linux/Mac Users:**
```bash
./start-dev.sh
```

**Manual Commands:**
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development
docker-compose -f docker-compose.dev.yml down
```

## 🌐 Application URLs

Once started, access the application at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   React App     │◄──────────────►│   FastAPI       │
│   (Port 3000)   │                │   (Port 8000)   │
│                 │                │                 │
│ - TodoList      │                │ - CRUD API      │
│ - TodoForm      │                │ - Data Models   │
│ - TodoFilter    │                │ - Validation    │
│ - TodoStats     │                │ - CORS Config   │
└─────────────────┘                └─────────────────┘
         │                                   │
         │                                   │
    ┌────▼────┐                         ┌────▼────┐
    │  Nginx  │                         │ Python  │
    │ (Static)│                         │ Runtime │
    └─────────┘                         └─────────┘
```

## 📁 Project Structure

```
spicytodoapp/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API service layer
│   │   └── data/              # Sample data
│   ├── Dockerfile              # Production frontend
│   ├── Dockerfile.dev          # Development frontend
│   ├── nginx.conf              # Nginx configuration
│   └── .dockerignore
├── api/pyfast-api/             # FastAPI backend
│   ├── main.py                 # FastAPI application
│   ├── models.py               # Pydantic models
│   ├── database.py             # Data operations
│   ├── Dockerfile              # Backend container
│   └── requirements.txt        # Python dependencies
├── docker-compose.yml          # Production setup
├── docker-compose.dev.yml      # Development setup
├── start-fullstack.sh          # Production startup
├── start-fullstack.bat         # Windows production startup
├── start-dev.sh                # Development startup
├── start-dev.bat               # Windows development startup
└── README.md                   # This file
```

## 🔧 Development

### Frontend Development
The frontend is built with React and includes:
- Modern functional components with hooks
- API service layer for backend communication
- Responsive design with CSS animations
- Error handling and loading states

### Backend Development
The backend is built with FastAPI and includes:
- RESTful API endpoints
- Pydantic models for data validation
- CORS middleware for frontend integration
- Comprehensive error handling

### Docker Development Features
- **Hot Reload**: Changes to code automatically restart services
- **Volume Mounting**: Live code editing without rebuilding containers
- **Network Isolation**: Services communicate through Docker network
- **Health Checks**: Automatic service health monitoring

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | Get all todos with filtering |
| `POST` | `/api/todos` | Create a new todo |
| `GET` | `/api/todos/{id}` | Get specific todo |
| `PUT` | `/api/todos/{id}` | Update todo |
| `DELETE` | `/api/todos/{id}` | Delete todo |
| `PATCH` | `/api/todos/{id}/toggle` | Toggle completion |
| `GET` | `/api/todos/stats/summary` | Get statistics |
| `DELETE` | `/api/todos/completed` | Clear completed |

### Query Parameters
- `filter`: `all`, `active`, `completed`
- `search`: Text search in todo content
- `priority`: `low`, `medium`, `high`

## 🐳 Docker Configuration

### Production Setup
- **Multi-stage builds** for optimized images
- **Non-root users** for security
- **Health checks** for monitoring
- **Nginx** for frontend serving
- **Security headers** and optimizations

### Development Setup
- **Volume mounting** for live code editing
- **Hot reload** for both frontend and backend
- **Development dependencies** included
- **Debug-friendly** configurations

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8000
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **Docker Build Fails**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Frontend Can't Connect to Backend**
   - Check if both containers are running: `docker ps`
   - Verify CORS configuration in `api/pyfast-api/main.py`
   - Check network connectivity: `docker network ls`

4. **Permission Issues (Linux/Mac)**
   ```bash
   # Make scripts executable
   chmod +x *.sh
   ```

### Useful Commands

```bash
# View all running containers
docker ps

# View logs for specific service
docker-compose logs -f spicy-todo-api
docker-compose logs -f spicy-todo-frontend

# Restart specific service
docker-compose restart spicy-todo-api

# Access container shell
docker exec -it spicy-todo-api bash

# Clean up everything
docker-compose down -v
docker system prune -a
```

## 🚀 Production Deployment

For production deployment:

1. **Environment Variables**: Set production environment variables
2. **Database**: Replace in-memory storage with persistent database
3. **SSL/TLS**: Add HTTPS support with reverse proxy
4. **Monitoring**: Add logging and monitoring solutions
5. **Scaling**: Use Docker Swarm or Kubernetes for scaling

## 📊 Performance

- **Frontend**: Optimized React build with code splitting
- **Backend**: FastAPI with async/await for high performance
- **Docker**: Multi-stage builds for minimal image sizes
- **Nginx**: Gzip compression and static asset caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Ready to spice up your productivity! 🌶️**

