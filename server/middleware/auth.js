// Kisucha Studio — JWT 인증 미들웨어
// Authorization: Bearer <token> 헤더를 검증하여 보호된 라우트에 사용

'use strict';

const jwt = require('jsonwebtoken');

/**
 * requireAuth: JWT 토큰 검증 미들웨어
 * 유효하지 않거나 없으면 401 반환
 */
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  try {
    jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '토큰이 유효하지 않거나 만료되었습니다.' });
  }
}

module.exports = { requireAuth };
