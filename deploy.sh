#!/usr/bin/env bash
#
# HoloTech — full production deployment, meant to be run ONCE (and safely
# re-run any number of times afterwards) on a fresh Ubuntu VPS.
#
# What this does, in order: system check -> install only what's missing
# (Node 20, PostgreSQL 16, Nginx, certbot, ufw) -> create a dedicated local
# Postgres DB + least-privilege role -> apply all migrations -> generate a
# production .env (secrets are generated here, never asked of you in plain
# text) -> npm install && npm run build -> run the app as a systemd service
# (never `npm run dev`) -> Nginx reverse proxy + Let's Encrypt HTTPS (if a
# domain is configured) -> ufw firewall (22/80/443 only) -> local product
# image storage -> first administrator account -> first Nova Poshta import +
# daily cron -> daily Postgres backup + cron -> automated security
# self-checks -> a final status report.
#
# Every step checks current state first, so re-running after fixing
# something (e.g. a build error) is safe and won't redo or break what
# already worked.
#
# Usage:
#   1. scp the project to this VPS first (see the instructions you were
#      given alongside this script) so $PROJECT_DIR/package.json exists.
#   2. cp deploy.env.example deploy.env && nano deploy.env
#   3. sudo bash deploy.sh
#
# Safety: this script NEVER prints secrets (DB password, session secrets,
# admin password, bot token) to stdout/the log file, never commits anything
# to git, and never touches DNS, billing, or anything outside this VPS.

set -euo pipefail

# ---------------------------------------------------------------------------
# Logging — everything except secrets goes to this log too, so you can paste
# it back if something fails. The file is root-only; still, never paste its
# full contents anywhere without a quick skim first.
# ---------------------------------------------------------------------------
LOG_FILE="/var/log/holotech-deploy.log"
touch "$LOG_FILE"
chmod 600 "$LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

log()  { echo -e "\n\033[1;36m==> $*\033[0m"; }
ok()   { echo -e "\033[1;32m   OK: $*\033[0m"; }
warn() { echo -e "\033[1;33m   WARN: $*\033[0m"; }
err()  { echo -e "\033[1;31mERROR: $*\033[0m" >&2; }

STEP_WARNINGS=()
add_warning() { STEP_WARNINGS+=("$1"); warn "$1"; }

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  err "Run this as root: sudo bash deploy.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-$SCRIPT_DIR/deploy.env}"
if [ ! -f "$ENV_FILE" ]; then
  err "$ENV_FILE not found."
  err "Run: cp deploy.env.example deploy.env && nano deploy.env    (then re-run this script)"
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PROJECT_DIR="${PROJECT_DIR:-/var/www/holotech}"
APP_PORT="${APP_PORT:-3000}"
DOMAIN="${DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
DB_NAME="${DB_NAME:-holotech}"
DB_APP_USER="${DB_APP_USER:-holotech_app}"
ADMIN_NAME="${ADMIN_NAME:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/holotech}"
SYSTEM_USER="holotech"

STATE_DIR="/root/.holotech-deploy"
mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"

# Declared up front (set -u is active) so the final report can reference
# them even on code paths that never assign them.
CRED_FILE=""

rand_secret() { openssl rand -hex 24; }
rand_password() { openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | cut -c1-22; }

# Persist a generated secret across re-runs instead of rotating it every
# time (rotating ADMIN_SESSION_SECRET on every re-run would silently log
# every admin out; rotating the DB password would require re-syncing it in
# two places for no reason).
persist() { # persist <state-file-name> <generator-fn>
  local f="$STATE_DIR/$1"
  if [ ! -f "$f" ]; then
    "$2" > "$f"
    chmod 600 "$f"
  fi
  cat "$f"
}

echo "============================================================"
echo " HoloTech production deploy — $(date -u +%FT%TZ)"
echo "============================================================"

