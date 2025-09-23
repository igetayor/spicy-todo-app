#!/bin/bash

# SpicyTodo Express API - Docker Start Script

echo "🌶️ Starting SpicyTodo Express API with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs data

# Start the API
echo "🚀 Starting Express API..."
docker-compose up --build -d

# Wait for the API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 10

# Check if the API is running
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ SpicyTodo Express API is running successfully!"
    echo "📊 API Health: http://localhost:8000/api/health"
    echo "📚 API Documentation: http://localhost:8000/api/docs"
    echo "🎯 API Base URL: http://localhost:8000/api"
    echo ""
    echo "📋 Available endpoints:"
    echo "  GET  /api/health                    - Health check"
    echo "  GET  /api/docs                      - API documentation"
    echo "  GET  /api/todos                     - Get all todos"
    echo "  POST /api/todos                     - Create todo"
    echo "  GET  /api/todos/:id                 - Get todo by ID"
    echo "  PUT  /api/todos/:id                 - Update todo"
    echo "  PATCH /api/todos/:id/toggle         - Toggle todo"
    echo "  DELETE /api/todos/:id               - Delete todo"
    echo "  DELETE /api/todos/completed         - Clear completed todos"
    echo "  GET  /api/todos/stats/summary       - Get statistics"
    echo "  GET  /api/todos/reminders           - Get upcoming reminders"
    echo ""
    echo "🛑 To stop the API: docker-compose down"
    echo "📝 To view logs: docker-compose logs -f"
else
    echo "❌ Failed to start SpicyTodo Express API"
    echo "📝 Check logs with: docker-compose logs"
    exit 1
fi
