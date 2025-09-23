#!/bin/bash

# SpicyTodo Express API - Local Start Script

echo "🌶️ Starting SpicyTodo Express API locally..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs data

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set up environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Setting up environment configuration..."
    cp env.example .env
    echo "✅ Created .env file from env.example"
    echo "📝 You may want to edit .env with your specific configuration"
fi

# Start the API
echo "🚀 Starting Express API in development mode..."
echo "📊 API will be available at: http://localhost:8000"
echo "🔍 API Health Check: http://localhost:8000/api/health"
echo "📚 API Documentation: http://localhost:8000/api/docs"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev
