-- Kisucha Studio — Supabase Database Schema
-- Supabase 대시보드 > SQL Editor에서 실행

-- uuid-ossp 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== categories 테이블 =====
CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ko    text NOT NULL,
  name_en    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- categories RLS 활성화
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

-- 인증된 사용자만 쓰기 (관리자)
CREATE POLICY "categories_auth_all"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

-- ===== apps 테이블 =====
CREATE TABLE IF NOT EXISTS apps (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ko           text NOT NULL,
  name_en           text NOT NULL,
  desc_ko           text,
  desc_en           text,
  category_id       uuid REFERENCES categories(id) ON DELETE SET NULL,
  icon_url          text,
  status            text NOT NULL DEFAULT 'coming-soon'
                    CHECK (status IN ('released', 'coming-soon')),
  platforms         text[] NOT NULL DEFAULT '{}',
  link_google_play  text,
  link_app_store    text,
  link_ms_store     text,
  sort_order        int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- apps RLS 활성화
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- 공개 읽기
CREATE POLICY "apps_public_read"
  ON apps FOR SELECT
  USING (true);

-- 인증된 사용자만 쓰기 (관리자)
CREATE POLICY "apps_auth_all"
  ON apps FOR ALL
  USING (auth.role() = 'authenticated');

-- ===== Storage 버킷 설정 =====
-- Supabase 대시보드 > Storage에서 직접 생성:
--   버킷명: app-icons
--   Public 버킷 체크
-- 또는 아래 SQL 실행 (Storage API 활성화 필요):
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('app-icons', 'app-icons', true)
--   ON CONFLICT DO NOTHING;

-- Storage RLS (app-icons 버킷)
-- 공개 읽기
-- CREATE POLICY "app_icons_public_read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'app-icons');

-- 인증된 사용자만 업로드/삭제
-- CREATE POLICY "app_icons_auth_write"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'app-icons' AND auth.role() = 'authenticated');

-- CREATE POLICY "app_icons_auth_delete"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'app-icons' AND auth.role() = 'authenticated');

-- ===== 초기 데이터 마이그레이션 (기존 3개 앱) =====
INSERT INTO apps (name_ko, name_en, desc_ko, desc_en, status, platforms, sort_order)
VALUES
  (
    '타이머 프로', 'Timer Pro',
    '심플하고 집중에 방해 없는 인터벌 타이머. 운동, 공부, 생산성 루틴에 최적화.',
    'A clean, distraction-free interval timer. Perfect for workouts, study sessions, and productivity routines.',
    'coming-soon', ARRAY['android', 'ios'], 0
  ),
  (
    '빠른 메모', 'QuickNote',
    '마찰 제로의 즉각 메모. 열고, 쓰고, 끝. 계정 없음, 동기화 없음, 방해 없음.',
    'Instant note-taking with zero friction. Open, type, done. No accounts, no sync, no distractions.',
    'coming-soon', ARRAY['android', 'ios', 'windows'], 1
  ),
  (
    '단위 변환기', 'UnitSwap',
    '일상 단위 변환기 — 길이, 무게, 온도, 환율 등을 빠르게 변환.',
    'Fast unit converter for everyday needs — length, weight, temperature, currency, and more.',
    'coming-soon', ARRAY['android', 'ios', 'windows'], 2
  )
ON CONFLICT DO NOTHING;
