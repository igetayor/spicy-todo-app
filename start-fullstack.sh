#!/bin/bash

echo "🌶️ Starting Spicy Todo Full Stack Application..."
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
    if docker ps | grep -q "spicy-todo-api" && docker ps | grep -q "spicy-todo-frontend"; then
        return 0
    else
        return 1
    fi
}

# Stop existing containers if running
if check_containers; then
    echo "🛑 Stopping existing containers..."
    docker-compose down
fi

# Build and start the containers
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting full stack application..."
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if check_containers; then
    echo "✅ Spicy Todo Full Stack Application is running!"
    echo
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo "   Health Check: http://localhost:8000/health"
    echo
    echo "📋 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop application: docker-compose down"
    echo "   Restart application: docker-compose restart"
    echo "   View backend logs: docker-compose logs -f spicy-todo-api"
    echo "   View frontend logs: docker-compose logs -f spicy-todo-frontend"
    echo
    echo "🔧 Development mode:"
    echo "   docker-compose -f docker-compose.dev.yml up --build"
    echo
else
    echo "❌ Failed to start the application containers."
    echo "📋 Check logs with: docker-compose logs"
    exit 1
fi

