| Field | Content |
|-------|---------|
| Document Name | deploy/GUIDE.md |
| Version | V1 |
| Date | 2026-06-08 |
| Author | Kisucha Studio |
| Document Type | 배포 가이드 |
| Model Used | claude-sonnet-4-6 |

# 배포 가이드

## 파일 구조

```
deploy/
├── setup-server.sh   # 서버 최초 1회 세팅
├── update.sh         # 배포 시마다 서버에서 실행
└── nginx.conf        # Nginx 리버스 프록시 설정

deploy.ps1            # 로컬 Windows에서 실행하는 배포 스크립트
server/ecosystem.config.js  # PM2 프로세스 설정
```

## 최초 서버 세팅 (1회)

```bash
# 1. 서버에 파일 복사
scp deploy/setup-server.sh kisucha@192.168.20.80:/tmp/

# 2. 서버에서 실행
ssh kisucha@192.168.20.80
bash /tmp/setup-server.sh

# 3. .env 설정
cp /opt/landing/server/.env.example /opt/landing/server/.env
nano /opt/landing/server/.env

# 4. MariaDB 스키마
mysql -u root -p < /opt/landing/server/schema.sql

# 5. PM2 시작
cd /opt/landing/server
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup
```

## 이후 배포 (코드 변경 시)

### 방법 A — Windows에서 자동 배포
```powershell
# deploy.ps1의 $User를 서버 SSH 사용자명으로 수정 후
.\deploy.ps1
```

### 방법 B — 수동
```powershell
# 1. 로컬: push
git push origin master

# 2. 서버: pull + 재시작
ssh kisucha@192.168.20.80 "bash /opt/landing/deploy/update.sh"
```

## PM2 명령어 (서버에서)

```bash
pm2 list                          # 프로세스 목록
pm2 logs kisucha-studio           # 로그 실시간 확인
pm2 restart kisucha-studio        # 재시작
pm2 stop kisucha-studio           # 중지
```
