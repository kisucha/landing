#!/bin/bash
# Kisucha Studio — Ubuntu 서버 최초 1회 세팅 스크립트
# 실행: bash setup-server.sh
# 대상 OS: Ubuntu 20.04 / 22.04 / 24.04

set -e

APP_DIR="/opt/landing"
GITEA_URL="http://192.168.20.15:8418/kisucha/landing.git"

echo "=== [1/7] 시스템 업데이트 ==="
sudo apt-get update -y
sudo apt-get install -y curl git ufw

echo "=== [2/7] Node.js LTS 설치 ==="
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version

echo "=== [3/7] PM2 + 전역 패키지 설치 ==="
sudo npm install -g pm2

echo "=== [4/7] Nginx 설치 ==="
sudo apt-get install -y nginx
sudo systemctl enable nginx

echo "=== [5/7] 방화벽(ufw) 설정 ==="
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "=== [6/7] 앱 디렉토리 생성 및 Gitea 클론 ==="
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"

# git credential 저장 (clone 시 Gitea 계정 입력 → 이후 자동 사용)
git config --global credential.helper store

git clone "$GITEA_URL" "$APP_DIR"

echo "=== [7/7] Node.js 의존성 설치 ==="
cd "$APP_DIR/server"
npm install --omit=dev

echo "=== Nginx 설정 ==="
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/kisucha-studio
sudo ln -sf /etc/nginx/sites-available/kisucha-studio /etc/nginx/sites-enabled/kisucha-studio
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "========================================"
echo " 세팅 완료 — 아래 작업을 수동으로 진행하세요"
echo "========================================"
echo ""
echo "1. .env 파일 생성 (비밀번호/키 입력):"
echo "   cp $APP_DIR/server/.env.example $APP_DIR/server/.env"
echo "   nano $APP_DIR/server/.env"
echo "   → PORT=3000 으로 설정"
echo ""
echo "2. MariaDB DB/계정 생성 후 스키마 실행:"
echo "   mysql -u root -p < $APP_DIR/server/schema.sql"
echo ""
echo "3. PM2로 서버 시작 (부팅 자동 실행 포함):"
echo "   cd $APP_DIR/server"
echo "   pm2 start ecosystem.config.js --env production"
echo "   pm2 save"
echo "   sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u \$USER --hp \$HOME"
echo ""
echo "4. (선택) HTTPS 설정 — certbot:"
echo "   sudo apt-get install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d www.dogsound.net -d dogsound.net"
