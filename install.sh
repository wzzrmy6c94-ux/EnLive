#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
#  EnLive — VPS Install Script
#  Tested on Ubuntu 22.04 / 24.04
# ─────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[info]${NC}  $*"; }
success() { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()     { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

require_root() { [ "$(id -u)" -eq 0 ] || die "Run this script as root (or with sudo)."; }
require_root

# ─── Config prompts ───────────────────────────
echo ""
echo -e "${CYAN}━━━  EnLive installer  ━━━${NC}"
echo ""

read -rp "App directory path [/var/www/enlive]: " APP_DIR
APP_DIR="${APP_DIR:-/var/www/enlive}"

read -rp "Git repo URL (or leave blank to skip clone): " GIT_REPO

read -rp "Domain / IP for the site (e.g. enlive.example.com): " DOMAIN
DOMAIN="${DOMAIN:-localhost}"

read -rp "PostgreSQL database name [enlive]: " DB_NAME
DB_NAME="${DB_NAME:-enlive}"

read -rp "PostgreSQL user [enlive]: " DB_USER
DB_USER="${DB_USER:-enlive}"

read -rsp "PostgreSQL password: " DB_PASS; echo ""
[ -z "$DB_PASS" ] && die "Database password cannot be empty."

read -rp "App port [3000]: " APP_PORT
APP_PORT="${APP_PORT:-3000}"

read -rp "Node.js version [22]: " NODE_VERSION
NODE_VERSION="${NODE_VERSION:-22}"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

echo ""
info "Settings:"
echo "  App dir    : $APP_DIR"
echo "  Domain     : $DOMAIN"
echo "  DB name    : $DB_NAME"
echo "  DB user    : $DB_USER"
echo "  App port   : $APP_PORT"
echo "  Node       : $NODE_VERSION"
echo ""
read -rp "Continue? [y/N]: " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { info "Aborted."; exit 0; }

# ─── 1. Swap (prevents OOM during Next.js build on 2 GB RAM) ─────
info "Setting up 2 GB swap..."
if swapon --show | grep -q '/swapfile'; then
  warn "Swapfile already active — skipping."
else
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -qxF '/swapfile none swap sw 0 0' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  grep -qxF 'vm.swappiness=10' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
  success "2 GB swap enabled."
fi

# ─── 2. System packages ───────────────────────
info "Updating packages..."
apt-get update -qq
apt-get install -y -qq curl git build-essential nginx postgresql postgresql-contrib ufw

# ─── 3. Node.js via NodeSource ────────────────
if ! command -v node &>/dev/null || [[ "$(node -e 'process.stdout.write(process.version.split(".")[0].slice(1))')" -lt "$NODE_VERSION" ]]; then
  info "Installing Node.js $NODE_VERSION..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y nodejs
  success "Node $(node -v) installed."
else
  success "Node $(node -v) already installed."
fi

# ─── 4. PM2 ───────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2..."
  npm install -g pm2 --silent
  success "PM2 installed."
fi

# ─── 5. PostgreSQL setup ─────────────────────
info "Configuring PostgreSQL..."
systemctl enable --now postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
success "Database '${DB_NAME}' ready."

# ─── 6. App directory / clone ─────────────────
mkdir -p "$APP_DIR"

if [ -n "$GIT_REPO" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    info "Repo already cloned — pulling latest..."
    git -C "$APP_DIR" pull
  else
    info "Cloning repo..."
    git clone "$GIT_REPO" "$APP_DIR"
  fi
fi

cd "$APP_DIR"
[ -f package.json ] || die "No package.json found in $APP_DIR. Clone the repo first or set the correct path."

# ─── 7. Environment file ─────────────────────
ENV_FILE="$APP_DIR/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  info "Writing .env.local..."
  cat > "$ENV_FILE" <<EOF
DATABASE_URL=${DATABASE_URL}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NODE_ENV=production
PORT=${APP_PORT}
EOF
  success ".env.local created."
else
  warn ".env.local already exists — not overwriting. Ensure DATABASE_URL is set."
fi

# ─── 8. Install dependencies ─────────────────
info "Installing npm dependencies (this may take a few minutes)..."
npm ci --prefer-offline 2>&1 | tail -5
success "Dependencies installed."

# ─── 9. DB migrations ────────────────────────
info "Running database migrations..."
DATABASE_URL="$DATABASE_URL" npm run db:migrate
success "Migrations applied."

# ─── 10. Build ───────────────────────────────
info "Building Next.js app (swap is active — this is safe on 2 GB RAM)..."
NODE_ENV=production npm run build
success "Build complete."

# ─── 11. PM2 service ─────────────────────────
info "Configuring PM2 process..."
pm2 delete enlive 2>/dev/null || true
pm2 start npm --name enlive -- start -- -p "$APP_PORT"
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
success "PM2 process 'enlive' started on port $APP_PORT."

# ─── 12. Nginx reverse proxy ─────────────────
info "Writing nginx config..."
NGINX_CONF="/etc/nginx/sites-available/enlive"
cat > "$NGINX_CONF" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/enlive
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
success "Nginx configured for ${DOMAIN}."

# ─── 13. Firewall ────────────────────────────
info "Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall enabled (SSH + HTTP/HTTPS open)."

# ─── Done ─────────────────────────────────────
echo ""
echo -e "${GREEN}━━━  Install complete!  ━━━${NC}"
echo ""
echo -e "  Site         : http://${DOMAIN}"
echo -e "  App dir      : ${APP_DIR}"
echo -e "  PM2 status   : pm2 status"
echo -e "  App logs     : pm2 logs enlive"
echo -e "  Nginx logs   : journalctl -u nginx -f"
echo ""
echo -e "  To enable HTTPS:"
echo -e "    apt install certbot python3-certbot-nginx -y"
echo -e "    certbot --nginx -d ${DOMAIN}"
echo ""
