#!/bin/bash
set -euo pipefail

if [[ ! -f .run-seed ]]; then
  echo "[run_seed] .run-seed not present — datum unchanged, skipping CMS seed."
  exit 0
fi

echo "[run_seed] .run-seed present — running CMS seed via the client container..."

docker compose exec -T client pnpm db:seed

echo "[run_seed] CMS seed finished."
