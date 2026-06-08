// Kisucha Studio — PM2 프로세스 설정
// 사용법: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [{
    name:    'kisucha-studio',
    script:  './server.js',
    cwd:     '/opt/landing/server',
    instances: 1,
    autorestart: true,
    watch:   false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
