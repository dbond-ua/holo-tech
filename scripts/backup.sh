#!/usr/bin/env bash
#
# Dumps the HoloTech PostgreSQL database to a timestamped, compressed file.
# Safe to run by hand or from a cron job / systemd timer.
#
# Usage:
#   ./scripts/backup.sh                 # reads DATABASE_URL from .env
#   DATABASE_URL=... ./scripts/backup.sh
#   ./scripts/backup.sh /custom/backup/dir
#
# Output: <backup dir>/holotech_YYYYmmdd_HHMMSS.dump (pg_dump custom format —
# restore with scripts/restore.sh or `pg_restore` directly). Keeps the last
# 14 backups by default and deletes older ones (see KEEP_LAST below) so this
# can run unattended without slowly filling the disk.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${1:-$PROJECT_DIR/backups}"
KEEP_LAST="${KEEP_LAST:-14}"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$PROJECT_DIR/.env" ]; then
  # Only pulls DATABASE_URL out of .env — never echoes the file or any other
  # variable in it, so other secrets (Telegram token, Nova Poshta key, admin
  # session secret) never end up in this script's output or logs.
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$PROJECT_DIR/.env" | tail -n1 | cut -d '=' -f2-)"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "error: DATABASE_URL is not set (checked the environment and $PROJECT_DIR/.env)" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/holotech_${STAMP}.dump"

echo "Backing up HoloTech database to $OUT_FILE ..."
# Custom format (-Fc): compressed, and the only format pg_restore can do a
# selective/parallel restore from. Never prints the connection string itself
# to the terminal (pg_dump takes it as a single argument, not echoed here).
pg_dump "$DATABASE_URL" -Fc -f "$OUT_FILE"

echo "Backup written: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

if [ "$KEEP_LAST" -gt 0 ]; then
  # Delete anything past the newest KEEP_LAST dumps in this directory.
  ls -1t "$BACKUP_DIR"/holotech_*.dump 2>/dev/null | tail -n +$((KEEP_LAST + 1)) | while read -r old; do
    echo "Pruning old backup: $old"
    rm -f -- "$old"
  done
fi
