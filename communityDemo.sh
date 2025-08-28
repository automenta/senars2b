#!/bin/bash

# Community Simulator Demo Script
# This script demonstrates the Community Simulator functionality

echo "========================================="
echo "  Senars3 Community Simulator Demo"
echo "========================================="
echo

echo "Starting the Community Simulator demo..."
echo

echo "1. Starting WebSocket server..."
npm run start:ws &
WEBSOCKET_PID=$!
echo "WebSocket server started with PID: $WEBSOCKET_PID"
echo

echo "2. Starting Web server..."
npm run start:web &
WEB_PID=$!
echo "Web server started with PID: $WEB_PID"
echo

echo "3. Building the project..."
npm run build
echo

echo "4. Running Community Simulator tests..."
npm run test:community
npm run test:community-integration
echo

echo "========================================="
echo "  Demo Setup Complete!"
echo "========================================="
echo
echo "You can now access the Community Simulator at:"
echo "http://localhost:3000"
echo
echo "To stop the demo, run:"
echo "kill $WEBSOCKET_PID $WEB_PID"
echo

echo "========================================="
echo "  Community Simulator Features:"
echo "========================================="
echo
echo "• Deploy first-class agent participants with their own cognitive contexts"
echo "• Select from educational problems across multiple domains"
echo "• Simulate collaborative problem-solving sessions"
echo "• Observe p2p collaboration between cognitive agents"
echo "• Test multi-agent reasoning capabilities"
echo