#!/bin/bash

echo "🌶️ Starting Spicy Todo Development Environment..."
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Function to check if containers are running
check_containers() {
    if docker ps | grep -q "spicy-todo-api-dev" && docker ps | grep -q "spicy-todo-frontend-dev"; then
        return 0
    else
        return 1
    fi
}

# Stop existing containers if running
if check_containers; then
    echo "🛑 Stopping existing development containers..."
    docker-compose -f docker-compose.dev.yml down
fi

# Build and start the containers
echo "🔨 Building Docker images for development..."
docker-compose -f docker-compose.dev.yml build

echo "🚀 Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for containers to be ready
echo "⏳ Waiting for development services to be ready..."
sleep 10

# Check if containers are running
if check_containers; then
    echo "✅ Spicy Todo Development Environment is running!"
    echo
    echo "🌐 Development URLs:"
    echo "   Frontend (with hot reload): http://localhost:3000"
    echo "   Backend API (with auto-reload): http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo "   Health Check: http://localhost:8000/health"
    echo
    echo "📋 Development commands:"
    echo "   View all logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "   Stop development: docker-compose -f docker-compose.dev.yml down"
    echo "   Restart development: docker-compose -f docker-compose.dev.yml restart"
    echo "   View backend logs: docker-compose -f docker-compose.dev.yml logs -f spicy-todo-api"
    echo "   View frontend logs: docker-compose -f docker-compose.dev.yml logs -f spicy-todo-frontend"
    echo
    echo "🔄 Hot Reload Features:"
    echo "   - Frontend: Changes to React components will auto-reload"
    echo "   - Backend: Changes to Python files will auto-reload"
    echo "   - Both services are volume-mounted for live development"
    echo
else
    echo "❌ Failed to start the development containers."
    echo "📋 Check logs with: docker-compose -f docker-compose.dev.yml logs"
    exit 1
fi

