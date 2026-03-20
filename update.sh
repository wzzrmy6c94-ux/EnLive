#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[info]${NC}  $*"; }
success() { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
die()     { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Run this script as root (or with sudo)."

APP_DIR="${APP_DIR:-/var/www/enlive}"
SWAP_FILE="/tmp/enlive-build-swap"

# ─── 1. Temp swap ─────────────────────────────
info "Creating temporary 2 GB swap..."
if swapon --show | grep -q "$SWAP_FILE"; then
  warn "Temp swap already active — skipping."
else
  fallocate -l 2G "$SWAP_FILE" 2>/dev/null \
    || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=2048 status=progress
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE"
  swapon "$SWAP_FILE"
  success "Temp swap active."
fi

cleanup_swap() {
  if swapon --show | grep -q "$SWAP_FILE"; then
    info "Removing temporary swap..."
    swapoff "$SWAP_FILE"
    rm -f "$SWAP_FILE"
    success "Temp swap removed."
  fi
}
trap cleanup_swap EXIT

# ─── 2. Pull latest from origin main ──────────
info "Pulling latest from origin main..."
cd "$APP_DIR"
git fetch origin
git reset --hard origin/main
success "Code updated."

# ─── 3. Install dependencies ──────────────────
info "Installing dependencies..."
npm ci --prefer-offline 2>&1 | tail -5
success "Dependencies installed."

# ─── 4. Build ─────────────────────────────────
info "Building Next.js app..."
NODE_ENV=production npm run build
success "Build complete."

# ─── 5. Restart PM2 ───────────────────────────
info "Restarting PM2 process 'enlive'..."
pm2 reload enlive
success "PM2 reloaded."

# ─── Done (swap removed by trap) ──────────────
echo ""
echo -e "${GREEN}━━━  Update complete!  ━━━${NC}"
echo ""
echo -e "  PM2 status : pm2 status"
echo -e "  App logs   : pm2 logs enlive"
echo ""
