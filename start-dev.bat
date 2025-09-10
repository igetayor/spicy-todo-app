@echo off
echo 🌶️ Starting Spicy Todo Development Environment...
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
echo 🛑 Stopping existing development containers...
docker-compose -f docker-compose.dev.yml down

REM Build and start the containers
echo 🔨 Building Docker images for development...
docker-compose -f docker-compose.dev.yml build

echo 🚀 Starting development environment...
docker-compose -f docker-compose.dev.yml up -d

REM Wait for containers to be ready
echo ⏳ Waiting for development services to be ready...
timeout /t 10 /nobreak >nul

REM Check if containers are running
docker ps | findstr "spicy-todo-api-dev" >nul
if %errorlevel% equ 0 (
    docker ps | findstr "spicy-todo-frontend-dev" >nul
    if %errorlevel% equ 0 (
        echo ✅ Spicy Todo Development Environment is running!
        echo.
        echo 🌐 Development URLs:
        echo    Frontend (with hot reload): http://localhost:3000
        echo    Backend API (with auto-reload): http://localhost:8000
        echo    API Documentation: http://localhost:8000/docs
        echo    Health Check: http://localhost:8000/health
        echo.
        echo 📋 Development commands:
        echo    View all logs: docker-compose -f docker-compose.dev.yml logs -f
        echo    Stop development: docker-compose -f docker-compose.dev.yml down
        echo    Restart development: docker-compose -f docker-compose.dev.yml restart
        echo    View backend logs: docker-compose -f docker-compose.dev.yml logs -f spicy-todo-api
        echo    View frontend logs: docker-compose -f docker-compose.dev.yml logs -f spicy-todo-frontend
        echo.
        echo 🔄 Hot Reload Features:
        echo    - Frontend: Changes to React components will auto-reload
        echo    - Backend: Changes to Python files will auto-reload
        echo    - Both services are volume-mounted for live development
        echo.
    ) else (
        echo ❌ Frontend development container failed to start.
        goto :error
    )
) else (
    echo ❌ Backend development container failed to start.
    goto :error
)

goto :end

:error
echo ❌ Failed to start the development containers.
echo 📋 Check logs with: docker-compose -f docker-compose.dev.yml logs
pause
exit /b 1

:end
pause

