// Supabase 데이터 초기화
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function resetData() {
  console.log('🔄 Supabase 데이터 초기화 중...\n');

  const initialData = {
    targetRevenue: 300000000,
    lastMonthRevenue: {
      total: 245000000,
      byChannel: [
        { channel: '토탈 마케팅', value: 95000000 },
        { channel: '퍼포먼스', value: 80000000 },
        { channel: '배달관리', value: 45000000 },
        { channel: '브랜드블로그', value: 25000000 }
      ]
    },
    currentMonthRevenue: {
      total: 268000000,
      byChannel: [
        { channel: '토탈 마케팅', value: 105000000 },
        { channel: '퍼포먼스', value: 88000000 },
        { channel: '배달관리', value: 48000000 },
        { channel: '브랜드블로그', value: 27000000 }
      ]
    },
    totalClients: {
      total: 156,
      byChannel: [
        { channel: '토탈 마케팅', value: 48 },
        { channel: '퍼포먼스', value: 52 },
        { channel: '배달관리', value: 35 },
        { channel: '브랜드블로그', value: 21 }
      ]
    },
    nextMonthExpiring: {
      total: 23,
      byChannel: [
        { channel: '토탈 마케팅', value: 8 },
        { channel: '퍼포먼스', value: 7 },
        { channel: '배달관리', value: 5 },
        { channel: '브랜드블로그', value: 3 }
      ]
    },
    currentMonthExpiring: {
      total: 18,
      byChannel: [
        { channel: '토탈 마케팅', value: 6 },
        { channel: '퍼포먼스', value: 5 },
        { channel: '배달관리', value: 4 },
        { channel: '브랜드블로그', value: 3 }
      ]
    },
    lastMonthRenewal: {
      count: 32,
      revenue: 89000000,
      rate: 78.5,
      byChannel: [
        { channel: '토탈 마케팅', count: 12, revenue: 35000000, rate: 80.0 },
        { channel: '퍼포먼스', count: 10, revenue: 28000000, rate: 76.9 },
        { channel: '배달관리', count: 7, revenue: 18000000, rate: 77.8 },
        { channel: '브랜드블로그', count: 3, revenue: 8000000, rate: 75.0 }
      ]
    },
    currentMonthRenewal: {
      count: 28,
      revenue: 76000000,
      rate: 82.4,
      byChannel: [
        { channel: '토탈 마케팅', count: 10, revenue: 30000000, rate: 83.3 },
        { channel: '퍼포먼스', count: 9, revenue: 25000000, rate: 81.8 },
        { channel: '배달관리', count: 6, revenue: 15000000, rate: 85.7 },
        { channel: '브랜드블로그', count: 3, revenue: 6000000, rate: 75.0 }
      ]
    },
    lastMonthNewClients: {
      total: 18,
      byChannel: [
        { channel: '토탈 마케팅', value: 6 },
        { channel: '퍼포먼스', value: 7 },
        { channel: '배달관리', value: 3 },
        { channel: '브랜드블로그', value: 2 }
      ]
    },
    currentMonthNewClients: {
      total: 22,
      byChannel: [
        { channel: '토탈 마케팅', value: 8 },
        { channel: '퍼포먼스', value: 8 },
        { channel: '배달관리', value: 4 },
        { channel: '브랜드블로그', value: 2 }
      ]
    },
    aeData: [
      { name: '이수빈', clientCount: 35, weeklyReports: [] },
      { name: '최호천', clientCount: 32, weeklyReports: [] },
      { name: '조아라', clientCount: 31, weeklyReports: [] },
      { name: '정우진', clientCount: 30, weeklyReports: [] },
      { name: '김민우', clientCount: 28, weeklyReports: [] },
      { name: '양주미', clientCount: 27, weeklyReports: [] }
    ],
    salesData: [
      { name: '박현수', weeklyReports: [] },
      { name: '박은수', weeklyReports: [] }
    ]
  };

  try {
    const { error } = await supabase
      .from('dashboard_data')
      .upsert({
        id: 'default',
        data: initialData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ 초기화 실패:', error);
    } else {
      console.log('✅ 데이터 초기화 성공!');
      console.log('\n📊 초기화된 데이터:');
      console.log('- 목표 매출: 3억원');
      console.log('- AE: 6명 (이수빈, 최호천, 조아라, 정우진, 김민우, 양주미)');
      console.log('- 영업사원: 2명 (박현수, 박은수)');
      console.log('- 지난달 매출: 2.45억원');
      console.log('- 이번달 매출: 2.68억원');
      console.log('\n이제 대시보드를 새로고침하면 데이터가 표시됩니다!');
    }
  } catch (e) {
    console.error('❌ 예외 발생:', e.message);
  }
}

resetData();