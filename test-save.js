// Supabase 데이터 저장 테스트 스크립트
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 로드
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 테스트 데이터
const testData = {
  targetRevenue: 300000000,
  lastMonthRevenue: {
    total: 245000000,
    byChannel: [
      { channel: '토탈 마케팅', value: 95000000 },
      { channel: '퍼포먼스', value: 80000000 },
      { channel: '배달관리', value: 45000000 },
      { channel: '브랜드블로그', value: 25000000 },
    ],
  },
  currentMonthRevenue: {
    total: 0,
    byChannel: [
      { channel: '토탈 마케팅', value: 0 },
      { channel: '퍼포먼스', value: 0 },
      { channel: '배달관리', value: 0 },
      { channel: '브랜드블로그', value: 0 },
    ],
  },
  totalClients: {
    total: 0,
    byChannel: [
      { channel: '토탈 마케팅', value: 0 },
      { channel: '퍼포먼스', value: 0 },
      { channel: '배달관리', value: 0 },
      { channel: '브랜드블로그', value: 0 },
    ],
  },
  nextMonthExpiring: {
    total: 0,
    byChannel: [
      { channel: '토탈 마케팅', value: 0 },
      { channel: '퍼포먼스', value: 0 },
      { channel: '배달관리', value: 0 },
      { channel: '브랜드블로그', value: 0 },
    ],
  },
  currentMonthExpiring: {
    total: 0,
    byChannel: [
      { channel: '토탈 마케팅', value: 0 },
      { channel: '퍼포먼스', value: 0 },
      { channel: '배달관리', value: 0 },
      { channel: '브랜드블로그', value: 0 },
    ],
  },
  lastMonthRenewal: {
    count: 32,
    revenue: 89000000,
    rate: 78.5,
    byChannel: [
      { channel: '토탈 마케팅', count: 12, revenue: 35000000, rate: 80.0 },
      { channel: '퍼포먼스', count: 10, revenue: 28000000, rate: 76.9 },
      { channel: '배달관리', count: 7, revenue: 18000000, rate: 77.8 },
      { channel: '브랜드블로그', count: 3, revenue: 8000000, rate: 75.0 },
    ],
  },
  currentMonthRenewal: {
    count: 0,
    revenue: 0,
    rate: 0,
    byChannel: [
      { channel: '토탈 마케팅', count: 0, revenue: 0, rate: 0 },
      { channel: '퍼포먼스', count: 0, revenue: 0, rate: 0 },
      { channel: '배달관리', count: 0, revenue: 0, rate: 0 },
      { channel: '브랜드블로그', count: 0, revenue: 0, rate: 0 },
    ],
  },
  lastMonthNewClients: {
    total: 18,
    byChannel: [
      { channel: '토탈 마케팅', value: 6 },
      { channel: '퍼포먼스', value: 7 },
      { channel: '배달관리', value: 3 },
      { channel: '브랜드블로그', value: 2 },
    ],
  },
  currentMonthNewClients: {
    total: 0,
    byChannel: [
      { channel: '토탈 마케팅', value: 0 },
      { channel: '퍼포먼스', value: 0 },
      { channel: '배달관리', value: 0 },
      { channel: '브랜드블로그', value: 0 },
    ],
  },
  aeData: [
    { name: '이수빈', clientCount: 35, weeklyReports: [] },
    { name: '최호천', clientCount: 32, weeklyReports: [
      {
        week: '2025-W03',
        date: '2025-01-14',
        byChannel: [
          { channel: '토탈 마케팅', totalClients: 10, expiringClients: 2, renewedClients: 1, renewalRevenue: 1000000, renewalRate: 50 },
          { channel: '퍼포먼스', totalClients: 8, expiringClients: 1, renewedClients: 1, renewalRevenue: 500000, renewalRate: 100 },
          { channel: '배달관리', totalClients: 7, expiringClients: 0, renewedClients: 0, renewalRevenue: 0, renewalRate: 0 },
          { channel: '브랜드블로그', totalClients: 7, expiringClients: 0, renewedClients: 0, renewalRevenue: 0, renewalRate: 0 },
        ],
        note: '테스트 데이터'
      }
    ]},
    { name: '조아라', clientCount: 31, weeklyReports: [] },
    { name: '정우진', clientCount: 30, weeklyReports: [] },
    { name: '김민우', clientCount: 28, weeklyReports: [] },
    { name: '양주미', clientCount: 27, weeklyReports: [] },
  ],
  salesData: [
    { name: '박현수', weeklyReports: [] },
    { name: '박은수', weeklyReports: [] },
  ],
};

async function testSave() {
  try {
    console.log('🚀 Supabase 저장 테스트 시작...');
    console.log('📡 URL:', supabaseUrl);

    const { error } = await supabase
      .from('dashboard_data')
      .upsert({
        id: 'default',
        data: testData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ 저장 실패:', error);
      console.error('에러 상세:', error.message, error.code);
    } else {
      console.log('✅ 데이터 저장 성공!');

      // 저장된 데이터 확인
      const { data: savedData, error: readError } = await supabase
        .from('dashboard_data')
        .select('data')
        .eq('id', 'default')
        .single();

      if (readError) {
        console.error('❌ 데이터 읽기 실패:', readError);
      } else {
        console.log('✅ 저장된 데이터 확인 완료');
        console.log('AE 수:', savedData.data.aeData.length);
        console.log('최호천 리포트 수:', savedData.data.aeData.find(ae => ae.name === '최호천')?.weeklyReports?.length || 0);
      }
    }
  } catch (error) {
    console.error('❌ 예상치 못한 에러:', error);
  }
}

testSave();