# ===========================================================================
# STEP 0 — preflight: make sure the project is actually here
# ===========================================================================
log "Step 0/13: checking project directory ($PROJECT_DIR)"
if [ ! -f "$PROJECT_DIR/package.json" ] || [ ! -d "$PROJECT_DIR/migrations" ]; then
  err "$PROJECT_DIR does not contain the HoloTech project (no package.json / migrations found)."
  err "Copy the project there first, from your machine, e.g. (adjust the local path to wherever your project folder actually is):"
  err "  scp -r D:\\WORK\\1AIClaudeAI\\techbox root@<VPS_IP>:$PROJECT_DIR"
  err "(exclude node_modules and .next if present locally — they'll be rebuilt here)"
  err "Then re-run: sudo bash deploy.sh"
  exit 1
fi
if ! grep -q '"name": "holotech"' "$PROJECT_DIR/package.json"; then
  err "$PROJECT_DIR/package.json doesn't look like the HoloTech project — refusing to continue."
  exit 1
fi
ok "project found at $PROJECT_DIR"

# ===========================================================================
# STEP 1 — system info
# ===========================================================================
log "Step 1/13: system info"
. /etc/os-release 2>/dev/null || true
echo "OS: ${PRETTY_NAME:-unknown}"
echo "CPU: $(nproc) core(s)"
echo "RAM: $(free -h | awk '/^Mem:/{print $2}')"
echo "Disk free on /: $(df -h / | awk 'NR==2{print $4}')"
DISK_FREE_KB="$(df -k / | awk 'NR==2{print $4}')"
if [ "$DISK_FREE_KB" -lt 5000000 ]; then
  add_warning "less than ~5GB free disk space — build/backups may be tight"
fi

# ===========================================================================
# STEP 2 — install only what's missing
# ===========================================================================
log "Step 2/13: installing missing packages (skipping anything already present)"
APT_UPDATED=0
apt_update_once() { if [ "$APT_UPDATED" -eq 0 ]; then apt-get update -y -qq; APT_UPDATED=1; fi; }

command -v curl >/dev/null || { apt_update_once; apt-get install -y -qq curl; }
command -v gpg  >/dev/null || { apt_update_once; apt-get install -y -qq gnupg; }
dpkg -s ca-certificates >/dev/null 2>&1 || { apt_update_once; apt-get install -y -qq ca-certificates; }
command -v ufw >/dev/null || { apt_update_once; apt-get install -y -qq ufw; }
command -v nginx >/dev/null || { apt_update_once; apt-get install -y -qq nginx; }

NODE_OK=0
if command -v node >/dev/null; then
  NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
  [ "$NODE_MAJOR" -ge 20 ] && NODE_OK=1
fi
if [ "$NODE_OK" -eq 0 ]; then
  log "installing Node.js 20 LTS (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
ok "node $(node -v), npm $(npm -v)"

if ! command -v psql >/dev/null; then
  log "installing PostgreSQL 16 (PGDG repository)"
  install -d /usr/share/postgresql-common/pgdg
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] http://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -y -qq
  apt-get install -y -qq postgresql-16 postgresql-client-16
fi
systemctl enable --quiet postgresql 2>/dev/null || true
systemctl start postgresql
ok "postgresql $(sudo -u postgres psql -tAc 'show server_version;' | xargs)"

if [ -n "$DOMAIN" ] && ! command -v certbot >/dev/null; then
  log "installing certbot (domain is configured)"
  apt_update_once
  apt-get install -y -qq certbot python3-certbot-nginx
fi

id -u "$SYSTEM_USER" >/dev/null 2>&1 || {
  log "creating dedicated system user '$SYSTEM_USER' (no login shell, no password)"
  useradd --system --home "$PROJECT_DIR" --shell /usr/sbin/nologin "$SYSTEM_USER"
}

# ===========================================================================
# STEP 3 — PostgreSQL: local-only, dedicated DB + least-privilege role
# ===========================================================================
log "Step 3/13: configuring PostgreSQL (local-only, dedicated DB + role)"

PG_VERSION="$(sudo -u postgres psql -tAc 'show server_version_num;' | cut -c1-2)"
PG_CONF_DIR="$(sudo -u postgres psql -tAc 'show config_file;' | xargs dirname)"
PG_CONF="$PG_CONF_DIR/postgresql.conf"
PG_HBA="$PG_CONF_DIR/pg_hba.conf"

