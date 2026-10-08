#!/bin/sh
set -e

# Railway pre-deploy command: run the Payload migrations, then seed the catalogue from datum/.
# The seed updates every topic, subtopic and indicator in datum/, so it overwrites CMS edits to them.
/bin/sh ./migrate.sh
echo "Seeding the catalogue..."
export COREPACK_HOME=$(mktemp -d)
exec pnpm db:seed "$@"
