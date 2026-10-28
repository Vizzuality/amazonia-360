#!/bin/sh
set -e

# Railway pre-deploy command: run the Payload migrations, then seed the catalogue from datum/.
# The seed only runs when datum/, the seed code or the migrations changed since the last seed, and then
# overwrites CMS edits to every topic, subtopic and indicator in datum/. `pnpm db:seed --force` reseeds anyway.
/bin/sh ./migrate.sh
echo "Seeding the catalogue..."
export COREPACK_HOME=$(mktemp -d)
exec pnpm db:seed "$@"
