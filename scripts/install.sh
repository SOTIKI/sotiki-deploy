#!/usr/bin/env bash
set -euo pipefail

MIN_NODE=22
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; ACID='\033[0;92m'; NC='\033[0m'
info()    { echo -e "${ACID}[sotiki]${NC} $*"; }
ok()      { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC} $*"; }
die()     { echo -e "${RED}✗${NC} $*"; exit 1; }

echo -e "\n${ACID}  SOTIKI Deploy — Installer${NC}\n"

[ -f /etc/os-release ] && . /etc/os-release || die "Cannot detect OS"
info "OS: $ID"

install_debian() {
  apt-get update -qq
  apt-get install -y -qq curl ca-certificates ufw certbot nginx
  if ! command -v docker &>/dev/null; then
    info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker --now
  fi
  docker compose version &>/dev/null 2>&1 || apt-get install -y -qq docker-compose-plugin
  if ! node --version &>/dev/null 2>&1 || [[ $(node --version | tr -d 'v' | cut -d. -f1) -lt $MIN_NODE ]]; then
    info "Installing Node.js $MIN_NODE..."
    curl -fsSL https://deb.nodesource.com/setup_${MIN_NODE}.x | bash -
    apt-get install -y -qq nodejs
  fi
}

case "${ID:-}" in
  ubuntu|debian) install_debian ;;
  arch|manjaro)  pacman -Sy --noconfirm docker docker-compose nodejs npm nginx ufw certbot; systemctl enable docker --now ;;
  *) warn "Unsupported OS: $ID — attempting to continue" ;;
esac

node_ver=$(node --version | tr -d 'v' | cut -d. -f1)
[[ $node_ver -ge $MIN_NODE ]] || die "Node.js $MIN_NODE+ required, found v$node_ver"
ok "Node.js $(node --version)"

info "Installing sotiki-deploy..."
npm install -g sotiki-deploy
ok "sotiki-deploy installed"

echo -e "\n${ACID}  Done!${NC}\n  Run: ${ACID}sotiki-deploy init${NC}\n"