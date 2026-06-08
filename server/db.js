// Kisucha Studio — MariaDB 연결 풀
// mysql2/promise 기반 커넥션 풀 싱글톤

'use strict';

const mysql = require('mysql2/promise');

// 환경변수가 없으면 서버 시작 시 에러를 낼 수 있도록 검증
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
required.forEach(key => {
  if (!process.env[key]) {
    console.error(`[DB] 환경변수 누락: ${key} (.env 파일 확인)`);
    process.exit(1);
  }
});

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             parseInt(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:  10,
  charset:          'utf8mb4'
});

module.exports = pool;
