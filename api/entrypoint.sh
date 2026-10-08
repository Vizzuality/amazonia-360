#!/bin/sh
set -e

# Copy the grid data from the bucket to the data directory. Does nothing when GRID_BUCKET_NAME is not set.
python scripts/sync_grid_data.py

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --root-path /api/
