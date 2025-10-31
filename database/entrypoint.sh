#!/bin/bash
set -e

# This entrypoint script simply execs the base image's own entrypoint. It is
# provided to stick to the same conventions we use across container images and
# it could be used to do further checks/actions before starting the database
# service.

# Call the official entrypoint with original arguments
exec docker-entrypoint.sh "$@"
