-- 월별 스냅샷 테이블 생성
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id TEXT PRIMARY KEY,                    -- "YYYY-MM" 형식 (예: "2025-01")
  year INTEGER NOT NULL,                  -- 연도
  month INTEGER NOT NULL,                 -- 월 (1-12)
  snapshot_date TIMESTAMPTZ NOT NULL,     -- 스냅샷 생성 날짜
  data JSONB NOT NULL,                    -- 대시보드 데이터 (DashboardData 타입)
  created_at TIMESTAMPTZ DEFAULT NOW(),   -- 레코드 생성 시간
  updated_at TIMESTAMPTZ DEFAULT NOW()    -- 레코드 업데이트 시간
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_year_month
  ON monthly_snapshots(year DESC, month DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_snapshot_date
  ON monthly_snapshots(snapshot_date DESC);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Enable read access for all users"
  ON monthly_snapshots
  FOR SELECT
  USING (true);

-- 모든 사용자가 삽입 가능하도록 설정
CREATE POLICY "Enable insert access for all users"
  ON monthly_snapshots
  FOR INSERT
  WITH CHECK (true);

-- 모든 사용자가 업데이트 가능하도록 설정
CREATE POLICY "Enable update access for all users"
  ON monthly_snapshots
  FOR UPDATE
  USING (true);

-- 모든 사용자가 삭제 가능하도록 설정 (관리자용)
CREATE POLICY "Enable delete access for all users"
  ON monthly_snapshots
  FOR DELETE
  USING (true);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_monthly_snapshots_modtime ON monthly_snapshots;
CREATE TRIGGER update_monthly_snapshots_modtime
  BEFORE UPDATE ON monthly_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- 완료 메시지
SELECT 'monthly_snapshots 테이블이 성공적으로 생성되었습니다!' as message;
