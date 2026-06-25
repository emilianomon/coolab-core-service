#!/usr/bin/env bash
set -euo pipefail

DATABASE_NAME="${DATABASE_NAME:-coolab_core_service}"
DATABASE_URL="${POSTGRES_ADMIN_URL:-postgres://postgres:postgres@localhost:5432/postgres}"

psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $DATABASE_NAME"
