---
Document Name: Kisucha Studio 앱 관리 페이지 구현 계획
Version: V1
Date: 2026-06-08
Author: kisucha
Document Type: Implementation Plan
Model Used: claude-sonnet-4-6
---

| Field | Content |
|-------|---------|
| Document Name | Kisucha Studio 앱 관리 페이지 구현 계획 |
| Version | V1 |
| Date | 2026-06-08 |
| Author | kisucha |
| Document Type | Implementation Plan |
| Model Used | claude-sonnet-4-6 |

---

# Kisucha Studio — 앱 관리 페이지 구현 계획

**스펙:** `.omc/specs/deep-interview-kisucha-studio-mgmt.md`

---

## 구현 순서 (Phase별)

```
Phase 1: 백엔드 인프라
  ├─ 1.1 Supabase 프로젝트 생성 & 테이블 설계
  ├─ 1.2 RLS 정책 설정
  ├─ 1.3 Storage 버킷 생성
  └─ 1.4 기존 APPS 데이터 마이그레이션

Phase 2: 보안 및 배포 설정
  ├─ 2.1 Netlify Identity 활성화 & 관리자 계정 생성
  ├─ 2.2 netlify.toml 수정 (보안 헤더, 캐시)
  └─ 2.3 CORS 설정 (Supabase)

Phase 3: 관리자 페이지 개발 (신규 파일)
  ├─ 3.1 admin.html 구조 작성
  ├─ 3.2 admin.css 스타일링 (다크테마 일관성)
  ├─ 3.3 admin.js 구현
  │   ├─ Netlify Identity 통합
  │   ├─ Supabase CRUD (앱 등록/수정/삭제)
  │   ├─ Supabase Storage 이미지 업로드
  │   └─ 카테고리 관리 (생성/삭제)
  └─ 3.4 테스트 (로그인 → CRUD)

Phase 4: 랜딩 페이지 개선 (기존 파일 수정)
  ├─ 4.1 script.js 수정
  │   ├─ Supabase 로드 로직
  │   ├─ Fallback 로직 (apps-export.json)
  │   └─ 카테고리 필터 함수
  ├─ 4.2 index.html 수정 (카테고리 필터 섹션)
  ├─ 4.3 styles.css 추가 (필터 스타일)
  └─ 4.4 apps-export.json 생성

Phase 5: 통합 테스트
  ├─ 5.1 Netlify 로컬 개발 (netlify dev)
  ├─ 5.2 Supabase 연동 테스트
  ├─ 5.3 관리자 페이지 E2E 테스트
  ├─ 5.4 랜딩 페이지 필터 테스트
  └─ 5.5 Fallback 동작 확인

Phase 6: 배포
  ├─ 6.1 Netlify 환경변수 설정
  ├─ 6.2 Supabase 설정 최종 검증
  └─ 6.3 Netlify로 배포 & 라이브 검증
```

---

## DB 스키마 (SQL)

### `categories` 테이블

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ko text NOT NULL,
  name_en text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "auth_write" ON categories FOR ALL USING (auth.role() = 'authenticated');
```

### `apps` 테이블

```sql
CREATE TABLE apps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ko text NOT NULL,
  name_en text NOT NULL,
  desc_ko text,
  desc_en text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  icon_url text,
  status text NOT NULL DEFAULT 'coming-soon'
    CHECK (status IN ('released', 'coming-soon')),
  platforms text[] DEFAULT '{}',
  link_google_play text,
  link_app_store text,
  link_ms_store text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON apps FOR SELECT USING (true);
CREATE POLICY "auth_write" ON apps FOR ALL USING (auth.role() = 'authenticated');
```

### 기존 APPS 데이터 마이그레이션

```sql
INSERT INTO apps (name_ko, name_en, desc_ko, desc_en, status, platforms, sort_order) VALUES
  ('타이머 프로', 'Timer Pro',
   '심플하고 집중에 방해 없는 인터벌 타이머. 운동, 공부, 생산성 루틴에 최적화.',
   'A clean, distraction-free interval timer. Perfect for workouts, study sessions, and productivity routines.',
   'coming-soon', ARRAY['android', 'ios'], 0),
  ('빠른 메모', 'QuickNote',
   '마찰 제로의 즉각 메모. 열고, 쓰고, 끝. 계정 없음, 동기화 없음, 방해 없음.',
   'Instant note-taking with zero friction. Open, type, done. No accounts, no sync, no distractions.',
   'coming-soon', ARRAY['android', 'ios', 'windows'], 1),
  ('단위 변환기', 'UnitSwap',
   '일상 단위 변환기 — 길이, 무게, 온도, 환율 등을 빠르게 변환.',
   'Fast unit converter for everyday needs — length, weight, temperature, currency, and more.',
   'coming-soon', ARRAY['android', 'ios', 'windows'], 2);