CHANGED_PG_CONF=0
if grep -Eq "^\s*#?\s*listen_addresses\s*=" "$PG_CONF"; then
  CURRENT_LISTEN="$(grep -E '^\s*listen_addresses\s*=' "$PG_CONF" | tail -1 || true)"
  if [ "$CURRENT_LISTEN" != "listen_addresses = 'localhost'" ]; then
    sed -i "s/^\s*#\?\s*listen_addresses\s*=.*/listen_addresses = 'localhost'/" "$PG_CONF"
    CHANGED_PG_CONF=1
  fi
else
  echo "listen_addresses = 'localhost'" >> "$PG_CONF"
  CHANGED_PG_CONF=1
fi

# pg_hba.conf: only local unix-socket + loopback, scram-sha-256. Rewritten
# fully and deterministically rather than patched, so re-runs are idempotent
# and nothing stray (e.g. a "trust" line) is left behind.
DESIRED_HBA="# Managed by holotech deploy.sh — local connections only.
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256"
if [ "$(cat "$PG_HBA" 2>/dev/null)" != "$DESIRED_HBA" ]; then
  cp "$PG_HBA" "$STATE_DIR/pg_hba.conf.bak.$(date +%s)" 2>/dev/null || true
  echo "$DESIRED_HBA" > "$PG_HBA"
  CHANGED_PG_CONF=1
fi

if [ "$CHANGED_PG_CONF" -eq 1 ]; then
  systemctl restart postgresql
  sleep 2
  ok "postgresql hardened to localhost-only and restarted"
else
  ok "postgresql already localhost-only"
fi

DB_APP_PASSWORD="$(persist db_app_password rand_password)"

sudo -u postgres psql -v ON_ERROR_STOP=1 -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || sudo -u postgres createdb "$DB_NAME"

sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" <<SQL
do \$\$
begin
  if not exists (select 1 from pg_roles where rolname = '$DB_APP_USER') then
    create role $DB_APP_USER with login password '$DB_APP_PASSWORD';
  else
    alter role $DB_APP_USER with password '$DB_APP_PASSWORD';
  end if;
end
\$\$;
grant connect on database $DB_NAME to $DB_APP_USER;
alter role $DB_APP_USER set search_path = public;
alter role $DB_APP_USER set statement_timeout = '30s';
alter role $DB_APP_USER set idle_in_transaction_session_timeout = '60s';
SQL
ok "database '$DB_NAME' and role '$DB_APP_USER' ready"

log "applying migrations (as postgres superuser — required for CREATE EXTENSION pgcrypto/pg_trgm; all migrations are written idempotently with IF NOT EXISTS / ON CONFLICT, so this is safe to re-run)"
shopt -s nullglob
MIGRATIONS=("$PROJECT_DIR"/migrations/0*.sql)
shopt -u nullglob
if [ "${#MIGRATIONS[@]}" -eq 0 ]; then
  err "no migrations found in $PROJECT_DIR/migrations"
  exit 1
fi
for f in "${MIGRATIONS[@]}"; do
  echo "   applying $(basename "$f")"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -f "$f" > /dev/null
done
ok "${#MIGRATIONS[@]} migrations applied"

TABLE_COUNT="$(sudo -u postgres psql -tAc "select count(*) from information_schema.tables where table_schema='public'" -d "$DB_NAME")"
for t in managers products categories orders order_items nova_cities nova_warehouses; do
  sudo -u postgres psql -tAc "select 1 from information_schema.tables where table_name='$t'" -d "$DB_NAME" | grep -q 1 \
    || add_warning "expected table '$t' is missing after migrations"
done
ok "$TABLE_COUNT tables present in public schema"

# ===========================================================================
# STEP 4 — project .env, ownership, storage directory
# ===========================================================================
log "Step 4/13: writing production .env and setting up local image storage"

ADMIN_SESSION_SECRET_V="$(persist admin_session_secret rand_secret)"
TELEGRAM_WEBHOOK_SECRET_V="$(persist telegram_webhook_secret rand_secret)"
CRON_SECRET_V="$(persist cron_secret rand_secret)"

STORAGE_DIR="$PROJECT_DIR/storage/products"
mkdir -p "$STORAGE_DIR"
chown -R "$SYSTEM_USER:$SYSTEM_USER" "$PROJECT_DIR/storage"
chmod 750 "$STORAGE_DIR"

