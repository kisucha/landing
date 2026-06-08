// Kisucha Studio - Landing Page Script
// 언어 전환 + 앱 데이터 렌더링 (Supabase fetch + JSON fallback)

'use strict';

// ===== 기본 앱 데이터 (최종 fallback) =====
const DEFAULT_APPS = [
  {
    id: 'app-timer-pro',
    nameEn: 'Timer Pro',
    nameKo: '타이머 프로',
    descEn: 'A clean, distraction-free interval timer. Perfect for workouts, study sessions, and productivity routines.',
    descKo: '심플하고 집중에 방해 없는 인터벌 타이머. 운동, 공부, 생산성 루틴에 최적화.',
    icon: null,
    iconEmoji: '⏱️',
    platforms: ['android', 'ios'],
    status: 'coming-soon',
    category: null,
    links: { googlePlay: '', appStore: '', msStore: '' }
  },
  {
    id: 'app-note-quick',
    nameEn: 'QuickNote',
    nameKo: '빠른 메모',
    descEn: 'Instant note-taking with zero friction. Open, type, done. No accounts, no sync, no distractions.',
    descKo: '마찰 제로의 즉각 메모. 열고, 쓰고, 끝. 계정 없음, 동기화 없음, 방해 없음.',
    icon: null,
    iconEmoji: '📝',
    platforms: ['android', 'ios', 'windows'],
    status: 'coming-soon',
    category: null,
    links: { googlePlay: '', appStore: '', msStore: '' }
  },
  {
    id: 'app-unit-convert',
    nameEn: 'UnitSwap',
    nameKo: '단위 변환기',
    descEn: 'Fast unit converter for everyday needs — length, weight, temperature, currency, and more.',
    descKo: '일상 단위 변환기 — 길이, 무게, 온도, 환율 등을 빠르게 변환.',
    icon: null,
    iconEmoji: '🔄',
    platforms: ['android', 'ios', 'windows'],
    status: 'coming-soon',
    category: null,
    links: { googlePlay: '', appStore: '', msStore: '' }
  }
];

// ===== 앱/카테고리 상태 =====
let APPS = DEFAULT_APPS.slice();
let CATEGORIES = [];
let currentCategory = null;

// ===== 언어 설정 =====
const LANG_KEY = 'ks-lang';
let currentLang = 'ko';

const PLATFORM_LABELS = {
  android: { ko: '안드로이드', en: 'Android' },
  ios: { ko: 'iOS', en: 'iOS' },
  windows: { ko: '윈도우', en: 'Windows' }
};

const STORE_LABELS = {
  googlePlay: { ko: 'Google Play', en: 'Google Play', icon: '▶' },
  appStore:   { ko: 'App Store',   en: 'App Store',   icon: '⬇' },
  msStore:    { ko: 'Microsoft Store', en: 'Microsoft Store', icon: '🪟' }
};

// ===== DB 행 → APPS 형식 변환 =====
function transformSupabaseApp(row) {
  return {
    id: row.id,
    nameKo: row.name_ko,
    nameEn: row.name_en,
    descKo: row.desc_ko || '',
    descEn: row.desc_en || '',
    icon: row.icon_url || null,
    iconEmoji: null,
    platforms: row.platforms || [],
    status: row.status,
    category: row.category_id ? {
      id: row.category_id,
      nameKo: row.categories?.name_ko || null,
      nameEn: row.categories?.name_en || null
    } : null,
    links: {
      googlePlay: row.link_google_play || '',
      appStore: row.link_app_store || '',
      msStore: row.link_ms_store || ''
    }
  };
}

// ===== 자체 API 서버에서 앱 데이터 로드 =====
async function loadAppsFromApi() {
  const [catsRes, appsRes] = await Promise.all([
    fetch('/api/categories'),
    fetch('/api/apps')
  ]);
  if (!catsRes.ok || !appsRes.ok) return false;
  CATEGORIES = await catsRes.json();
  APPS = (await appsRes.json()).map(transformSupabaseApp);
  return true;
}

// ===== JSON fallback 로드 =====
async function loadAppsFromFallback() {
  try {
    const res = await fetch('apps-export.json');
    if (!res.ok) return false;
    const data = await res.json();
    CATEGORIES = data.categories || [];
    APPS = (data.apps || []).map(transformSupabaseApp);
    return true;
  } catch (_) {
    return false;
  }
}

// ===== 앱 데이터 로드 (우선순위: API 서버 → JSON fallback → 기본값) =====
async function loadAppsData() {
  try {
    const ok = await loadAppsFromApi();
    if (ok) return;
  } catch (_) {}

  const ok = await loadAppsFromFallback();
  if (!ok) {
    APPS = DEFAULT_APPS.slice();
    CATEGORIES = [];
  }
}

// ===== 카테고리 필터 렌더링 =====
function renderCategoryFilters(lang) {
  const container = document.getElementById('category-filters');
  if (!container) return;

  if (!CATEGORIES.length) {
    container.innerHTML = '';
    return;
  }

  const allLabel = lang === 'ko' ? '전체' : 'All';
  let html = `<button class="category-filter-btn${currentCategory === null ? ' active' : ''}" data-cat-id="">` + allLabel + '</button>';

  CATEGORIES.forEach(cat => {
    const raw = lang === 'ko' ? cat.name_ko : cat.name_en;
    const label = (raw || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const id = (cat.id || '').replace(/"/g, '');
    const active = currentCategory === id ? ' active' : '';
    html += `<button class="category-filter-btn${active}" data-cat-id="${id}">${label}</button>`;
  });

  container.innerHTML = html;

  container.querySelectorAll('.category-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.catId || null;
      renderCategoryFilters(currentLang);
      renderApps(currentLang);
    });
  });
}

