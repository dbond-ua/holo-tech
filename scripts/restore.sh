#!/usr/bin/env bash
#
# Restores a HoloTech PostgreSQL database from a backup made by
# scripts/backup.sh (pg_dump custom format, -Fc).
#
# Usage:
#   ./scripts/restore.sh backups/holotech_20260915_120000.dump
#   DATABASE_URL=... ./scripts/restore.sh path/to/file.dump
#
# WARNING: this restores INTO the database named in DATABASE_URL and can
# overwrite existing data (existing objects are dropped and recreated via
# --clean --if-exists). Double-check DATABASE_URL points at the database you
# actually mean to restore before confirming — this is why the script always
# asks for interactive confirmation and never skips it, even with a --force
# flag, since a destructive restore should never be one accidental key-press
# in an automated pipeline.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "usage: $0 <path-to-backup.dump>" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_DIR/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$PROJECT_DIR/.env" | tail -n1 | cut -d '=' -f2-)"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL is not set (checked the environment and $PROJECT_DIR/.env)" >&2
  exit 1
fi

# Show only the host/db name portion, never the password, in the confirmation
# prompt — DATABASE_URL itself is never printed in full.
TARGET_DESC="$(echo "$DATABASE_URL" | sed -E 's#^(postgres(ql)?://)([^:]+):[^@]*@#\1\3:***@#')"

echo "About to restore $DUMP_FILE into:"
echo "  $TARGET_DESC"
echo "This will DROP and recreate existing objects that are also in the dump."
read -r -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

pg_restore -d "$DATABASE_URL" --clean --if-exists --no-owner --no-privileges -v "$DUMP_FILE"

echo "Restore complete."
