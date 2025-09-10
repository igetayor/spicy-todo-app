@echo off
echo 🌶️ Starting Spicy Todo Full Stack Application...
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

REM Stop existing containers if running
echo 🛑 Stopping existing containers...
docker-compose down

REM Build and start the containers
echo 🔨 Building Docker images...
docker-compose build

echo 🚀 Starting full stack application...
docker-compose up -d

REM Wait for containers to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if containers are running
docker ps | findstr "spicy-todo-api" >nul
if %errorlevel% equ 0 (
    docker ps | findstr "spicy-todo-frontend" >nul
    if %errorlevel% equ 0 (
        echo ✅ Spicy Todo Full Stack Application is running!
        echo.
        echo 🌐 Application URLs:
        echo    Frontend: http://localhost:3000
        echo    Backend API: http://localhost:8000
        echo    API Documentation: http://localhost:8000/docs
        echo    Health Check: http://localhost:8000/health
        echo.
        echo 📋 Useful commands:
        echo    View logs: docker-compose logs -f
        echo    Stop application: docker-compose down
        echo    Restart application: docker-compose restart
        echo    View backend logs: docker-compose logs -f spicy-todo-api
        echo    View frontend logs: docker-compose logs -f spicy-todo-frontend
        echo.
        echo 🔧 Development mode:
        echo    docker-compose -f docker-compose.dev.yml up --build
        echo.
    ) else (
        echo ❌ Frontend container failed to start.
        goto :error
    )
) else (
    echo ❌ Backend container failed to start.
    goto :error
)

goto :end

:error
echo ❌ Failed to start the application containers.
echo 📋 Check logs with: docker-compose logs
pause
exit /b 1

:end
pause

