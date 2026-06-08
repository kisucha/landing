| Field | Content |
|-------|---------|
| Document Name | code_update.md |
| Version | V1 |
| Date | 2026-06-08 |
| Author | Claude |
| Document Type | 변경 이력 |
| Model Used | claude-sonnet-4-6 |

# 코드 변경 이력

---

## 2026-06-08 — 아키텍처 전환: Supabase/Netlify → 자체 MariaDB 서버

### 변경 이유
- Supabase CDN 로드 실패 및 `window.supabase` 충돌 문제 반복
- 자체 서버(192.168.20.80, www.dogsound.net)와 MariaDB 이미 보유
- 외부 서비스 의존 제거 → 완전한 자체 운영

### 신규 생성 파일

| 파일 | 내용 |
|------|------|
| server/server.js | Express 메인 서버, 정적 파일 서빙 + API 라우팅 |
| server/db.js | MySQL2 기반 MariaDB 커넥션 풀 |
| server/schema.sql | MariaDB 스키마 + 시드 데이터 3개 |
| server/.env.example | 환경변수 예시 |
| server/package.json | 의존성 (express, mysql2, jsonwebtoken, multer@2, dotenv) |
| server/middleware/auth.js | JWT 검증 미들웨어 |
| server/routes/auth.js | POST /api/auth/login |
| server/routes/apps.js | CRUD + BLOB 아이콘 업로드/서빙 |
| server/routes/categories.js | 카테고리 CRUD |
| server/GUIDE.md | 서버 구조 및 배포 가이드 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| admin.js | 전체 재작성 — Supabase 제거, 자체 API 호출로 교체. JWT 인증, 아이콘 BLOB 업로드 |
| script.js | initSupabase() 제거, loadAppsFromApi() 추가 (자체 /api/* 호출) |
| admin.html | Supabase CDN 스크립트 제거, 로그인 폼 email → username으로 변경 |
| index.html | Supabase CDN 스크립트 제거 |

### 아키텍처 결정

- **인증**: 환경변수 ADMIN_USERNAME + ADMIN_PASSWORD, JWT 7일 유효
- **이미지 저장**: MariaDB LONGBLOB (apps.icon_data + icon_mime 컬럼)
- **이미지 서빙**: GET /api/apps/:id/icon → BLOB을 Content-Type 헤더와 함께 반환
- **프론트엔드 로딩 순서**: API → JSON fallback → DEFAULT_APPS (3단계)

---
