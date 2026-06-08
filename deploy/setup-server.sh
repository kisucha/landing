#!/bin/bash
# Kisucha Studio — 서버 최초 1회 세팅 스크립트
# 실행: bash setup-server.sh
# 대상 OS: Ubuntu/Debian

set -e

APP_DIR="/var/www/landing"
GITEA_URL="http://192.168.20.15:8418/kisucha/landing.git"

echo "=== [1/6] Node.js LTS 설치 ==="
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "=== [2/6] PM2 설치 ==="
sudo npm install -g pm2

echo "=== [3/6] Nginx 설치 ==="
sudo apt-get install -y nginx

echo "=== [4/6] 앱 디렉토리 생성 및 클론 ==="
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
git clone "$GITEA_URL" "$APP_DIR"

echo "=== [5/6] Node.js 의존성 설치 ==="
cd "$APP_DIR/server"
npm install --omit=dev

echo "=== [6/6] Nginx 설정 ==="
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/kisucha-studio
sudo ln -sf /etc/nginx/sites-available/kisucha-studio /etc/nginx/sites-enabled/kisucha-studio
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== 수동 작업 필요 ==="
echo "1. .env 파일 생성:"
echo "   cp $APP_DIR/server/.env.example $APP_DIR/server/.env"
echo "   nano $APP_DIR/server/.env   (실제 값 입력)"
echo ""
echo "2. MariaDB 스키마 실행:"
echo "   mysql -u root -p < $APP_DIR/server/schema.sql"
echo ""
echo "3. PM2로 서버 시작:"
echo "   cd $APP_DIR/server"
echo "   pm2 start ecosystem.config.js --env production"
echo "   pm2 save"
echo "   pm2 startup   (부팅 자동 시작 등록)"
