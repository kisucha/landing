# Plan: Kisucha Studio 랜딩 홈페이지

| 항목 | 내용 |
|------|------|
| Document Name | Kisucha Studio Landing Page Plan |
| Version | V1 |
| Date | 2026-06-07 |
| Author | kisucha |
| Document Type | Implementation Plan |
| Model Used | claude-sonnet-4-6 |

**Source Spec**: `.omc/specs/deep-interview-kisucha-studio-landing.md`
**Complexity**: Small

---

## Summary

HTML + CSS + Vanilla JS 정적 사이트. 3개 파일(index.html, styles.css, script.js) + assets 폴더로 구성. 앱 카드는 Coming Soon 플레이스홀더로 시작, 새 앱 출시 시 HTML 블록 1개 추가만으로 확장 가능. 한/영 언어 전환은 `data-ko` / `data-en` 속성 + JS 토글로 처리.

---

## 패턴 기반 (Pattern Grounding)

그린필드 프로젝트 — 기존 코드 없음. 아래 관례를 새로 정의한다.

| 카테고리 | 패턴 | 이유 |
|----------|------|------|
| 파일 구조 | `index.html` / `styles.css` / `script.js` (flat) | Netlify/Vercel 정적 감지, 추가 빌드 설정 불필요 |
| 언어 처리 | `data-ko="..."` `data-en="..."` HTML 속성 | JS 프레임워크 없이 i18n 가능 |
| 앱 데이터 | JS 배열 오브젝트 (`const APPS = [...]`) | HTML 직접 편집보다 앱 추가 실수 적음 |
| 스타일 변수 | CSS Custom Properties (`--color-*`, `--space-*`) | 색상/간격 한 곳에서 관리 |
| 반응형 | mobile-first, `@media (min-width: 768px)` | 스토어 링크 클릭 주 기기가 모바일 |
| 인코딩 | `<meta charset="UTF-8">` 최상단 | Windows 환경 한글 깨짐 방지 |

---

## 파일 구조

```
E:\landing\
├── index.html          (CREATE) - 메인 페이지
├── styles.css          (CREATE) - 전체 스타일
├── script.js           (CREATE) - 언어 전환 + 앱 데이터 렌더링
├── assets/
│   ├── icons/
│   │   └── app-placeholder.png   (CREATE) - 앱 아이콘 플레이스홀더
│   └── badges/
│       ├── google-play-badge.svg (CREATE) - 구글 플레이 배지 SVG
│       ├── app-store-badge.svg   (CREATE) - 앱스토어 배지 SVG
│       └── ms-store-badge.svg    (CREATE) - MS스토어 배지 SVG
└── netlify.toml        (CREATE) - 선택적 배포 설정
```

**총 생성 파일:** 8개

---

## 페이지 섹션 구조

```
┌─────────────────────────────────────┐
│  HEADER  로고(Kisucha Studio) [KO|EN]│
├─────────────────────────────────────┤
│  HERO    브랜드 슬로건               │
│          "Simple Apps. Real Value." │
├─────────────────────────────────────┤
│  APPS    앱 그리드 (카드 목록)       │
│  ┌──────────┐  ┌──────────┐         │
│  │앱 카드   │  │Coming    │         │
│  │(미래용)  │  │Soon      │         │
│  └──────────┘  └──────────┘         │
├─────────────────────────────────────┤
│  ABOUT   개발자/브랜드 소개          │
├─────────────────────────────────────┤
│  FOOTER  Copyright, 연락처          │
└─────────────────────────────────────┘
```

---

## 앱 카드 상태 (2가지)

### 출시됨 (status: "released")
```
┌─────────────────────────────┐
│ [앱 아이콘 512x512]         │
│ 앱 이름 (한/영)             │
│ 설명 텍스트                 │
│ [Android] [iOS] [Windows]   │
│ [▶ Google Play]             │
│ [⬇ App Store]              │
│ [🪟 Microsoft Store]        │
└─────────────────────────────┘
```

### 출시 예정 (status: "coming-soon")
```
┌─────────────────────────────┐
│ [플레이스홀더 아이콘]        │
│ 앱 이름                     │
│ 설명 텍스트                 │
│ [Android] [iOS] [Windows]   │
│ ──── 출시 예정 / Coming Soon│
└─────────────────────────────┘
```

