// 직접 Supabase 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 환경 변수 확인');
console.log('URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
console.log('KEY:', supabaseKey ? '✅ 설정됨' : '❌ 없음');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 없습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('\n📋 1. 테이블 존재 확인');
  try {
    const { data, error, status, statusText } = await supabase
      .from('dashboard_data')
      .select('id')
      .limit(1);

    console.log('상태 코드:', status);
    console.log('상태 텍스트:', statusText);

    if (error) {
      console.error('❌ 에러:', error);
      console.log('에러 코드:', error.code);
      console.log('에러 메시지:', error.message);
      console.log('에러 힌트:', error.hint);
    } else {
      console.log('✅ 테이블 접근 성공');
      console.log('데이터:', data);
    }
  } catch (e) {
    console.error('❌ 예외:', e.message);
  }

  console.log('\n📝 2. 데이터 저장 테스트');
  try {
    const testData = {
      id: 'default',
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        message: '직접 테스트'
      },
      updated_at: new Date().toISOString()
    };

    const { data, error, status } = await supabase
      .from('dashboard_data')
      .upsert(testData)
      .select();

    console.log('상태 코드:', status);

    if (error) {
      console.error('❌ 저장 에러:', error);
      console.log('전체 에러 객체:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ 저장 성공');
      if (data && data.length > 0) {
        console.log('저장된 ID:', data[0].id);
      }
    }
  } catch (e) {
    console.error('❌ 예외:', e.message);
  }

  console.log('\n🔍 3. RLS 상태 확인');
  try {
    // RLS 상태를 직접 확인하는 쿼리
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: 'dashboard_data' })
      .single();

    if (!error && data) {
      console.log('RLS 상태:', data);
    } else {
      console.log('ℹ️ RLS 상태 확인 불가 (정상일 수 있음)');
    }
  } catch (e) {
    // RPC 함수가 없을 수 있음
  }

  console.log('\n✅ 테스트 완료');
  console.log('\n💡 해결 방법:');
  console.log('1. Supabase 대시보드 접속: https://supabase.com/dashboard');
  console.log('2. Table Editor → dashboard_data 테이블 선택');
  console.log('3. RLS Policies 탭 → Disable RLS 클릭');
  console.log('4. 또는 SQL Editor에서 다음 실행:');
  console.log('   ALTER TABLE dashboard_data DISABLE ROW LEVEL SECURITY;');
}

test();