#!/bin/bash

echo "🌶️ Starting Spicy Todo API with Docker..."
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

# Function to check if container is running
check_container() {
    if docker ps | grep -q "spicy-todo-api"; then
        return 0
    else
        return 1
    fi
}

# Stop existing container if running
if check_container; then
    echo "🛑 Stopping existing container..."
    docker-compose down
fi

# Build and start the container
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting container..."
docker-compose up -d

# Wait for container to be ready
echo "⏳ Waiting for API to be ready..."
sleep 5

# Check if container is running
if check_container; then
    echo "✅ Spicy Todo API is running!"
    echo
    echo "📍 API URL: http://localhost:8000"
    echo "📚 API Documentation: http://localhost:8000/docs"
    echo "🔍 Health Check: http://localhost:8000/health"
    echo
    echo "📋 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop API: docker-compose down"
    echo "   Restart API: docker-compose restart"
    echo
else
    echo "❌ Failed to start the API container."
    echo "📋 Check logs with: docker-compose logs"
    exit 1
fi
