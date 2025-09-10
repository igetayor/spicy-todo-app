@echo off
echo 🌶️ Starting Spicy Todo API with Docker...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    echo    Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose is not available. Please install Docker Compose.
        echo    Visit: https://docs.docker.com/compose/install/
        pause
        exit /b 1
    )
)

REM Stop existing container if running
echo 🛑 Stopping existing container...
docker-compose down

REM Build and start the container
echo 🔨 Building Docker image...
docker-compose build

echo 🚀 Starting container...
docker-compose up -d

REM Wait for container to be ready
echo ⏳ Waiting for API to be ready...
timeout /t 5 /nobreak >nul

REM Check if container is running
docker ps | findstr "spicy-todo-api" >nul
if %errorlevel% equ 0 (
    echo ✅ Spicy Todo API is running!
    echo.
    echo 📍 API URL: http://localhost:8000
    echo 📚 API Documentation: http://localhost:8000/docs
    echo 🔍 Health Check: http://localhost:8000/health
    echo.
    echo 📋 Useful commands:
    echo    View logs: docker-compose logs -f
    echo    Stop API: docker-compose down
    echo    Restart API: docker-compose restart
    echo.
) else (
    echo ❌ Failed to start the API container.
    echo 📋 Check logs with: docker-compose logs
    pause
    exit /b 1
)

pause
