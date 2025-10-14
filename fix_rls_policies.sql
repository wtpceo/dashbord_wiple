-- RLS (Row Level Security) 정책 수정 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 먼저 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read for all users" ON dashboard_data;
DROP POLICY IF EXISTS "Enable insert for all users" ON dashboard_data;
DROP POLICY IF EXISTS "Enable update for all users" ON dashboard_data;
DROP POLICY IF EXISTS "Enable delete for all users" ON dashboard_data;

-- 2. RLS 비활성화 (임시로 - 테스트용)
ALTER TABLE dashboard_data DISABLE ROW LEVEL SECURITY;

-- 3. 또는 RLS를 활성화하되 모든 작업 허용 (프로덕션용)
-- ALTER TABLE dashboard_data ENABLE ROW LEVEL SECURITY;

-- 4. 모든 사용자에게 모든 권한 부여 (RLS 활성화 시)
-- CREATE POLICY "Allow all operations for all users" ON dashboard_data
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);

-- 5. 테이블 권한 확인 및 설정
GRANT ALL ON dashboard_data TO anon;
GRANT ALL ON dashboard_data TO authenticated;
GRANT ALL ON dashboard_data TO service_role;

-- 6. 현재 데이터 확인
SELECT id,
       jsonb_pretty(data) as data,
       updated_at
FROM dashboard_data
WHERE id = 'default';

-- 7. 테스트 업데이트 (RLS 정책 확인용)
UPDATE dashboard_data
SET data = jsonb_set(
    data,
    '{testField}',
    '"RLS 테스트 성공"'::jsonb
),
updated_at = NOW()
WHERE id = 'default';

-- 8. 업데이트 확인
SELECT id, data->'testField' as test_field, updated_at
FROM dashboard_data
WHERE id = 'default';