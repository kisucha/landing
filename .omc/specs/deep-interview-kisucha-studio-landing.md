# Deep Interview Spec: Kisucha Studio 랜딩 홈페이지

| 항목 | 내용 |
|------|------|
| Document Name | Kisucha Studio Landing Page Spec |
| Version | V1 |
| Date | 2026-06-07 |
| Author | kisucha |
| Document Type | Deep Interview Spec |
| Model Used | claude-sonnet-4-6 |

## Metadata
- Interview ID: di-landing-20260607-001
- Rounds: 7
- Final Ambiguity Score: 17.1%
- Type: greenfield
- Generated: 2026-06-07
- Threshold: 20%
- Threshold Source: default
- Initial Context Summarized: no
- Status: PASSED

---

## Clarity Breakdown

| 차원 | 점수 | 가중치 | 가중 점수 |
|------|------|--------|-----------|
| 목표 명확도 | 0.82 | 0.40 | 0.328 |
| 제약 명확도 | 0.85 | 0.30 | 0.255 |
| 성공 기준 | 0.82 | 0.30 | 0.246 |
| **총 명확도** | | | **0.829** |
| **모호성** | | | **17.1%** |

---

## Topology

| 컴포넌트 | 상태 | 설명 | 비고 |
|----------|------|------|------|
| 랜딩 홈페이지 | active | Kisucha Studio 앱 쇼케이스 웹사이트 | 현재 구현 대상 |
| 앱 제품군 | deferred | Android/iOS/Windows 유틸리티 앱들 | 향후 제작 예정 |
| 스토어 배포 | deferred | Google Play, App Store, MS Store 등록 | 앱 완성 후 진행 |
| 수익화 시스템 | deferred | 인앱 광고, 수익 추적 | 앱 배포 후 진행 |

---

## Goal

**Kisucha Studio**라는 브랜드명 하에, 개발자가 제작하는 Android/iOS/Windows용 실용 유틸리티 앱들을 소개하는 한/영 이중언어 랜딩 홈페이지를 구축한다. 현재 출시된 앱이 없어 초기에는 브랜드 소개 + 향후 앱 목록 틀(Coming Soon 카드)로 시작하며, 앱이 완성될 때마다 Google Play / App Store / Microsoft Store 링크와 함께 앱 카드를 추가할 수 있는 구조로 만든다.

---

## Constraints

- **기술 스택:** HTML + CSS + Vanilla JS (정적 사이트)
- **호스팅:** Netlify 또는 Vercel 무료 플랜
- **언어:** 한국어 + 영어 이중언어 (UI 전환 가능 또는 병기)
- **브랜드:** Kisucha Studio
- **앱 카테고리:** 실용 유틸리티 앱 (생산성, 도구 등)
- **플랫폼 지원:** Android, iOS, Windows 3개 플랫폼 대응
- **초기 앱:** 없음 — Coming Soon / 플레이스홀더 구조 필요
- **모바일 반응형:** 필수 (스토어 링크 클릭은 모바일에서 주로 발생)
- **의존성 최소화:** 외부 JS 프레임워크 없이 또는 최소한만 사용
- **인코딩:** UTF-8 필수 (한글 포함)

---

## Non-Goals

- 백엔드/서버 사이드 처리 없음
- 사용자 계정/로그인 없음
- 결제/구독 시스템 없음
- CMS 관리자 패널 없음 (HTML 직접 편집으로 앱 추가)
- 블로그/게시판 없음
- 검색 기능 없음

---

## Acceptance Criteria

- [ ] 페이지 제목에 "Kisucha Studio" 브랜드명 표시
- [ ] 한국어/영어 전환 버튼 또는 이중언어 병기 구현
- [ ] 앱 카드 컴포넌트: 앱 이름, 설명(한/영), 플랫폼 아이콘, 스토어 링크 버튼 포함
- [ ] Coming Soon 상태 앱 카드: 스토어 링크 대신 "준비중" 표시
- [ ] Google Play / App Store / Microsoft Store 링크 버튼 각각 구현
- [ ] 모바일 반응형 레이아웃 (breakpoint: 768px)
- [ ] 개발자 소개 섹션 (Kisucha Studio 간단 소개)
- [ ] Netlify/Vercel 배포 가능한 구조 (index.html 루트)
- [ ] 새 앱 추가 시 HTML 카드 1개만 추가하면 되는 구조
- [ ] 페이지 로딩 속도 3초 이내 (외부 의존성 최소화)

---

## Assumptions Exposed & Resolved

