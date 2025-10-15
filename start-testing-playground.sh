#!/bin/bash

# The Fixer Initiative - Start API Testing Playground

echo "🧪 Starting API Testing Playground..."

# Install dependencies if needed
if [ ! -d "testing-playground/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd testing-playground
    npm install
    cd ..
fi

# Start the testing playground
echo "🚀 Starting playground server..."
cd testing-playground
npm start &

# Get the PID
PLAYGROUND_PID=$!

echo ""
echo "✅ API Testing Playground Started!"
echo ""
echo "🧪 Playground URL: http://localhost:3006"
echo "🎯 Process ID: $PLAYGROUND_PID"
echo ""
echo "🌟 Features Available:"
echo "   • Quick URL testing"
echo "   • Comprehensive service analysis"
echo "   • Automated onboarding"
echo "   • Performance benchmarking"
echo "   • Health endpoint discovery"
echo ""
echo "📚 Example APIs ready to test:"
echo "   • GitHub API (https://api.github.com)"
echo "   • JSONPlaceholder (https://jsonplaceholder.typicode.com)"
echo "   • Memory Service (https://api.lanonasis.com)"
echo ""
echo "🔧 API Endpoints:"
echo "   • GET  /api/services - List onboarded services"
echo "   • POST /api/test-service - Run comprehensive test"
echo "   • POST /api/onboard-service - Onboard new service"
echo "   • GET  /api/quick-test/:url - Quick health check"
echo ""
echo "⏹️  To stop: kill $PLAYGROUND_PID"
echo ""

# Save PID for easy stopping
echo $PLAYGROUND_PID > testing-playground.pid

# Wait for user input to stop
echo "Press Ctrl+C to stop the testing playground..."
trap "kill $PLAYGROUND_PID; exit" INT
wait