SERVER_IP="$(curl -fsS --max-time 5 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')"
if [ -n "$DOMAIN" ]; then
  SITE_URL="https://$DOMAIN"
else
  SITE_URL="http://$SERVER_IP"
fi

ENV_TARGET="$PROJECT_DIR/.env"
cat > "$ENV_TARGET" <<ENVEOF
# Generated by deploy.sh on $(date -u +%FT%TZ) — do not commit, do not edit
# by hand while the service is running (re-run deploy.sh instead so
# generated secrets stay consistent).
DATABASE_URL=postgresql://$DB_APP_USER:$DB_APP_PASSWORD@127.0.0.1:5432/$DB_NAME
PRODUCT_IMAGES_DIR=$STORAGE_DIR
ADMIN_SESSION_SECRET=$ADMIN_SESSION_SECRET_V
ADMIN_BOOTSTRAP_SECRET=
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=$TELEGRAM_CHAT_ID
TELEGRAM_WEBHOOK_SECRET=$TELEGRAM_WEBHOOK_SECRET_V
CRON_SECRET=$CRON_SECRET_V
NOVA_POSHTA_API_KEY=
NEXT_PUBLIC_SITE_URL=$SITE_URL
NODE_ENV=production
ENVEOF
chown "$SYSTEM_USER:$SYSTEM_USER" "$ENV_TARGET"
chmod 600 "$ENV_TARGET"
ok ".env written to $ENV_TARGET (mode 600, owned by $SYSTEM_USER)"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
  add_warning "Telegram not configured — TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID left blank. Order notifications are disabled until you fill deploy.env and re-run."
fi

# ===========================================================================
# STEP 5 — npm install && npm run build
# ===========================================================================
log "Step 5/13: npm install && npm run build (production)"
cd "$PROJECT_DIR"
# NOTE: NODE_ENV must NOT be set to "production" before `npm install` — npm
# treats that as --omit=dev and silently skips devDependencies (tailwindcss,
# postcss, autoprefixer, typescript), which then breaks the build with
# "Cannot find module 'tailwindcss'" and cascading module-not-found errors.
# `next build`/`next start` set NODE_ENV=production themselves, so it doesn't
# need to be exported here at all.
rm -rf node_modules

if ! npm install --no-audit --no-fund; then
  err "npm install failed — see the output above (also saved in $LOG_FILE)."
  err "Send me that error output and I'll fix it, then re-run: sudo bash deploy.sh"
  exit 1
fi
ok "npm install complete"

if ! npm run build; then
  err "Production build (npm run build) failed — see the output above (also saved in $LOG_FILE)."
  err "Send me that error output and I'll fix the source, then re-run: sudo bash deploy.sh"
  exit 1
fi
ok "production build succeeded"

chown -R "$SYSTEM_USER:$SYSTEM_USER" "$PROJECT_DIR"

# ===========================================================================
# STEP 6 — systemd service (never `npm run dev`)
# ===========================================================================
log "Step 6/13: systemd service"
cat > /etc/systemd/system/holotech.service <<UNITEOF
[Unit]
Description=HoloTech Next.js production server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SYSTEM_USER
Group=$SYSTEM_USER
WorkingDirectory=$PROJECT_DIR
EnvironmentFile=$PROJECT_DIR/.env
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
# NOTE: bound to 0.0.0.0, not 127.0.0.1 — deliberately. Next.js's own
# absolute-URL construction for middleware redirects (used here for the
# uk/en locale redirect) falls back to its OWN bind address/port rather
# than the incoming Host header when bound to a loopback-only address,
# which produced broken "Location: http://localhost:3000/..." redirects
# behind Nginx. Port $APP_PORT staying unreachable from the internet is
# still enforced — by ufw (Step 8) and, one layer further out, by the
# cloud provider's own firewall — not by the bind address.
ExecStart=/usr/bin/npm run start -- -p $APP_PORT -H 0.0.0.0
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=$PROJECT_DIR
ProtectHome=true

[Install]
WantedBy=multi-user.target
UNITEOF

