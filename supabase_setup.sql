-- Supabase 테이블 생성 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- dashboard_data 테이블 생성 (없는 경우에만)
CREATE TABLE IF NOT EXISTS dashboard_data (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS (Row Level Security) 비활성화 - 모든 사용자가 읽고 쓸 수 있도록
ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 추가
CREATE POLICY "Enable read access for all users" ON dashboard_data
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 모든 사용자가 쓸 수 있도록 정책 추가
CREATE POLICY "Enable insert for all users" ON dashboard_data
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 모든 사용자가 업데이트할 수 있도록 정책 추가
CREATE POLICY "Enable update for all users" ON dashboard_data
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 초기 데이터 삽입 (없는 경우에만)
INSERT INTO dashboard_data (id, data)
VALUES ('default', '{
  "targetRevenue": 300000000,
  "lastMonthRevenue": {
    "total": 245000000,
    "byChannel": [
      {"channel": "토탈 마케팅", "value": 95000000},
      {"channel": "퍼포먼스", "value": 80000000},
      {"channel": "배달관리", "value": 45000000},
      {"channel": "브랜드블로그", "value": 25000000}
    ]
  },
  "currentMonthRevenue": {
    "total": 0,
    "byChannel": [
      {"channel": "토탈 마케팅", "value": 0},
      {"channel": "퍼포먼스", "value": 0},
      {"channel": "배달관리", "value": 0},
      {"channel": "브랜드블로그", "value": 0}
    ]
  },
  "totalClients": {
    "total": 0,
    "byChannel": [
      {"channel": "토탈 마케팅", "value": 0},
      {"channel": "퍼포먼스", "value": 0},
      {"channel": "배달관리", "value": 0},
      {"channel": "브랜드블로그", "value": 0}
    ]
  },
  "nextMonthExpiring": {
    "total": 0,
    "byChannel": [
      {"channel": "토탈 마케팅", "value": 0},
      {"channel": "퍼포먼스", "value": 0},
      {"channel": "배달관리", "value": 0},
      {"channel": "브랜드블로그", "value": 0}
    ]
  },
  "currentMonthExpiring": {
    "total": 0,
    "byChannel": [
      {"channel": "토탈 마케팅", "value": 0},
      {"channel": "퍼포먼스", "value": 0},
      {"channel": "배달관리", "value": 0},
      {"channel": "브랜드블로그", "value": 0}
    ]
  },
  "lastMonthRenewal": {
    "count": 32,
    "revenue": 89000000,
    "rate": 78.5,
    "byChannel": [
      {"channel": "토탈 마케팅", "count": 12, "revenue": 35000000, "rate": 80.0},
      {"channel": "퍼포먼스", "count": 10, "revenue": 28000000, "rate": 76.9},
      {"channel": "배달관리", "count": 7, "revenue": 18000000, "rate": 77.8},
      {"channel": "브랜드블로그", "count": 3, "revenue": 8000000, "rate": 75.0}
    ]
  },
  "currentMonthRenewal": {
    "count": 0,
    "revenue": 0,
    "rate": 0,
    "byChannel": [
      {"channel": "토탈 마케팅", "count": 0, "revenue": 0, "rate": 0},
      {"channel": "퍼포먼스", "count": 0, "revenue": 0, "rate": 0},
      {"channel": "배달관리", "count": 0, "revenue": 0, "rate": 0},
      {"channel": "브랜드블로그", "count": 0, "revenue": 0, "rate": 0}
    ]
  },
  "lastMonthNewClients": {
    "total": 18,
    "byChannel": [
      {"channel": "토탈 마케팅", "value": 6},
      {"channel": "퍼포먼스", "value": 7},
      {"channel": "배달관리", "value": 3},
      {"channel": "브랜드블로그", "value": 2}
    ]
  },
  "currentMonthNewClients": {
    "total": 0,
    "byChannel": [
      {"channel": "토탈 마케팅", "value": 0},
      {"channel": "퍼포먼스", "value": 0},
      {"channel": "배달관리", "value": 0},
      {"channel": "브랜드블로그", "value": 0}
    ]
  },
  "aeData": [
    {"name": "이수빈", "clientCount": 35, "weeklyReports": []},
    {"name": "최호천", "clientCount": 32, "weeklyReports": []},
    {"name": "조아라", "clientCount": 31, "weeklyReports": []},
    {"name": "정우진", "clientCount": 30, "weeklyReports": []},
    {"name": "김민우", "clientCount": 28, "weeklyReports": []},
    {"name": "양주미", "clientCount": 27, "weeklyReports": []}
  ],
  "salesData": [
    {"name": "박현수", "weeklyReports": []},
    {"name": "박은수", "weeklyReports": []}
  ]
}')
ON CONFLICT (id) DO NOTHING;

-- 트리거 함수: 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 존재하는 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_dashboard_data_updated_at'
  ) THEN
    CREATE TRIGGER update_dashboard_data_updated_at
    BEFORE UPDATE ON dashboard_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- 테이블 권한 설정
GRANT ALL ON dashboard_data TO anon, authenticated;

-- 실시간 기능 활성화 (Realtime)
-- Supabase Dashboard에서도 활성화 가능: Database > Replication > dashboard_data 테이블 선택
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_data;