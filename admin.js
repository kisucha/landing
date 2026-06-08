// Kisucha Studio — 관리자 페이지 스크립트
// 자체 Node.js API 서버(/api/*)와 통신하여 앱/카테고리 CRUD 수행
// 인증: JWT (localStorage에 저장, Authorization: Bearer 헤더로 전송)

'use strict';

// JWT 토큰 저장 키 및 초기 로드
const TOKEN_KEY = 'ks-admin-token';
let _token = null;
try { _token = localStorage.getItem(TOKEN_KEY); } catch (_) {}

// 앱/카테고리 캐시 (테이블 재렌더링 시 사용)
let _appsCache = [];
let _catsCache = [];

// ===== XSS 방어 유틸 =====
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s) {
  return String(s ?? '').replace(/"/g, '&quot;');
}

// ===== API 요청 헬퍼 =====
// 인증 헤더 자동 첨부, 401 시 자동 로그아웃 처리
async function apiFetch(path, opts = {}) {
  const isFormData = opts.body instanceof FormData;
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (_token)     headers['Authorization'] = `Bearer ${_token}`;

  if (!isFormData && opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(path, { ...opts, headers });

  // 토큰 만료 시 자동 로그아웃
  if (res.status === 401) {
    _logout();
    throw new Error('인증이 만료되었습니다. 다시 로그인하세요.');
  }
  return res;
}

// JSON 응답 파싱 (실패 시 빈 객체 반환)
async function parseJson(res) {
  try { return await res.json(); } catch { return {}; }
}

// ===== 화면 전환 =====
function showLoginScreen() {
  document.getElementById('login-screen').style.display   = '';
  document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard(label) {
  document.getElementById('login-screen').style.display   = 'none';
  document.getElementById('admin-dashboard').style.display = '';
  const el = document.getElementById('admin-user-email');
  if (el) el.textContent = label || '관리자';
  loadApps();
  loadCategories();
}

// ===== 인증 =====
async function handleLogin(e) {
  e.preventDefault();
  const btn    = document.getElementById('login-submit-btn');
  const errEl  = document.getElementById('login-error');
  const uname  = document.getElementById('login-username').value.trim();
  const passwd = document.getElementById('login-password').value;

  btn.disabled    = true;
  btn.textContent = '로그인 중...';
  errEl.style.display = 'none';

  try {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: uname, password: passwd })
    });
    const data = await parseJson(res);

    if (!res.ok) {
      errEl.textContent   = data.error || '로그인 실패';
      errEl.style.display = '';
      return;
    }
    _token = data.token;
    try { localStorage.setItem(TOKEN_KEY, _token); } catch (_) {}
    showDashboard(uname);
  } catch (err) {
    errEl.textContent   = escHtml(err.message);
    errEl.style.display = '';
  } finally {
    btn.disabled    = false;
    btn.textContent = '로그인';
  }
}

function _logout() {
  _token = null;
  try { localStorage.removeItem(TOKEN_KEY); } catch (_) {}
  showLoginScreen();
}

// ===== 앱 목록 로드 =====
async function loadApps() {
  const wrap = document.getElementById('apps-table-wrap');
  wrap.innerHTML = '<p class="loading-text">불러오는 중...</p>';
  try {
    const res  = await apiFetch('/api/apps');
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.error || '불러오기 실패');
    _appsCache = data;
    renderAppsTable(data);
  } catch (err) {
    wrap.innerHTML = `<p class="error-text">오류: ${escHtml(err.message)}</p>`;
  }
}

