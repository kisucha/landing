-- Kisucha Studio — MariaDB 스키마
-- 실행: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS kisucha_studio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kisucha_studio;

-- ===== categories 테이블 =====
CREATE TABLE IF NOT EXISTS categories (
  id         CHAR(36)     NOT NULL,
  name_ko    VARCHAR(100) NOT NULL,
  name_en    VARCHAR(100) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== apps 테이블 =====
CREATE TABLE IF NOT EXISTS apps (
  id               CHAR(36)     NOT NULL,
  name_ko          VARCHAR(200) NOT NULL,
  name_en          VARCHAR(200) NOT NULL,
  desc_ko          TEXT,
  desc_en          TEXT,
  category_id      CHAR(36)     DEFAULT NULL,
  icon_data        LONGBLOB,
  icon_mime        VARCHAR(50)  DEFAULT NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'coming-soon',
  platforms        JSON,
  link_google_play VARCHAR(500) DEFAULT '',
  link_app_store   VARCHAR(500) DEFAULT '',
  link_ms_store    VARCHAR(500) DEFAULT '',
  sort_order       INT          NOT NULL DEFAULT 0,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_apps_category
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== 기존 앱 3개 시드 데이터 =====
INSERT INTO apps (id, name_ko, name_en, desc_ko, desc_en, status, platforms, sort_order) VALUES
  (UUID(),
   '타이머 프로', 'Timer Pro',
   '심플하고 집중에 방해 없는 인터벌 타이머. 운동, 공부, 생산성 루틴에 최적화.',
   'A clean, distraction-free interval timer. Perfect for workouts, study sessions, and productivity routines.',
   'coming-soon', '["android","ios"]', 1),
  (UUID(),
   '빠른 메모', 'QuickNote',
   '마찰 제로의 즉각 메모. 열고, 쓰고, 끝. 계정 없음, 동기화 없음, 방해 없음.',
   'Instant note-taking with zero friction. Open, type, done. No accounts, no sync, no distractions.',
   'coming-soon', '["android","ios","windows"]', 2),
  (UUID(),
   '단위 변환기', 'UnitSwap',
   '일상 단위 변환기 - 길이, 무게, 온도, 환율 등을 빠르게 변환.',
   'Fast unit converter for everyday needs - length, weight, temperature, currency, and more.',
   'coming-soon', '["android","ios","windows"]', 3);
