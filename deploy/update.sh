#!/bin/bash
# Kisucha Studio — 서버 업데이트 스크립트
# 배포 시마다 실행 (로컬 deploy.ps1에서 SSH로 호출)
# 위치: /var/www/landing/deploy/update.sh

set -e

APP_DIR="/var/www/landing"

echo "[deploy] git pull..."
cd "$APP_DIR"
git pull origin master

echo "[deploy] npm install..."
cd "$APP_DIR/server"
npm install --omit=dev

echo "[deploy] PM2 재시작..."
pm2 restart kisucha-studio --update-env

echo "[deploy] 완료 — $(date '+%Y-%m-%d %H:%M:%S')"
