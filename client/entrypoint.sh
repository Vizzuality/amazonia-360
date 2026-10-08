#!/bin/sh
set -e

# Run the given command instead of the app, e.g. a pre-deploy command
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

# Default to development if NODE_ENV not set
NODE_ENV=${NODE_ENV:-development}

echo "Starting application in ${NODE_ENV} mode..."

case "$NODE_ENV" in
  production)
    if [ "${RUN_MIGRATIONS_ON_START:-true}" = "true" ]; then
      /bin/sh ./migrate.sh
    fi
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
