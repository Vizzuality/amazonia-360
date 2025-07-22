#!/bin/sh

# Exit on any error
set -e

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for dependencies (if needed)
wait_for_dependencies() {
    echo "Checking dependencies..."

    # Check if pnpm is available
    if ! command_exists pnpm; then
        echo "Error: pnpm is not available"
        exit 1
    fi

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Error: node_modules directory not found"
        exit 1
    fi

    echo "Dependencies check passed"
}

# Function to handle graceful shutdown
graceful_shutdown() {
    echo "Received shutdown signal, stopping webshot service..."
    if [ ! -z "$WEBSHOT_PID" ]; then
        kill -TERM "$WEBSHOT_PID" 2>/dev/null || true
        wait "$WEBSHOT_PID" 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers for graceful shutdown
trap graceful_shutdown TERM INT

echo "Starting Webshot Service..."
echo "Node environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3003}"

# Wait for dependencies to be ready
wait_for_dependencies

# Start the application based on environment
if [ "${NODE_ENV}" = "production" ]; then
    echo "Starting in production mode..."
    exec node dist/main.js
else
    echo "Starting in development mode with hot reload..."
    # Start the development server in the background
    pnpm run dev:docker &
    WEBSHOT_PID=$!

    # Wait for the background process
    wait "$WEBSHOT_PID"
fi