```

---

## 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|---------|------|
| `admin.html` | **신규** | 관리자 UI (로그인 + CRUD 대시보드) |
| `admin.css` | **신규** | 관리자 스타일 (다크테마 일관성) |
| `admin.js` | **신규** | Netlify Identity + Supabase CRUD 로직 |
| `apps-export.json` | **신규** | Fallback 앱 데이터 (JSON export) |
| `.env.example` | **신규** | 환경변수 예시 |
| `index.html` | **수정** | 카테고리 필터 탭 섹션 추가 |
| `script.js` | **수정** | Supabase fetch + Fallback + 카테고리 필터 |
| `styles.css` | **수정** | 카테고리 필터 스타일 추가 |
| `netlify.toml` | **수정** | admin 보안 헤더 + 캐시 정책 |

---

## admin.html 화면 구조

```
admin.html
├── 로그인 화면 (auth 없을 때)
│   └── 이메일+비밀번호 폼
└── 대시보드 (인증 후)
    ├── 헤더 (로그아웃 버튼)
    ├── 탭 네비게이션
    │   ├── [앱 목록]
    │   ├── [앱 등록/수정]
    │   └── [카테고리 관리]
    ├── 탭 1: 앱 목록 테이블
    │   └── 각 행: 이름/카테고리/플랫폼/상태 + [수정][삭제]
    ├── 탭 2: 앱 등록/수정 폼
    │   ├── 이름 (한/영)
    │   ├── 설명 (한/영)
    │   ├── 카테고리 (드롭다운)
    │   ├── 아이콘 업로드
    │   ├── 플랫폼 체크박스
    │   ├── 상태 선택
    │   └── 스토어 링크 3종
    └── 탭 3: 카테고리 관리
        ├── 카테고리 목록 + [삭제]
        └── 추가 폼 (이름 한/영)
```

---

## netlify.toml 수정 내용

```toml
# admin.html 캐시 비활성화
[[headers]]
  for = "/admin.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# admin 보안 헤더 강화
[[headers]]
  for = "/admin*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://identity.netlify.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https://*.supabase.co data: blob:; connect-src 'self' https://*.supabase.co"
```

---

## Supabase 설정 체크리스트

- [ ] Supabase 프로젝트 생성 (free tier)
- [ ] `categories` 테이블 생성 + RLS 설정
- [ ] `apps` 테이블 생성 + RLS 설정
- [ ] `app-icons` Storage 버킷 생성 (public)
- [ ] Storage RLS: public read, authenticated write
- [ ] CORS: Netlify 도메인 허용
- [ ] Project URL + anon key 복사

---

## 통합 테스트 체크리스트

| 검증 항목 | 성공 기준 |
|---------|---------|
| Netlify Identity 로그인 | 관리자 계정으로 로그인 성공 |
| Supabase RLS | anon = SELECT만, 인증 = CRUD |
| 앱 등록 폼 | 모든 필드 입력 후 저장 성공 |
| 이미지 업로드 | Storage 업로드 + URL 저장 |
| 앱 목록 조회 | 테이블 렌더링 |
| 앱 수정 | 폼에 데이터 채워짐 → 저장 |
| 앱 삭제 | 확인 → DB에서 제거 |
| 카테고리 추가/삭제 | 관리 동작 |
| 랜딩 Supabase 로드 | index.html fetch 성공 |
| 카테고리 필터 | 탭 클릭 → 해당 카테고리만 표시 |
| Fallback | Supabase 실패 시 JSON 로드 |
| 보안 헤더 | admin CSP 적용 확인 |

---

## 주의사항

1. **Supabase anon key**: 클라이언트 노출 허용 (RLS로 read-only 보호)
2. **Netlify Identity**: 무료 1,000 active users/month — 관리자 1인 충분
3. **CORS**: Supabase 대시보드에서 Netlify 도메인 명시적 허용 필수
4. **기존 호환성**: script.js 수정 후에도 기존 정적 APPS fallback 유지
