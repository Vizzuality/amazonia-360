#!/bin/bash
# Runs once, when the local database volume is first created. On an existing volume,
# run it by hand: docker compose exec database bash /docker-entrypoint-initdb.d/10-mcp.sh
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mcp') THEN
    CREATE ROLE mcp LOGIN PASSWORD '${MCP_DB_PASSWORD:-mcp}';
  END IF;
END
\$\$;
CREATE SCHEMA IF NOT EXISTS mcp AUTHORIZATION mcp;
ALTER ROLE mcp SET search_path = mcp;
SQL
