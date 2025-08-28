#!/bin/bash

echo "=== Senars3 Enhanced Validation Demo ==="
echo ""

# Start the web server in the background
echo "Starting Senars3 web server..."
npm run start:web > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "Server started with PID: $SERVER_PID"
echo ""

# Test valid input
echo "1. Testing valid input processing:"
echo "   Input: 'The weather is nice today'"
curl -s -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": "The weather is nice today"}' | jq '.message'
echo ""

# Test empty input (should fail)
echo "2. Testing empty input validation:"
echo "   Input: '' (empty string)"
curl -s -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"input": ""}' | jq '.error'
echo ""

# Test too long input (should fail)
echo "3. Testing long input validation:"
LONG_INPUT=$(printf 'A%.0s' {1..10001})
echo "   Input: String with 10001 characters"
curl -s -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d "{\"input\": \"$LONG_INPUT\"}" | jq '.error'
echo ""

# Stop the server
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo "Demo completed!"