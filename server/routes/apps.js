// Kisucha Studio — 앱 라우트
// GET    /api/apps           : 전체 목록 (공개, 카테고리 포함)
// POST   /api/apps           : 앱 등록 (인증 필요)
// PUT    /api/apps/:id       : 앱 수정 (인증 필요)
// DELETE /api/apps/:id       : 앱 삭제 (인증 필요)
// GET    /api/apps/:id/icon  : 아이콘 이미지 서빙 (공개)
// POST   /api/apps/:id/icon  : 아이콘 업로드 (인증 필요)
// DELETE /api/apps/:id/icon  : 아이콘 제거 (인증 필요)

'use strict';

const express        = require('express');
const multer         = require('multer');
const { randomUUID } = require('crypto');
const db             = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 메모리 버퍼 저장 (BLOB으로 DB에 저장하므로 디스크 불필요)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 }, // 최대 2MB
  fileFilter(req, file, cb) {
    // 이미지 파일만 허용
    cb(null, file.mimetype.startsWith('image/'));
  }
});

// ===== 앱 목록 (공개) =====
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.id, a.name_ko, a.name_en, a.desc_ko, a.desc_en,
        a.category_id, a.status, a.platforms,
        a.link_google_play, a.link_app_store, a.link_ms_store,
        a.sort_order,
        CASE WHEN a.icon_data IS NOT NULL
             THEN CONCAT('/api/apps/', a.id, '/icon')
             ELSE NULL END AS icon_url,
        c.name_ko AS cat_name_ko,
        c.name_en AS cat_name_en
      FROM apps a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.sort_order ASC, a.created_at ASC
    `);

    const apps = rows.map(row => ({
      id:              row.id,
      name_ko:         row.name_ko,
      name_en:         row.name_en,
      desc_ko:         row.desc_ko  || '',
      desc_en:         row.desc_en  || '',
      category_id:     row.category_id,
      categories:      row.category_id
                         ? { name_ko: row.cat_name_ko, name_en: row.cat_name_en }
                         : null,
      icon_url:        row.icon_url,
      status:          row.status,
      platforms:       safeParsePlatforms(row.platforms),
      link_google_play: row.link_google_play || '',
      link_app_store:  row.link_app_store   || '',
      link_ms_store:   row.link_ms_store    || '',
      sort_order:      row.sort_order
    }));

    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 아이콘 이미지 서빙 (공개) =====
router.get('/:id/icon', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT icon_data, icon_mime FROM apps WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length || !rows[0].icon_data) return res.status(404).end();
    res.set('Content-Type', rows[0].icon_mime || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(rows[0].icon_data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 앱 등록 (인증 필요) =====
router.post('/', requireAuth, async (req, res) => {
  const id = randomUUID();
  const fields = extractFields(req.body);
  if (!fields.name_ko || !fields.name_en) {
    return res.status(400).json({ error: '앱 이름(한/영)은 필수입니다.' });
  }
  try {
    await db.query(
      `INSERT INTO apps
        (id, name_ko, name_en, desc_ko, desc_en, category_id, status,
         platforms, link_google_play, link_app_store, link_ms_store, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        fields.name_ko, fields.name_en,
        fields.desc_ko, fields.desc_en,
        fields.category_id,
        fields.status,
        JSON.stringify(fields.platforms),
        fields.link_google_play, fields.link_app_store, fields.link_ms_store,
        fields.sort_order
      ]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 앱 수정 (인증 필요) =====
router.put('/:id', requireAuth, async (req, res) => {
  const fields = extractFields(req.body);
  if (!fields.name_ko || !fields.name_en) {
    return res.status(400).json({ error: '앱 이름(한/영)은 필수입니다.' });
  }
  try {
    const [result] = await db.query(
      `UPDATE apps SET
        name_ko=?, name_en=?, desc_ko=?, desc_en=?, category_id=?, status=?,
        platforms=?, link_google_play=?, link_app_store=?, link_ms_store=?, sort_order=?
       WHERE id=?`,
      [
        fields.name_ko, fields.name_en,
        fields.desc_ko, fields.desc_en,
        fields.category_id,
        fields.status,
        JSON.stringify(fields.platforms),
        fields.link_google_play, fields.link_app_store, fields.link_ms_store,
        fields.sort_order,
        req.params.id
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: '앱을 찾을 수 없습니다.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 앱 삭제 (인증 필요) =====
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM apps WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 아이콘 업로드 (인증 필요) =====
router.post('/:id/icon', requireAuth, upload.single('icon'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '이미지 파일이 없습니다.' });
  try {
    await db.query(
      'UPDATE apps SET icon_data=?, icon_mime=? WHERE id=?',
      [req.file.buffer, req.file.mimetype, req.params.id]
    );
    res.json({ icon_url: `/api/apps/${req.params.id}/icon` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 아이콘 제거 (인증 필요) =====
router.delete('/:id/icon', requireAuth, async (req, res) => {
  try {
    await db.query(
      'UPDATE apps SET icon_data=NULL, icon_mime=NULL WHERE id=?',
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== 헬퍼 =====

// JSON platforms 필드 안전 파싱
function safeParsePlatforms(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

// 폼 데이터에서 앱 필드 추출 + 타입 정리
function extractFields(body = {}) {
  return {
    name_ko:          String(body.name_ko || '').trim(),
    name_en:          String(body.name_en || '').trim(),
    desc_ko:          String(body.desc_ko || '').trim(),
    desc_en:          String(body.desc_en || '').trim(),
    category_id:      body.category_id || null,
    status:           body.status === 'released' ? 'released' : 'coming-soon',
    platforms:        Array.isArray(body.platforms) ? body.platforms : [],
    link_google_play: String(body.link_google_play || '').trim(),
    link_app_store:   String(body.link_app_store   || '').trim(),
    link_ms_store:    String(body.link_ms_store    || '').trim(),
    sort_order:       parseInt(body.sort_order) || 0
  };
}

module.exports = router;
