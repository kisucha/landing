| Field | Content |
|-------|---------|
| Document Name | server/GUIDE.md |
| Version | V1 |
| Date | 2026-06-08 |
| Author | Kisucha Studio |
| Document Type | 개발 가이드 |
| Model Used | claude-sonnet-4-6 |

# Kisucha Studio — Node.js API 서버

## 구조

```
server/
├── server.js          # Express 앱 진입점, 정적 파일 서빙
├── db.js              # MariaDB 커넥션 풀
├── schema.sql         # DB 스키마 + 시드 데이터
├── package.json
├── .env.example       # 환경변수 예시 (실제 .env는 git에 포함 금지)
├── middleware/
│   └── auth.js        # JWT 검증 미들웨어
└── routes/
    ├── auth.js        # POST /api/auth/login
    ├── apps.js        # CRUD + 아이콘 업로드
    └── categories.js  # CRUD
```

## 최초 세팅 순서

### 1. MariaDB 데이터베이스 생성
```bash
mysql -u root -p < schema.sql
```

### 2. DB 사용자 생성 (권장)
```sql
CREATE USER 'kisucha'@'localhost' IDENTIFIED BY '비밀번호';
GRANT ALL PRIVILEGES ON kisucha_studio.* TO 'kisucha'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 실제 값 입력
```

### 4. 패키지 설치
```bash
cd server
npm install
```

### 5. 서버 실행
```bash
# 개발용
npm run dev

# 운영용
npm start
```

## 주요 API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/auth/login | 없음 | 로그인, JWT 발급 |
| GET | /api/apps | 없음 | 앱 목록 (카테고리 포함) |
| POST | /api/apps | 필요 | 앱 등록 |
| PUT | /api/apps/:id | 필요 | 앱 수정 |
| DELETE | /api/apps/:id | 필요 | 앱 삭제 |
| GET | /api/apps/:id/icon | 없음 | 아이콘 이미지 |
| POST | /api/apps/:id/icon | 필요 | 아이콘 업로드 |
| DELETE | /api/apps/:id/icon | 필요 | 아이콘 제거 |
| GET | /api/categories | 없음 | 카테고리 목록 |
| POST | /api/categories | 필요 | 카테고리 추가 |
| DELETE | /api/categories/:id | 필요 | 카테고리 삭제 |

## 운영 서버 배포 (192.168.20.80)

```bash
# 파일 복사 후
cd /var/www/landing/server
npm install --omit=dev

# PM2로 백그라운드 실행
pm2 start server.js --name kisucha-studio
pm2 save
pm2 startup
```

## 도메인 연결 (www.dogsound.net)

Nginx 리버스 프록시 설정 예시:
```nginx
server {
    listen 80;
    server_name www.dogsound.net dogsound.net;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
