#!/bin/sh
set -e

case "${1:-}" in
  "") ;;
  --preview) export SEED_PREVIEW=true ;;
  *)
    echo "Unknown flag \"$1\". Usage: predeploy.sh [--preview]" >&2
    exit 1
    ;;
esac

echo "Running migrations..."
node ./node_modules/payload/bin.js migrate

echo "Seeding the catalogue..."
exec node ./node_modules/payload/bin.js run src/cms/seed/seed-data.ts
