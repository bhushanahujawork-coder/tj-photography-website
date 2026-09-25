#!/bin/bash
set -e

# Hosted platforms provide a single DATABASE_URL (sometimes bare
# `postgres://`). Derive the individual psql connection params from it so the
# same entrypoint works locally and in production.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_HOST:-}" ]; then
  DB_CONN=$(python - "$DATABASE_URL" <<'PY'
import re, sys
url = sys.argv[1]
url = re.sub(r'^postgres(ql)?(\+asyncpg)?://', '', url)
creds, _, rest = url.rpartition('@')
user, _, password = creds.partition(':')
hostport, _, database = rest.partition('/')
host, _, port = hostport.partition(':')
print(user)
print(password)
print(host)
print(port or '5432')
print(database.split('?')[0])
PY
)
  DB_USER=$(echo "$DB_CONN" | sed -n 1p)
  DB_PASSWORD=$(echo "$DB_CONN" | sed -n 2p)
  DB_HOST=$(echo "$DB_CONN" | sed -n 3p)
  DB_PORT=$(echo "$DB_CONN" | sed -n 4p)
  DB_NAME=$(echo "$DB_CONN" | sed -n 5p)
fi

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-tjphotography}"
DB_NAME="${DB_NAME:-tj_photography}"
DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-changeme}}"

echo "Waiting for PostgreSQL to become available..."
for i in $(seq 1 30); do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
    echo "PostgreSQL is ready."
    break
  fi
  echo "Attempt $i/30: PostgreSQL not ready yet..."
  sleep 2
done

if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
  echo "ERROR: PostgreSQL did not become available in time."
  exit 1
fi

echo "Ensuring database '$DB_NAME' exists..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 \
  || PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c \
     "CREATE DATABASE \"$DB_NAME\""

echo "Running Alembic migrations..."
alembic upgrade head

if [ "${SEED_DATABASE:-true}" = "true" ]; then
  USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"user\"" 2>/dev/null | tr -d ' ')
  if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" -eq 0 ] 2>/dev/null; then
    echo "Seeding database..."
    PYTHONPATH=/app python /app/scripts/seed.py
  else
    echo "Database already seeded ($USER_COUNT users found), skipping."
  fi
fi

echo "Starting application..."
exec "$@"
