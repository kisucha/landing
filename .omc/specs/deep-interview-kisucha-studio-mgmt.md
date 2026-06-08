---
Document Name: Kisucha Studio 앱 관리 페이지 스펙
Version: V1
Date: 2026-06-08
Author: kisucha
Document Type: Deep Interview Spec
Model Used: claude-sonnet-4-6
---

| Field | Content |
|-------|---------|
| Document Name | Kisucha Studio 앱 관리 페이지 스펙 |
| Version | V1 |
| Date | 2026-06-08 |
| Author | kisucha |
| Document Type | Deep Interview Spec |
| Model Used | claude-sonnet-4-6 |

---

# Kisucha Studio — 앱 관리(Admin) 페이지 스펙

## 인터뷰 메타데이터

- **Interview ID:** di-mgmt-20260608-001
- **Type:** Brownfield
- **Threshold:** 20% (default)
- **최종 모호도:** 18.75% (8라운드 완료)
- **기존 코드베이스:** 정적 HTML/CSS/JS, APPS 배열 in script.js, Netlify 호스팅

---

## 배경

기존 `index.html` 랜딩 페이지는 `script.js` 내 정적 `APPS` 배열로 앱을 렌더링함.
앱이 추가될수록 코드 직접 수정이 필요 → 관리자 UI + DB로 전환 필요.

---

## Topology (확정)

| ID | 컴포넌트 | 상태 | 설명 |
|----|---------|------|------|
| admin-page | 관리자 페이지 | active | `admin.html` — 앱 CRUD 관리 UI |
| category-system | 카테고리 시스템 | active | 관리자가 자유 생성/삭제, 랜딩에 필터 탭 표시 |
| landing-integration | 랜딩 연동 | active | `index.html`이 Supabase에서 앱 데이터를 fetch |

---

## 기술 스택 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| DB | Supabase (PostgreSQL) | 백엔드 없는 정적 사이트에 REST API 제공, 무료 티어 충분 |
| 스토리지 | Supabase Storage | 앱 아이콘 이미지 업로드/서빙 |
| 인증 | Netlify Identity | Netlify 호스팅과 통합, 이메일+비밀번호 로그인 |
| 호스팅 | Netlify (기존) | 변경 없음 |

---

## DB 스키마 (설계 기준)

### `categories` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| name_ko | text NOT NULL | 카테고리명 한국어 |
| name_en | text NOT NULL | 카테고리명 영어 |
| created_at | timestamptz | 생성 시각 |

### `apps` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| name_ko | text NOT NULL | 앱 이름 한국어 |
| name_en | text NOT NULL | 앱 이름 영어 |
| desc_ko | text | 설명 한국어 |
| desc_en | text | 설명 영어 |
| category_id | uuid (FK → categories.id) | 카테고리 |
| icon_url | text | Supabase Storage URL |
| status | text CHECK (released, coming-soon) | 출시 상태 |
| platforms | text[] | ['android','ios','windows'] 조합 |
| link_google_play | text | Google Play 스토어 URL |
| link_app_store | text | App Store URL |
| link_ms_store | text | Microsoft Store URL |
| sort_order | int | 표시 순서 |
| created_at | timestamptz | 생성 시각 |
| updated_at | timestamptz | 수정 시각 |

---

## 컴포넌트별 요구사항

### 1. 관리자 페이지 (`admin.html`)

**인증:**
- Netlify Identity SDK 사용
- 이메일 + 비밀번호 로그인
- 로그인 전: 로그인 폼만 표시
- 로그인 후: 관리 대시보드 표시

**4개 화면 (성공기준):**
1. **로그인 화면** — Netlify Identity 이메일+비밀번호
2. **앱 목록** — Supabase에서 fetch, 테이블 형태, 카테고리/상태 표시
3. **앱 등록 폼** — 아래 필드 전체 입력, 아이콘 이미지 업로드
4. **수정/삭제** — 목록에서 선택 → 수정 폼 재사용 or 삭제 확인

**앱 등록 필드:**
- 이름 (한국어 / 영어)
- 설명 (한국어 / 영어)
- 카테고리 (드롭다운, categories 테이블에서 fetch)
- 아이콘 이미지 업로드 (→ Supabase Storage)
- 플랫폼 (android / ios / windows 체크박스)
- 상태 (released / coming-soon)
- 스토어 링크: Google Play, App Store, Microsoft Store

**카테고리 관리 (admin 내 서브기능):**
- 카테고리 목록 조회
- 카테고리 추가 (이름 한/영)
- 카테고리 삭제

### 2. 카테고리 시스템

- 관리자가 자유롭게 생성/삭제
- 랜딩 페이지에 **필터 탭**으로 표시
- "전체" 탭 항상 포함
- 카테고리가 없는 앱은 "기타"로 처리

### 3. 랜딩 연동 (`index.html` + `script.js` 수정)

**우선순위 1 — Supabase API fetch:**
- 페이지 로드 시 Supabase REST API로 apps + categories 조회
- `anon key` 클라이언트 JS에 노출 (read-only, 허용됨)
- 카테고리 필터 탭 렌더링
- 로딩 상태 표시 (스피너 또는 skeleton)
- fetch 실패 시 fallback으로 전환

**우선순위 2 — JSON export fallback:**
- admin에서 현재 앱 목록을 `apps-export.json`으로 export
- `index.html`이 Supabase fetch 실패 시 `apps-export.json` 사용
- 혹은 Supabase 없이 배포할 때도 동작 보장

---

## 성공 기준 (완성 판단 체크리스트)

- [ ] `admin.html` — Netlify Identity 로그인 동작
- [ ] 앱 목록 조회 (Supabase 연동)
- [ ] 앱 등록/수정/삭제 동작
- [ ] 아이콘 이미지 Supabase Storage 업로드 및 표시
- [ ] 카테고리 생성/삭제 동작
- [ ] `index.html` — Supabase fetch로 앱 카드 렌더링
- [ ] 카테고리 필터 탭 동작 (전체 + 각 카테고리)
- [ ] JSON export fallback 동작

---

## 비범위 (Out of Scope)

- 다국어 카테고리 이름 외 추가 언어
- 앱 통계/분석 대시보드
- 다중 관리자 권한 (관리자 1인 가정)
- 앱 내 광고 관리
- 사용자 리뷰/댓글

---

## 파일 변경 예상 목록

| 파일 | 변경 유형 | 설명 |
|------|---------|------|
| `admin.html` | 신규 | 관리자 페이지 전체 |
| `admin.css` | 신규 | 관리자 UI 스타일 |
| `admin.js` | 신규 | 관리자 로직 (Netlify Identity + Supabase CRUD) |
| `index.html` | 수정 | 카테고리 필터 탭 섹션 추가 |
| `script.js` | 수정 | APPS 정적 배열 → Supabase fetch + fallback |
| `netlify.toml` | 수정 | Identity 설정, admin 접근 보안 헤더 |
| `.env.example` | 신규 | Supabase URL + anon key 환경변수 예시 |

---

## 제약사항 및 주의사항

1. **Supabase anon key 노출**: read-only이므로 허용. Row Level Security (RLS) 설정 필수 — anon은 SELECT만, 쓰기는 인증된 사용자만.
2. **Netlify Identity**: 무료 티어 1,000 active users/month — 관리자 1인 사용으로 충분.
3. **CORS**: Supabase 대시보드에서 Netlify 도메인 허용 설정 필요.
4. **기존 APPS 배열 마이그레이션**: 기존 3개 앱 데이터를 Supabase에 초기 데이터로 삽입.
