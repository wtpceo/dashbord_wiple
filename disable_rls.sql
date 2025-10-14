-- RLS 완전 비활성화 및 권한 설정
-- Supabase SQL Editor에서 실행하세요

-- 1. RLS 비활성화
ALTER TABLE dashboard_data DISABLE ROW LEVEL SECURITY;

-- 2. 모든 사용자에게 전체 권한 부여
GRANT ALL ON dashboard_data TO anon;
GRANT ALL ON dashboard_data TO authenticated;
GRANT ALL ON dashboard_data TO service_role;
GRANT ALL ON dashboard_data TO postgres;

-- 3. 기존 정책 모두 삭제 (있을 경우)
DROP POLICY IF EXISTS "Enable read for all users" ON dashboard_data;
DROP POLICY IF EXISTS "Enable insert for all users" ON dashboard_data;
DROP POLICY IF EXISTS "Enable update for all users" ON dashboard_data;
DROP POLICY IF EXISTS "Enable delete for all users" ON dashboard_data;
DROP POLICY IF EXISTS "Allow all operations for all users" ON dashboard_data;

-- 4. 테이블 상태 확인
SELECT
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables
WHERE tablename = 'dashboard_data';

-- 5. 현재 데이터 확인
SELECT
    id,
    data->'targetRevenue' as target_revenue,
    jsonb_array_length(data->'aeData') as ae_count,
    jsonb_array_length(data->'salesData') as sales_count,
    updated_at
FROM dashboard_data
WHERE id = 'default';

-- 6. 테스트 업데이트
UPDATE dashboard_data
SET
    updated_at = NOW()
WHERE id = 'default'
RETURNING id, updated_at;

-- 결과 확인 메시지
SELECT 'RLS 비활성화 완료! 이제 모든 사용자가 데이터를 읽고 쓸 수 있습니다.' as message;