// 앱 목록 테이블 렌더링
function renderAppsTable(apps) {
  const wrap = document.getElementById('apps-table-wrap');
  if (!apps.length) {
    wrap.innerHTML = '<p class="empty-text">등록된 앱이 없습니다.</p>';
    return;
  }

  let html = `<table class="admin-table"><thead><tr>
    <th>아이콘</th><th>이름</th><th>카테고리</th><th>플랫폼</th><th>상태</th><th>순서</th><th>작업</th>
  </tr></thead><tbody>`;

  apps.forEach((app, i) => {
    const iconHtml = app.icon_url
      ? `<img src="${escAttr(app.icon_url)}" alt="아이콘" class="table-icon">`
      : `<span class="table-icon-placeholder">📦</span>`;
    const platforms = Array.isArray(app.platforms) ? app.platforms.join(', ') : '';
    const catName   = app.categories ? escHtml(app.categories.name_ko || '') : '-';
    const badge     = app.status === 'released'
      ? '<span class="status-badge released">출시됨</span>'
      : '<span class="status-badge coming-soon">출시 예정</span>';

    html += `<tr>
      <td>${iconHtml}</td>
      <td><strong>${escHtml(app.name_ko)}</strong><br><small>${escHtml(app.name_en)}</small></td>
      <td>${catName}</td>
      <td>${escHtml(platforms)}</td>
      <td>${badge}</td>
      <td>${app.sort_order}</td>
      <td>
        <button class="btn btn-sm btn-ghost" data-action="edit" data-idx="${i}">수정</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${escAttr(app.id)}">삭제</button>
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;

  // 이벤트 위임으로 XSS-safe 클릭 처리
  wrap.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editApp(_appsCache[parseInt(btn.dataset.idx)]));
  });
  wrap.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteApp(btn.dataset.id));
  });
}

// ===== 앱 폼 조작 =====

// 수정 모드로 폼 채우기
function editApp(app) {
  document.getElementById('editing-app-id').value        = app.id;
  document.getElementById('form-title').textContent      = '앱 수정';
  document.getElementById('app-submit-btn').textContent  = '저장';
  document.getElementById('app-cancel-btn').style.display = '';

  document.getElementById('f-name-ko').value     = app.name_ko || '';
  document.getElementById('f-name-en').value     = app.name_en || '';
  document.getElementById('f-desc-ko').value     = app.desc_ko || '';
  document.getElementById('f-desc-en').value     = app.desc_en || '';
  document.getElementById('f-category').value    = app.category_id || '';
  document.getElementById('f-status').value      = app.status || 'coming-soon';
  document.getElementById('f-link-gplay').value  = app.link_google_play || '';
  document.getElementById('f-link-astore').value = app.link_app_store || '';
  document.getElementById('f-link-ms').value     = app.link_ms_store || '';
  document.getElementById('f-sort-order').value  = app.sort_order ?? 0;

  // 플랫폼 체크박스
  document.querySelectorAll('input[name="platforms"]').forEach(cb => {
    cb.checked = Array.isArray(app.platforms) && app.platforms.includes(cb.value);
  });

  // 현재 아이콘 링크 표시
  const iconWrap = document.getElementById('current-icon-wrap');
  if (app.icon_url) {
    document.getElementById('current-icon-link').href = app.icon_url;
    iconWrap.style.display = '';
    document.getElementById('remove-icon-check').checked = false;
  } else {
    iconWrap.style.display = 'none';
  }

  document.getElementById('icon-preview').style.display = 'none';
  switchTab('app-form');
}

// 폼 초기화 (등록 모드로 복귀)
function resetAppForm() {
  document.getElementById('editing-app-id').value = '';
  document.getElementById('form-title').textContent = '앱 등록';
  document.getElementById('app-submit-btn').textContent = '등록';
  document.getElementById('app-cancel-btn').style.display = 'none';
  document.getElementById('app-form-element').reset();
  document.getElementById('icon-preview').style.display = 'none';
  document.getElementById('current-icon-wrap').style.display = 'none';
}

// 앱 등록/수정 폼 제출
async function handleAppSubmit(e) {
  e.preventDefault();
  const btn       = document.getElementById('app-submit-btn');
  const editingId = document.getElementById('editing-app-id').value;

  const platforms = [...document.querySelectorAll('input[name="platforms"]:checked')]
    .map(cb => cb.value);

  const payload = {
    name_ko:          document.getElementById('f-name-ko').value.trim(),
    name_en:          document.getElementById('f-name-en').value.trim(),
    desc_ko:          document.getElementById('f-desc-ko').value.trim(),
    desc_en:          document.getElementById('f-desc-en').value.trim(),
    category_id:      document.getElementById('f-category').value || null,
    status:           document.getElementById('f-status').value,
    platforms,
    link_google_play: document.getElementById('f-link-gplay').value.trim(),
    link_app_store:   document.getElementById('f-link-astore').value.trim(),
    link_ms_store:    document.getElementById('f-link-ms').value.trim(),
    sort_order:       parseInt(document.getElementById('f-sort-order').value) || 0
  };

  if (!payload.name_ko || !payload.name_en) {
    showNotification('앱 이름(한국어, 영어)은 필수입니다.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = '저장 중...';

  try {
    let appId = editingId;

    if (editingId) {
      const res  = await apiFetch(`/api/apps/${editingId}`, { method: 'PUT', body: payload });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || '수정 실패');
    } else {
      const res  = await apiFetch('/api/apps', { method: 'POST', body: payload });
      const data = await parseJson(res);
      if (!res.ok) throw new Error(data.error || '등록 실패');
      appId = data.id;
    }

    // 아이콘 처리
    const iconFile   = document.getElementById('f-icon').files[0];
    const removeIcon = document.getElementById('remove-icon-check').checked;

    if (removeIcon && editingId) {
      await apiFetch(`/api/apps/${appId}/icon`, { method: 'DELETE' });
    } else if (iconFile) {
      const fd = new FormData();
      fd.append('icon', iconFile);
      const iconRes  = await apiFetch(`/api/apps/${appId}/icon`, { method: 'POST', body: fd });
      const iconData = await parseJson(iconRes);
      if (!iconRes.ok) throw new Error(iconData.error || '아이콘 업로드 실패');
    }

    showNotification(editingId ? '앱이 수정되었습니다.' : '앱이 등록되었습니다.', 'success');
    resetAppForm();
    switchTab('apps-list');
    await loadApps();
  } catch (err) {
    showNotification(`오류: ${escHtml(err.message)}`, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = editingId ? '저장' : '등록';
  }
}

// 앱 삭제
async function deleteApp(id) {
  if (!confirm('앱을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
  try {
    const res  = await apiFetch(`/api/apps/${id}`, { method: 'DELETE' });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.error || '삭제 실패');
    showNotification('앱이 삭제되었습니다.', 'success');
    await loadApps();
  } catch (err) {
    showNotification(`오류: ${escHtml(err.message)}`, 'error');
  }
}

// ===== 카테고리 =====
async function loadCategories() {
  const wrap = document.getElementById('categories-list-wrap');
  wrap.innerHTML = '<p class="loading-text">불러오는 중...</p>';
  try {
    const res  = await apiFetch('/api/categories');
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.error || '불러오기 실패');
    _catsCache = data;
    renderCategoriesList(data);
    updateCategorySelect(data);
  } catch (err) {
    wrap.innerHTML = `<p class="error-text">오류: ${escHtml(err.message)}</p>`;
  }
}

function renderCategoriesList(cats) {
  const wrap = document.getElementById('categories-list-wrap');
  if (!cats.length) {
    wrap.innerHTML = '<p class="empty-text">등록된 카테고리가 없습니다.</p>';
    return;
  }

  let html = `<table class="admin-table"><thead><tr>
    <th>이름 (한국어)</th><th>Name (English)</th><th>작업</th>
  </tr></thead><tbody>`;

  cats.forEach(cat => {
    html += `<tr>
      <td>${escHtml(cat.name_ko)}</td>
      <td>${escHtml(cat.name_en)}</td>
      <td><button class="btn btn-sm btn-danger" data-action="delete-cat" data-id="${escAttr(cat.id)}">삭제</button></td>
    </tr>`;
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;

  wrap.querySelectorAll('[data-action="delete-cat"]').forEach(btn => {
    btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
  });
}

function updateCategorySelect(cats) {
  const sel     = document.getElementById('f-category');
  const current = sel.value;
  sel.innerHTML = '<option value="">선택 안 함</option>';
  cats.forEach(cat => {
    const opt       = document.createElement('option');
    opt.value       = cat.id;
    opt.textContent = `${cat.name_ko} / ${cat.name_en}`;
    sel.appendChild(opt);
  });
  sel.value = current; // 수정 모드에서 기존 선택값 유지
}

async function handleCategorySubmit(e) {
  e.preventDefault();
  const nameKo = document.getElementById('c-name-ko').value.trim();
  const nameEn = document.getElementById('c-name-en').value.trim();
  if (!nameKo || !nameEn) {
    showNotification('이름(한국어, 영어) 모두 필수입니다.', 'error');
    return;
  }
  try {
    const res  = await apiFetch('/api/categories', {
      method: 'POST', body: { name_ko: nameKo, name_en: nameEn }
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.error || '추가 실패');
    showNotification('카테고리가 추가되었습니다.', 'success');
    document.getElementById('category-form').reset();
    await loadCategories();
  } catch (err) {
    showNotification(`오류: ${escHtml(err.message)}`, 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('카테고리를 삭제하시겠습니까?')) return;
  try {
    const res  = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(data.error || '삭제 실패');
    showNotification('카테고리가 삭제되었습니다.', 'success');
    await loadCategories();
  } catch (err) {
    showNotification(`오류: ${escHtml(err.message)}`, 'error');
  }
}

// ===== 탭 전환 =====
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(sec => {
    sec.classList.toggle('active', sec.id === tabId);
  });
}

// ===== 알림 토스트 =====
let _notifTimer = null;
function showNotification(msg, type = 'success') {
  const el       = document.getElementById('notification');
  el.textContent = msg;
  el.className   = `notification ${type}`;
  el.style.display = '';
  if (_notifTimer) clearTimeout(_notifTimer);
  _notifTimer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ===== 아이콘 파일 미리보기 =====
function initIconPreview() {
  document.getElementById('f-icon').addEventListener('change', e => {
    const file    = e.target.files[0];
    const preview = document.getElementById('icon-preview');
    if (!file) { preview.style.display = 'none'; return; }
    const reader  = new FileReader();
    reader.onload = ev => {
      document.getElementById('icon-preview-img').src = ev.target.result;
      preview.style.display = '';
    };
    reader.readAsDataURL(file);
  });
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  // 로그인 폼
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // 로그아웃 버튼
  document.getElementById('logout-btn').addEventListener('click', _logout);

  // 탭 버튼들
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 앱 등록 버튼 (목록 탭 상단)
  document.getElementById('goto-add-btn').addEventListener('click', () => {
    resetAppForm();
    switchTab('app-form');
  });

  // 앱 폼 제출 / 취소
  document.getElementById('app-form-element').addEventListener('submit', handleAppSubmit);
  document.getElementById('app-cancel-btn').addEventListener('click', () => {
    resetAppForm();
    switchTab('apps-list');
  });

  // 카테고리 폼
  document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);

  // 아이콘 미리보기
  initIconPreview();

  // 토큰 있으면 대시보드 바로 표시
  // 만료된 토큰은 첫 API 호출에서 401 → _logout() 자동 처리
  if (_token) {
    showDashboard('관리자');
  } else {
    showLoginScreen();
  }
});
