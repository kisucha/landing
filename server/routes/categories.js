// Kisucha Studio — 카테고리 라우트
// GET  /api/categories        : 전체 목록 (공개)
// POST /api/categories        : 추가 (인증 필요)
// DELETE /api/categories/:id  : 삭제 (인증 필요)

'use strict';

const express      = require('express');
const { randomUUID } = require('crypto');
const db           = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 전체 카테고리 목록 (공개)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name_ko, name_en, created_at FROM categories ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 카테고리 추가 (인증 필요)
router.post('/', requireAuth, async (req, res) => {
  const { name_ko, name_en } = req.body || {};
  if (!name_ko || !name_en) {
    return res.status(400).json({ error: '이름(한국어, 영어) 모두 필수입니다.' });
  }
  const id = randomUUID();
  try {
    await db.query(
      'INSERT INTO categories (id, name_ko, name_en) VALUES (?, ?, ?)',
      [id, name_ko, name_en]
    );
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 카테고리 삭제 (인증 필요)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
