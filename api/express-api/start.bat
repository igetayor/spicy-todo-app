@echo off
REM SpicyTodo Express API - Local Start Script for Windows

echo 🌶️ Starting SpicyTodo Express API locally...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs mkdir logs
if not exist data mkdir data

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Set up environment file if it doesn't exist
if not exist .env (
    echo ⚙️ Setting up environment configuration...
    copy env.example .env
    echo ✅ Created .env file from env.example
    echo 📝 You may want to edit .env with your specific configuration
)

REM Start the API
echo 🚀 Starting Express API in development mode...
echo 📊 API will be available at: http://localhost:8000
echo 🔍 API Health Check: http://localhost:8000/api/health
echo 📚 API Documentation: http://localhost:8000/api/docs
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

npm run dev