---

## 구현 태스크

### Phase 1: HTML 구조 (index.html)

**목표:** 의미론적 HTML, UTF-8, 한/영 data 속성 구조

- `<head>`: charset UTF-8, viewport, Google Fonts (Inter), title
- `<header>`: 로고 텍스트 + 언어 전환 버튼 `[KO | EN]`
- `<section id="hero">`: h1 슬로건 (data-ko / data-en), 부제목
- `<section id="apps">`: h2 제목 + `<div id="app-grid">` (JS 렌더링 대상)
- `<section id="about">`: Kisucha Studio 소개 텍스트
- `<footer>`: 저작권 + 연락처 (이메일 선택적)
- `<script src="script.js">` 마지막에 로드

**검증:** `index.html`을 브라우저에서 열면 5개 섹션이 보임

---

### Phase 2: 디자인 시스템 (styles.css)

**목표:** 다크 테마, 모바일 우선, 앱 카드 컴포넌트

#### CSS 변수 (`:root`)
```
--color-bg: #0f0f13         (배경)
--color-surface: #1a1a24    (카드 배경)
--color-border: #2a2a3a     (테두리)
--color-text: #e8e8f0       (본문)
--color-text-muted: #8888a8 (보조 텍스트)
--color-accent: #7c6ff7     (보라 계열 포인트)
--color-accent-2: #4fa8e8   (파랑 계열 포인트)
--color-android: #3ddc84    (Android 초록)
--color-ios: #999999        (iOS 회색)
--color-windows: #0078d4    (Windows 파랑)
--space-sm: 8px
--space-md: 16px
--space-lg: 32px
--space-xl: 64px
--radius: 12px
--font: 'Inter', system-ui, sans-serif
```

#### 레이아웃
- `body`: flex column, min-height 100vh
- `header`: sticky top, blur backdrop
- `#hero`: 풀스크린 중앙 정렬, 그라디언트 배경
- `#app-grid`: CSS Grid, `auto-fill minmax(280px, 1fr)`, gap 24px
- `#about`: max-width 760px 중앙

#### 앱 카드 (`.app-card`)
- border 1px `--color-border`, border-radius `--radius`
- hover: translateY(-4px) + box-shadow 효과
- `.coming-soon`: opacity 0.7, dashed border

#### 스토어 버튼 (`.store-btn`)
- 각 플랫폼별 색상 변수 적용
- `border-radius: 8px`, padding 10px 18px
- hover: brightness(1.15)

#### 반응형
```css
/* mobile-first 기본: 1 column */
@media (min-width: 768px) {
  /* tablet: 2 column grid */
}
@media (min-width: 1200px) {
  /* desktop: 3 column grid */
}
```

**검증:** 모바일(375px), 태블릿(768px), 데스크탑(1440px) 3개 뷰포트에서 레이아웃 확인

---

### Phase 3: 상호작용 (script.js)

**목표:** 앱 데이터 정의 + 렌더링 + 언어 전환

#### 앱 데이터 구조
```javascript
const APPS = [
  {
    id: 'app-1',
    nameEn: 'App Name',
    nameKo: '앱 이름',
    descEn: 'Short description in English.',
    descKo: '앱에 대한 간단한 설명.',
    icon: 'assets/icons/app-placeholder.png',
    platforms: ['android', 'ios', 'windows'],
    status: 'coming-soon',  // 'released' | 'coming-soon'
    links: {
      googlePlay: '',   // 출시 시 URL 입력
      appStore: '',
      msStore: ''
    }
  }
];
```

#### 함수 목록
| 함수 | 역할 |
|------|------|
| `renderApps(lang)` | APPS 배열을 #app-grid에 카드로 렌더링 |
| `createAppCard(app, lang)` | 앱 1개 카드 HTML 생성 |
| `setLang(lang)` | 'ko' \| 'en' 설정, localStorage 저장, 전체 재렌더링 |
| `initLang()` | localStorage 읽어 초기 언어 설정 |
| `toggleLang()` | 언어 토글 버튼 핸들러 |

