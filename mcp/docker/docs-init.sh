#!/bin/sh
set -e
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres \
  -c "CREATE DATABASE amazonia360_docs_test"
for db in amazonia360_docs amazonia360_docs_test; do
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$db" -c "CREATE SCHEMA mcp"
done
