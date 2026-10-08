#!/bin/sh
set -e

# Runs the Payload migrations. Used by entrypoint.sh and as the Railway pre-deploy command.
echo "Running migrations..."
export COREPACK_HOME=$(mktemp -d)
exec pnpm db:migrate