| 가정 | 질문 | 결론 |
|------|------|------|
| 앱이 이미 있을 것 | 현재 앱이 있나요? | 아이디어만 있음 → Coming Soon 구조 필요 |
| 한국어 전용일 것 | 언어 선호는? | 한/영 이중언어로 결정 |
| 복잡한 프레임워크 원할 것 | 기술 스택은? | 상관없음 → HTML/CSS/JS 정적 사이트로 단순화 |
| 커스텀 도메인 있을 것 | 도메인은? | 미정, Netlify 서브도메인으로 시작 가능 |
| 완성 기준이 디자인 품질일 것 | 언제 완성됐다 느끼나요? | 앱 목록 + 스토어 링크 게시 = 완성 |

---

## Technical Context

- **그린필드** — 기존 코드 없음
- 정적 파일만으로 구성 (HTML/CSS/JS)
- Netlify 배포: `netlify.toml` 또는 드래그앤드롭
- Vercel 배포: `vercel.json` 불필요 (정적 사이트 자동 감지)
- 폰트: Google Fonts (무료) 또는 시스템 폰트
- 아이콘: Font Awesome 또는 SVG 직접 삽입
- 이미지: 앱 아이콘 플레이스홀더 (PNG 512x512 권장)

---

## Ontology (Key Entities)

| 엔티티 | 유형 | 주요 필드 | 관계 |
|--------|------|-----------|------|
| Landing Page | core domain | title, lang, sections | contains AppCards |
| App | core domain | name, nameKo, description, descKo, platforms, status | has StoreLinks |
| App Card | core domain | app, iconUrl, status(ready/coming-soon) | displays App |
| Store Link | supporting | platform, url, badge | belongs to App |
| Developer Brand | core domain | name(Kisucha Studio), tagline, aboutText | owns Landing Page |
| Visitor | supporting | device, language | views Landing Page |

---

## Ontology Convergence

| 라운드 | 엔티티 수 | 신규 | 변경 | 안정 | 안정성 |
|--------|-----------|------|------|------|--------|
| 1 | 4 | 4 | - | - | N/A |
| 2 | 4 | 0 | 0 | 4 | 100% |
| 3 | 5 | 1 | 0 | 4 | 80% |
| 4 | 5 | 0 | 0 | 5 | 100% |
| 5 | 6 | 1 | 0 | 5 | 83% |
| 6 | 6 | 0 | 0 | 6 | 100% |
| 7 | 6 | 0 | 0 | 6 | 100% |

온톨로지 Round 6부터 완전 수렴.

---

## Interview Transcript

<details>
<summary>전체 Q&A (7 라운드)</summary>

### Round 0 (토폴로지 확인)
**Q:** 4개 컴포넌트 topology가 맞나요? (랜딩 홈페이지, 앱 제품군, 스토어 배포, 수익화)
**A:** 랜딩 홈페이지만 지금 범위, 나머지는 나중에
**결론:** 랜딩 홈페이지 active, 나머지 3개 deferred

### Round 1
**Q:** 랜딩 홈페이지 방문자의 가장 먼저 할 한 가지 행동?
**A:** 앱 소개 및 정보 파악
**모호성:** 77% (목표: 0.35, 제약: 0.15, 기준: 0.15)

### Round 2
**Q:** 기술 스택 및 호스팅 선호?
**A:** 상관없음 / 추천해줘 → HTML/CSS/JS + Netlify/Vercel 결정
**모호성:** 63% (목표: 0.40, 제약: 0.50, 기준: 0.20)

### Round 3
**Q:** 현재 앱이 있나요, 아니면 앞으로 만들 예정인가요?
**A:** 아이디어만 있음 (제작 예정)
**모호성:** 52.5% (목표: 0.55, 제약: 0.55, 기준: 0.30)

### Round 4
**Q:** 랜딩 페이지가 '완성됨'을 언제 느끼시겠어요?
**A:** 내 앱 목록 + 각 스토어 링크 게시
**모호성:** 36.5% (목표: 0.65, 제약: 0.60, 기준: 0.65)

### Round 5
**Q:** 페이지에 쓸 언어와 개발자/브랜드명?
**A:** 한국어 + 영어 이중언어, 브랜드명 영문으로
**모호성:** 28.5% (목표: 0.70, 제약: 0.75, 기준: 0.70)

### Round 6
**Q:** 사용할 영문 브랜드명이 있나요?
**A:** 내 이름/닉네임 기반으로
**모호성:** 26.2% (목표: 0.72, 제약: 0.78, 기준: 0.72)

### Round 7
**Q:** 브랜드명 스타일 + 앱 카테고리 확인
**A:** Kisucha Studio / 유틸리티처럼 실용 앱
**모호성:** 17.1% ✓ 임계값 달성

</details>
