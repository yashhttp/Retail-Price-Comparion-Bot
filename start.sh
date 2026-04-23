#!/bin/bash
# QUICK START GUIDE - Run this to start the entire app

echo "============================================"
echo "Retail Price Comparison Bot - Quick Start"
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi
echo "✓ Node.js $(node -v) found"

# Check if we're in the right directory
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "❌ Run this from the project root directory"
    exit 1
fi

# Install dependencies if needed
echo ""
echo "📦 Setting up dependencies..."

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install > /dev/null 2>&1
    cd ..
    echo "✓ Server dependencies installed"
else
    echo "✓ Server dependencies already installed"
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install > /dev/null 2>&1
    cd ..
    echo "✓ Client dependencies installed"
else
    echo "✓ Client dependencies already installed"
fi

# Check environment
echo ""
echo "⚙️  Checking environment..."
if [ ! -f "server/.env" ]; then
    echo "❌ server/.env not found. Please create it first."
    echo "   Copy server/.env.example to server/.env and fill in values."
    exit 1
fi
echo "✓ Environment configured"

echo ""
echo "============================================"
echo "🚀 STARTING SERVERS"
echo "============================================"
echo ""
echo "📝 IMPORTANT:"
echo "   - Keep both terminal windows open"
echo "   - Server runs on http://localhost:5000"
echo "   - Client runs on http://localhost:5173"
echo "   - Open browser to http://localhost:5173"
echo ""

# Start servers
echo "Starting backend server..."
cd server
npm start &
SERVER_PID=$!

echo "Starting frontend server..."
cd ../client
npm run dev &
CLIENT_PID=$!

echo ""
echo "============================================"
echo "✅ SERVERS STARTED"
echo "============================================"
echo ""
echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo ""
echo "🌐 Open your browser: http://localhost:5173"
echo ""
echo "To stop servers, press Ctrl+C"
echo ""

wait