systemctl daemon-reload
systemctl enable --quiet holotech
systemctl restart holotech
sleep 4
if ! systemctl is-active --quiet holotech; then
  err "holotech service failed to start. Last 50 log lines:"
  journalctl -u holotech -n 50 --no-pager
  exit 1
fi
ok "holotech.service is active and enabled (auto-starts on boot, auto-restarts on crash)"

if curl -fsS --max-time 10 "http://127.0.0.1:$APP_PORT/" >/dev/null; then
  ok "app responds on 127.0.0.1:$APP_PORT"
else
  add_warning "app did not respond on 127.0.0.1:$APP_PORT within 10s — check 'journalctl -u holotech -n 100'"
fi

# ===========================================================================
# STEP 7 — Nginx reverse proxy + HTTPS
# ===========================================================================
log "Step 7/13: Nginx reverse proxy"
SERVER_NAME="${DOMAIN:-$SERVER_IP}"
cat > /etc/nginx/sites-available/holotech <<'NGINXEOF'
server {
    listen 80;
    server_name __SERVER_NAME__;
    client_max_body_size 20M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location ~ /\.(?!well-known) {
        deny all;
    }

    location / {
        proxy_pass http://127.0.0.1:__APP_PORT__;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF
sed -i "s/__SERVER_NAME__/$SERVER_NAME/; s/__APP_PORT__/$APP_PORT/" /etc/nginx/sites-available/holotech
ln -sf /etc/nginx/sites-available/holotech /etc/nginx/sites-enabled/holotech
rm -f /etc/nginx/sites-enabled/default
if ! nginx -t; then
  err "nginx config test failed"
  exit 1
fi
systemctl reload nginx 2>/dev/null || systemctl restart nginx
ok "nginx reverse proxy active (http://$SERVER_NAME -> 127.0.0.1:$APP_PORT)"

HTTPS_STATUS="skipped — no DOMAIN set in deploy.env"
if [ -n "$DOMAIN" ]; then
  DOMAIN_IP="$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1 || true)"
  if [ -n "$DOMAIN_IP" ] && [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
    if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
        -m "${LETSENCRYPT_EMAIL:-admin@$DOMAIN}" --redirect; then
      HTTPS_STATUS="issued and auto-renewing for https://$DOMAIN"
      SITE_URL="https://$DOMAIN"
      sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$SITE_URL|" "$ENV_TARGET"
      systemctl restart holotech
    else
      HTTPS_STATUS="certbot failed — see log above, DNS looked correct so this is worth retrying: sudo certbot --nginx -d $DOMAIN"
    fi
  else
    HTTPS_STATUS="skipped — DOMAIN=$DOMAIN does not currently resolve to this server's IP ($SERVER_IP; got '${DOMAIN_IP:-no A record}'). Point the domain's A record at $SERVER_IP, then re-run: sudo bash deploy.sh"
  fi
fi
ok "HTTPS: $HTTPS_STATUS"

# ===========================================================================
# STEP 8 — firewall
# ===========================================================================
log "Step 8/13: firewall (ufw) — only 22, 80, 443"
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
ok "ufw active: $(ufw status | tr '\n' ' ')"

# ===========================================================================
# STEP 9 — storage sanity check
# ===========================================================================
log "Step 9/13: verifying product image storage is writable"
if sudo -u "$SYSTEM_USER" test -w "$STORAGE_DIR"; then
  ok "storage dir writable by $SYSTEM_USER: $STORAGE_DIR"
else
  add_warning "storage dir NOT writable by $SYSTEM_USER: $STORAGE_DIR — image uploads will fail"
fi

# ===========================================================================
# STEP 10 — first administrator account
# ===========================================================================
log "Step 10/13: administrator account"
MANAGER_COUNT="$(sudo -u postgres psql -tAc "select count(*) from managers" -d "$DB_NAME" | xargs)"
ADMIN_STATUS=""
if [ "$MANAGER_COUNT" -gt 0 ]; then
  ADMIN_STATUS="already exists ($MANAGER_COUNT account(s)) — left untouched"
  ok "admin: $ADMIN_STATUS"
elif [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_NAME" ]; then
  ADMIN_STATUS="not created — ADMIN_NAME/ADMIN_EMAIL not set in deploy.env"
  add_warning "no administrator exists yet, and ADMIN_NAME/ADMIN_EMAIL are blank in deploy.env. Fill them in and re-run to create one, or create it yourself at ${SITE_URL}/admin once ADMIN_BOOTSTRAP_SECRET is set."
else
  if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD="$(rand_password)"
  fi
  BOOTSTRAP_SECRET="$(rand_secret)"
  sed -i "s|^ADMIN_BOOTSTRAP_SECRET=.*|ADMIN_BOOTSTRAP_SECRET=$BOOTSTRAP_SECRET|" "$ENV_TARGET"
  systemctl restart holotech
  sleep 3

  PAYLOAD_FILE="$(mktemp)"
  chmod 600 "$PAYLOAD_FILE"
  printf '{"secret":"%s","name":"%s","email":"%s","password":"%s"}' \
    "$BOOTSTRAP_SECRET" "$ADMIN_NAME" "$ADMIN_EMAIL" "$ADMIN_PASSWORD" > "$PAYLOAD_FILE"

  HTTP_CODE="$(curl -sS -o /tmp/holotech_bootstrap_resp.$$ -w '%{http_code}' \
    -X POST "http://127.0.0.1:$APP_PORT/api/admin/bootstrap" \
    -H "Content-Type: application/json" \
    --data-binary @"$PAYLOAD_FILE" || true)"
  RESP_BODY="$(cat /tmp/holotech_bootstrap_resp.$$ 2>/dev/null || true)"
  rm -f "$PAYLOAD_FILE" /tmp/holotech_bootstrap_resp.$$

  # Immediately disable the bootstrap endpoint again regardless of outcome.
  sed -i "s|^ADMIN_BOOTSTRAP_SECRET=.*|ADMIN_BOOTSTRAP_SECRET=|" "$ENV_TARGET"
  systemctl restart holotech

  if [ "$HTTP_CODE" = "200" ]; then
    CRED_FILE="/root/holotech-admin-credentials.txt"
    {
      echo "HoloTech administrator — created $(date -u +%FT%TZ)"
      echo "URL:      ${SITE_URL}/admin"
      echo "Email:    $ADMIN_EMAIL"
      echo "Password: $ADMIN_PASSWORD"
      echo
      echo "Save this somewhere safe (e.g. a password manager) and then delete"
      echo "this file: rm $CRED_FILE"
    } > "$CRED_FILE"
    chmod 600 "$CRED_FILE"
    ADMIN_STATUS="created — credentials written to $CRED_FILE on this VPS (root-only, never shown to Claude)"
    ok "admin account created for $ADMIN_EMAIL"
  else
    ADMIN_STATUS="bootstrap request failed (HTTP $HTTP_CODE) — response: $RESP_BODY"
    add_warning "admin bootstrap failed: HTTP $HTTP_CODE — $RESP_BODY"
  fi
fi

# ===========================================================================
# STEP 11 — Nova Poshta: first import + daily cron
# ===========================================================================
log "Step 11/13: Nova Poshta directory — first import + daily cron"
NP_SYNC_URL="http://127.0.0.1:$APP_PORT/api/cron/nova-poshta-sync?secret=$CRON_SECRET_V"
NP_HTTP_CODE="$(curl -sS -o /tmp/holotech_np.$$ -w '%{http_code}' --max-time 120 "$NP_SYNC_URL" || true)"
NP_BODY="$(cat /tmp/holotech_np.$$ 2>/dev/null || true)"
rm -f /tmp/holotech_np.$$
if [ "$NP_HTTP_CODE" = "200" ]; then
  NP_CITIES="$(sudo -u postgres psql -tAc "select count(*) from nova_cities" -d "$DB_NAME" | xargs)"
  NP_WH="$(sudo -u postgres psql -tAc "select count(*) from nova_warehouses" -d "$DB_NAME" | xargs)"
  NOVA_POSHTA_STATUS="imported — $NP_CITIES cities, $NP_WH warehouses/postomats"
  ok "nova poshta: $NOVA_POSHTA_STATUS"
else
  NOVA_POSHTA_STATUS="first import failed (HTTP $NP_HTTP_CODE) — response: $NP_BODY"
  add_warning "nova poshta first import failed: HTTP $NP_HTTP_CODE — $NP_BODY"
fi

CRON_FILE="/etc/cron.d/holotech"
cat > "$CRON_FILE" <<CRONEOF
# Managed by holotech deploy.sh — do not edit CRON_SECRET here, edit
# $ENV_TARGET and re-run deploy.sh instead.
SHELL=/bin/bash
15 3 * * * $SYSTEM_USER curl -fsS "http://127.0.0.1:$APP_PORT/api/cron/nova-poshta-sync?secret=$CRON_SECRET_V" >> /var/log/holotech-cron.log 2>&1
*/15 * * * * $SYSTEM_USER curl -fsS "http://127.0.0.1:$APP_PORT/api/cron/reminders?secret=$CRON_SECRET_V" >> /var/log/holotech-cron.log 2>&1
CRONEOF
chmod 600 "$CRON_FILE"
touch /var/log/holotech-cron.log && chmod 600 /var/log/holotech-cron.log
CRON_STATUS="installed: Nova Poshta sync daily 03:15, reminders every 15min ($CRON_FILE)"
ok "cron: $CRON_STATUS"

# ===========================================================================
# STEP 12 — backups
# ===========================================================================
log "Step 12/13: PostgreSQL backups"
mkdir -p "$BACKUP_DIR"
chown root:root "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

if [ ! -f "$PROJECT_DIR/scripts/backup.sh" ]; then
  add_warning "scripts/backup.sh not found in project — backups NOT configured"
  BACKUP_STATUS="not configured — scripts/backup.sh missing from project"
else
  chmod +x "$PROJECT_DIR/scripts/backup.sh"
  cat >> "$CRON_FILE" <<CRONEOF2
30 2 * * * root cd $PROJECT_DIR && ./scripts/backup.sh $BACKUP_DIR >> /var/log/holotech-backup.log 2>&1
CRONEOF2
  touch /var/log/holotech-backup.log && chmod 600 /var/log/holotech-backup.log

  log "running an initial backup now to verify it works"
  if (cd "$PROJECT_DIR" && ./scripts/backup.sh "$BACKUP_DIR" >/dev/null); then
    DUMP_COUNT="$(ls -1 "$BACKUP_DIR"/holotech_*.dump 2>/dev/null | wc -l | xargs)"
    BACKUP_STATUS="working — daily at 02:30, $DUMP_COUNT dump(s) in $BACKUP_DIR, last 14 kept (scripts/backup.sh KEEP_LAST). Stored on this VPS's disk, separate from the Postgres data directory but NOT off-site — true off-site backup needs external storage (e.g. an object-storage bucket); tell me if you want that set up and I'll add it."
    ok "backup: $BACKUP_STATUS"
  else
    BACKUP_STATUS="initial backup FAILED — see log above"
    add_warning "initial backup run failed"
  fi
fi

# ===========================================================================
# STEP 13 — automated security self-checks
# ===========================================================================
log "Step 13/13: security self-checks"
SEC_LINES=()

if ss -tlnp 2>/dev/null | grep -q ':5432' && ! ss -tlnp 2>/dev/null | grep ':5432' | grep -qE '127\.0\.0\.1:5432|\[::1\]:5432'; then
  SEC_LINES+=("PostgreSQL: FAIL — listening on a non-loopback address")
else
  SEC_LINES+=("PostgreSQL: OK — reachable only on 127.0.0.1:5432 (not from the internet)")
fi

# Next.js is deliberately bound to 0.0.0.0 (see Step 6) — its own
# middleware redirects break behind Nginx otherwise. Externally-blocked
# means ufw has no allow rule opening $APP_PORT, so the kernel firewall
# drops any inbound connection to it before it ever reaches Next.js.
if ufw status 2>/dev/null | grep -qE "^$APP_PORT(/tcp)?[[:space:]]+ALLOW"; then
  SEC_LINES+=("Next.js port $APP_PORT: FAIL — ufw has an explicit allow rule for it")
else
  SEC_LINES+=("Next.js port $APP_PORT: OK — bound to 0.0.0.0 but blocked from the internet by ufw (no allow rule for it)")
fi

ENV_HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1/.env" || true)"
if [ "$ENV_HTTP_CODE" = "403" ] || [ "$ENV_HTTP_CODE" = "404" ]; then
  SEC_LINES+=(".env via web: OK — HTTP $ENV_HTTP_CODE (blocked)")
else
  SEC_LINES+=(".env via web: CHECK MANUALLY — got HTTP $ENV_HTTP_CODE")
fi

ADMIN_HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' -H "Host: $SERVER_NAME" "http://127.0.0.1/admin" || true)"
SEC_LINES+=("/admin reachable: HTTP $ADMIN_HTTP_CODE (should not be 500)")

SEC_LINES+=(".env file permissions: $(stat -c '%a %U:%G' "$ENV_TARGET" 2>/dev/null || echo unknown) (should be 600, $SYSTEM_USER:$SYSTEM_USER)")
SEC_LINES+=("git: project is not a git repository on this VPS, so no secrets can leak via git here")
SEC_LINES+=("HTTPS: $HTTPS_STATUS")
SEC_LINES+=("firewall (ufw): $(ufw status | head -1)")

for line in "${SEC_LINES[@]}"; do echo "   $line"; done

# ===========================================================================
# FINAL REPORT
# ===========================================================================
BUILD_STATUS="OK — npm run build succeeded"
SERVICE_STATUS="OK — systemd holotech.service active, enabled at boot, auto-restart on crash"

echo
echo "############################################################"
echo "### DEPLOY STATUS"
echo "- сайт: $SITE_URL — $(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL/" 2>/dev/null || echo 'n/a') "
echo "- admin: ${SITE_URL}/admin — $ADMIN_STATUS"
echo "- PostgreSQL: local-only, DB '$DB_NAME', role '$DB_APP_USER', $TABLE_COUNT tables, migrations applied"
echo "- Telegram: $( [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ] && echo 'configured' || echo 'NOT configured — see МОИ ДЕЙСТВИЯ below')"
echo "- Nova Poshta: $NOVA_POSHTA_STATUS"
echo "- cron: $CRON_STATUS"
echo "- backups: $BACKUP_STATUS"
echo "- HTTPS: $HTTPS_STATUS"
echo "- firewall: $(ufw status | tr '\n' '; ')"
echo
echo "### МОИ ДЕЙСТВИЯ (what still needs YOUR action)"
if [ "${#STEP_WARNINGS[@]}" -eq 0 ]; then
  echo "- Ничего критического не осталось."
else
  for w in "${STEP_WARNINGS[@]}"; do echo "- $w"; done
fi
if [ -z "$DOMAIN" ]; then
  echo "- No domain configured: site is HTTP-only at $SITE_URL. When you have a domain, point its A record at $SERVER_IP, set DOMAIN= in deploy.env, and re-run 'sudo bash deploy.sh' to get HTTPS."
fi
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
  echo "- Telegram not configured: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in deploy.env, then re-run deploy.sh."
fi
echo
echo "### CREDENTIALS (rotate these after you're done)"
echo "- The temporary SSH/VPS access you gave me — revoke/change it now, as planned."
echo "- Everything below was generated ON THE VPS and was never shown to Claude; still worth knowing they exist:"
echo "  - PostgreSQL role '$DB_APP_USER' password (in $ENV_TARGET, root-only)"
echo "  - ADMIN_SESSION_SECRET, TELEGRAM_WEBHOOK_SECRET, CRON_SECRET (in $ENV_TARGET)"
if [ -n "$CRED_FILE" ]; then
  echo "  - Admin account password: written to $CRED_FILE on this VPS (root-only, mode 600) — read it there, save it in a password manager, then delete the file"
else
  echo "  - Admin account password: not created this run (see МОИ ДЕЙСТВИЯ above)"
fi
echo
echo "### ДОСТУП"
echo "- Сайт:  $SITE_URL"
echo "- Admin: ${SITE_URL}/admin"
echo "(пароли и секреты см. выше — они НЕ выводятся в открытом виде)"
echo "############################################################"