#### 언어 전환 방식
- `document.querySelectorAll('[data-ko]')` 순회해 `textContent` 교체
- 앱 카드는 재렌더링 방식 (`renderApps(lang)`)

**검증:** KO/EN 버튼 클릭 시 전체 텍스트 전환, LocalStorage에 설정 저장 확인

---

### Phase 4: 에셋 생성

**목표:** SVG 배지 3종 + 아이콘 플레이스홀더

- `assets/badges/google-play-badge.svg` — 구글 플레이 공식 배지 색상 재현 SVG
- `assets/badges/app-store-badge.svg` — 앱스토어 공식 배지 색상 재현 SVG
- `assets/badges/ms-store-badge.svg` — MS스토어 공식 배지 색상 재현 SVG
- `assets/icons/app-placeholder.png` — 512x512 회색 플레이스홀더 (CSS로 대체 가능)

**검증:** 배지 SVG가 모든 브라우저에서 표시됨

---

### Phase 5: 배포 설정

**목표:** Netlify 즉시 배포 가능 구조

`netlify.toml`:
```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "default-src 'self' fonts.googleapis.com fonts.gstatic.com; style-src 'self' fonts.googleapis.com 'unsafe-inline'; script-src 'self'"
```

**검증:** Netlify 드래그앤드롭 또는 CLI로 배포 후 URL 접근 확인

---

## 리스크

| 리스크 | 가능성 | 완화 방법 |
|--------|--------|-----------|
| Google Fonts CDN 느림 | 낮음 | `font-display: swap` + 시스템 폰트 fallback |
| 스토어 배지 저작권 | 중간 | SVG 자체 제작 (공식 디자인 가이드 준수) 또는 텍스트 버튼으로 대체 |
| CSP 충돌 | 낮음 | Google Fonts 허용 도메인 명시 |
| 한글 인코딩 (Windows) | 낮음 | charset UTF-8 메타 태그 최상단 배치 |

---

## 검증 체크리스트

```
브라우저 검증 (코드 작성 후):
- [ ] Chrome/Edge: index.html 로컬 열기 → 5섹션 표시
- [ ] 모바일 뷰(375px DevTools): 1컬럼 레이아웃
- [ ] KO→EN 버튼 클릭 → 전체 텍스트 전환
- [ ] EN→KO 버튼 클릭 → 전체 텍스트 전환
- [ ] 페이지 새로고침 → 언어 설정 유지
- [ ] 앱 카드 hover → 부드러운 이동 효과
- [ ] Coming Soon 카드 → 스토어 버튼 없음, 배지 표시
```

---

## 수용 기준 대조

| 스펙 수용 기준 | 이 계획에서 처리 위치 |
|----------------|----------------------|
| "Kisucha Studio" 브랜드명 | Phase 1 header + hero |
| 한/영 전환 | Phase 1 버튼 구조 + Phase 3 setLang() |
| 앱 카드 (이름/설명/플랫폼/링크) | Phase 3 createAppCard() |
| Coming Soon 상태 표시 | Phase 3 status 분기 + Phase 2 스타일 |
| 스토어 링크 버튼 3종 | Phase 3 links 오브젝트 + Phase 4 배지 |
| 모바일 반응형 | Phase 2 media queries |
| 개발자 소개 섹션 | Phase 1 #about 섹션 |
| Netlify 배포 가능 구조 | Phase 5 netlify.toml |
| 카드 1개 추가로 앱 확장 | Phase 3 APPS 배열 추가 |
| 로딩 3초 이내 | 외부 의존성 최소화 (CDN 폰트 1개만) |

---

## 구현 순서

```
Phase 1 (index.html)
    ↓
Phase 2 (styles.css) — Phase 1과 병행 가능
    ↓
Phase 3 (script.js) — Phase 1 구조 필요
    ↓
Phase 4 (assets) — 독립적, 언제든 가능
    ↓
Phase 5 (netlify.toml) — 마지막
```

**총 예상 파일:** 8개
**예상 코드량:** HTML 150줄, CSS 350줄, JS 120줄

---

**대기 중: 위 계획을 승인하면 구현을 시작합니다. (`구현해줘` 또는 `코딩해줘`)**
