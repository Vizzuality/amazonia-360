#!/bin/sh
set -e

# Default to development if NODE_ENV not set
NODE_ENV=${NODE_ENV:-development}

echo "Starting application in ${NODE_ENV} mode..."

case "$NODE_ENV" in
  production)
    echo "Running migrations..."
    # pnpm run payload migrate
    echo "Running in production mode..."
    exec env HOSTNAME=0.0.0.0 node server.js
    ;;
  development)
    echo "Running with hot reload and debugging enabled..."
    exec npx cross-env NODE_OPTIONS='--no-deprecation --inspect' next dev
    ;;
  test)
    echo "Running tests..."
    exec vitest run
    ;;
  *)
    echo "Invalid NODE_ENV value: $NODE_ENV. Expected: test, development, production"
    exit 1
    ;;
esac