// ===== 앱 카드 생성 =====
function createAppCard(app, lang) {
  const card = document.createElement('article');
  card.className = 'app-card' + (app.status === 'coming-soon' ? ' coming-soon' : '');
  card.setAttribute('data-app-id', app.id);

  const iconHtml = app.icon
    ? `<img src="${app.icon}" alt="${lang === 'ko' ? app.nameKo : app.nameEn} 아이콘" loading="lazy">`
    : `<span aria-hidden="true">${app.iconEmoji || '📦'}</span>`;

  const platformsHtml = app.platforms
    .map(p => `<span class="app-platform-tag ${p}">${PLATFORM_LABELS[p][lang]}</span>`)
    .join('');

  let storeAreaHtml;
  if (app.status === 'released') {
    const buttons = [];
    if (app.links.googlePlay && app.platforms.includes('android')) {
      buttons.push(`
        <a href="${app.links.googlePlay}" class="store-btn play-store" target="_blank" rel="noopener noreferrer">
          <span class="store-btn-icon" aria-hidden="true">${STORE_LABELS.googlePlay.icon}</span>
          ${STORE_LABELS.googlePlay[lang]}
        </a>`);
    }
    if (app.links.appStore && app.platforms.includes('ios')) {
      buttons.push(`
        <a href="${app.links.appStore}" class="store-btn app-store" target="_blank" rel="noopener noreferrer">
          <span class="store-btn-icon" aria-hidden="true">${STORE_LABELS.appStore.icon}</span>
          ${STORE_LABELS.appStore[lang]}
        </a>`);
    }
    if (app.links.msStore && app.platforms.includes('windows')) {
      buttons.push(`
        <a href="${app.links.msStore}" class="store-btn ms-store" target="_blank" rel="noopener noreferrer">
          <span class="store-btn-icon" aria-hidden="true">${STORE_LABELS.msStore.icon}</span>
          ${STORE_LABELS.msStore[lang]}
        </a>`);
    }
    storeAreaHtml = `<div class="store-links">${buttons.join('')}</div>`;
  } else {
    const label = lang === 'ko' ? '출시 예정' : 'Coming Soon';
    storeAreaHtml = `
      <div class="coming-soon-badge">
        <span class="coming-soon-dot" aria-hidden="true"></span>
        ${label}
      </div>`;
  }

  card.innerHTML = `
    <div class="app-icon-wrap">${iconHtml}</div>
    <h3 class="app-name">${lang === 'ko' ? app.nameKo : app.nameEn}</h3>
    <p class="app-desc">${lang === 'ko' ? app.descKo : app.descEn}</p>
    <div class="app-platforms">${platformsHtml}</div>
    ${storeAreaHtml}
  `;

  return card;
}

// ===== 앱 그리드 렌더링 (카테고리 필터 적용) =====
function renderApps(lang) {
  const grid = document.getElementById('app-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const filtered = currentCategory
    ? APPS.filter(app => app.category && app.category.id === currentCategory)
    : APPS;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="apps-empty">
        <div class="apps-empty-icon">🚧</div>
        <p>${lang === 'ko' ? '곧 앱이 추가될 예정입니다.' : 'Apps coming soon.'}</p>
      </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach(app => fragment.appendChild(createAppCard(app, lang)));
  grid.appendChild(fragment);
}

// ===== 정적 텍스트 교체 (data-ko / data-en) =====
function applyLangToDOM(lang) {
  document.querySelectorAll('[data-ko]').forEach(el => {
    const text = lang === 'ko' ? el.getAttribute('data-ko') : el.getAttribute('data-en');
    if (text !== null) el.textContent = text;
  });
}

// ===== 언어 토글 버튼 상태 업데이트 =====
function updateLangToggleUI(lang) {
  const koEl = document.getElementById('langKo');
  const enEl = document.getElementById('langEn');
  if (koEl) koEl.classList.toggle('active', lang === 'ko');
  if (enEl) enEl.classList.toggle('active', lang === 'en');
  document.documentElement.lang = lang;
}

// ===== 언어 설정 =====
function setLang(lang) {
  if (lang !== 'ko' && lang !== 'en') lang = 'ko';
  currentLang = lang;

  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (_) {}

  applyLangToDOM(lang);
  renderCategoryFilters(lang);
  renderApps(lang);
  updateLangToggleUI(lang);
}

// ===== 초기 언어 복원 =====
function initLang() {
  let lang = 'ko';
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ko' || saved === 'en') lang = saved;
  } catch (_) {}
  setLang(lang);
}

// ===== 언어 토글 핸들러 =====
function toggleLang() {
  setLang(currentLang === 'ko' ? 'en' : 'ko');
}

// ===== 연도 설정 =====
function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async function () {
  setFooterYear();

  const grid = document.getElementById('app-grid');
  if (grid) {
    grid.innerHTML = '<div class="apps-loading"><div class="apps-empty-icon">⏳</div><p>불러오는 중...</p></div>';
  }

  await loadAppsData();
  initLang();

  const langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.addEventListener('click', toggleLang);
});
