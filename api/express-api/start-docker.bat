@echo off
REM SpicyTodo Express API - Docker Start Script for Windows

echo 🌶️ Starting SpicyTodo Express API with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install docker-compose first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs mkdir logs
if not exist data mkdir data

REM Start the API
echo 🚀 Starting Express API...
docker-compose up --build -d

REM Wait for the API to be ready
echo ⏳ Waiting for API to be ready...
timeout /t 10 /nobreak >nul

REM Check if the API is running
curl -f http://localhost:8000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SpicyTodo Express API is running successfully!
    echo 📊 API Health: http://localhost:8000/api/health
    echo 📚 API Documentation: http://localhost:8000/api/docs
    echo 🎯 API Base URL: http://localhost:8000/api
    echo.
    echo 📋 Available endpoints:
    echo   GET  /api/health                    - Health check
    echo   GET  /api/docs                      - API documentation
    echo   GET  /api/todos                     - Get all todos
    echo   POST /api/todos                     - Create todo
    echo   GET  /api/todos/:id                 - Get todo by ID
    echo   PUT  /api/todos/:id                 - Update todo
    echo   PATCH /api/todos/:id/toggle         - Toggle todo
    echo   DELETE /api/todos/:id               - Delete todo
    echo   DELETE /api/todos/completed         - Clear completed todos
    echo   GET  /api/todos/stats/summary       - Get statistics
    echo   GET  /api/todos/reminders           - Get upcoming reminders
    echo.
    echo 🛑 To stop the API: docker-compose down
    echo 📝 To view logs: docker-compose logs -f
) else (
    echo ❌ Failed to start SpicyTodo Express API
    echo 📝 Check logs with: docker-compose logs
    pause
    exit /b 1
)

pause

