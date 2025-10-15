#!/bin/bash

# The Fixer Initiative - Start Monitoring Cockpit

echo "🚀 Starting The Fixer Initiative Monitoring Cockpit..."

# Check if setup has been run
if [ ! -d "modules/lan-onasis-workspace" ]; then
    echo "⚠️  Modules not found. Running setup first..."
    ./setup-aggregator.sh
fi

# Install dependencies if needed
if [ ! -d "control-room/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd control-room
    npm install
    cd ..
fi

# Sync all modules
echo "🔄 Syncing modules..."
./sync-modules.sh

# Start the monitoring cockpit
echo "🎛️ Starting monitoring cockpit..."
cd control-room
npm start &

# Get the PID
COCKPIT_PID=$!

echo ""
echo "✅ Monitoring Cockpit Started!"
echo ""
echo "🌐 Dashboard URL: http://localhost:3005"
echo "🔌 WebSocket: ws://localhost:8080"
echo "🎛️ Process ID: $COCKPIT_PID"
echo ""
echo "📊 Available endpoints:"
echo "   - GET /api/services    - List all services"
echo "   - GET /api/metrics     - Get current metrics"
echo "   - GET /api/health      - Health check"
echo "   - POST /api/restart-service - Restart a service"
echo ""
echo "⏹️  To stop: kill $COCKPIT_PID"
echo "📝 Logs: tail -f control-room/monitoring.log"
echo ""

# Save PID for easy stopping
echo $COCKPIT_PID > monitoring.pid

# Wait for user input to stop
echo "Press Ctrl+C to stop the monitoring cockpit..."
trap "kill $COCKPIT_PID; exit" INT
wait