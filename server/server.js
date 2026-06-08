// Kisucha Studio — Express 메인 서버
// 정적 프론트엔드 파일 서빙 + /api/* REST 엔드포인트
// 실행: node server.js  (포트: PORT 환경변수 또는 3000)

'use strict';

require('dotenv').config();

const express = require('express');
const path    = require('path');

// 필수 환경변수 확인
['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'].forEach(key => {
  if (!process.env[key]) {
    console.error(`[Server] 환경변수 누락: ${key} — .env 파일을 확인하세요.`);
    process.exit(1);
  }
});

const app = express();

// ===== 미들웨어 =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== server/ 디렉토리 및 .env 파일 접근 차단 =====
// Node.js 소스와 환경설정이 브라우저에 노출되지 않도록 보호
app.use((req, res, next) => {
  const p = req.path;
  if (
    p.startsWith('/server/') ||
    p === '/.env' ||
    p.endsWith('.env')
  ) {
    return res.status(404).end();
  }
  next();
});

// ===== API 라우트 =====
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/apps',       require('./routes/apps'));
app.use('/api/categories', require('./routes/categories'));

// API 경로에서 404 처리 (HTML 대신 JSON 반환)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ===== 정적 파일 서빙 (프론트엔드) =====
const STATIC_ROOT = path.join(__dirname, '..');
app.use(express.static(STATIC_ROOT, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
  }
}));

// /admin → admin.html 직접 라우팅
app.get('/admin', (req, res) => {
  res.sendFile(path.join(STATIC_ROOT, 'admin.html'));
});

// 그 외 경로 → index.html (SPA 지원)
app.get('*', (req, res) => {
  res.sendFile(path.join(STATIC_ROOT, 'index.html'));
});

// ===== 서버 시작 =====
const PORT = parseInt(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kisucha Studio 서버 실행 중`);
  console.log(`  로컬:    http://localhost:${PORT}`);
  console.log(`  네트워크: http://192.168.20.80:${PORT}`);
});
