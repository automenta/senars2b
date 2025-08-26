#!/bin/bash

echo "Running Senars3 Cognitive System Tests"
echo "====================================="

echo "Running unit tests..."
npm test

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo ""
    echo "Generating coverage report..."
    npm run test:coverage
else
    echo "❌ Some tests failed!"
    exit 1
fi