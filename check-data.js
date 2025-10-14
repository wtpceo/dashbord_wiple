// Supabase 데이터 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('📊 현재 Supabase 데이터 확인\n');

  try {
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('❌ 데이터 조회 실패:', error);
      return;
    }

    if (data && data.data) {
      const dashboardData = data.data;

      console.log('✅ 데이터 발견!');
      console.log('업데이트 시간:', data.updated_at);
      console.log('\n📈 주요 지표:');
      console.log('목표 매출:', dashboardData.targetRevenue?.toLocaleString() || 0);
      console.log('AE 수:', dashboardData.aeData?.length || 0);
      console.log('영업사원 수:', dashboardData.salesData?.length || 0);

      // AE 리포트 확인
      if (dashboardData.aeData) {
        console.log('\n👥 AE 리포트 현황:');
        dashboardData.aeData.forEach(ae => {
          const reportCount = ae.weeklyReports?.length || 0;
          if (reportCount > 0) {
            console.log(`  ${ae.name}: ${reportCount}개 리포트`);
            const latestReport = ae.weeklyReports[0];
            if (latestReport) {
              console.log(`    - 최신: ${latestReport.week} (${latestReport.date})`);
              if (latestReport.byChannel) {
                const total = latestReport.byChannel.reduce((sum, ch) => sum + ch.totalClients, 0);
                console.log(`    - 총 담당: ${total}개 업체`);
              }
            }
          }
        });
      }

      // 영업사원 리포트 확인
      if (dashboardData.salesData) {
        console.log('\n💼 영업사원 리포트 현황:');
        dashboardData.salesData.forEach(sales => {
          const reportCount = sales.weeklyReports?.length || 0;
          if (reportCount > 0) {
            console.log(`  ${sales.name}: ${reportCount}개 리포트`);
            const latestReport = sales.weeklyReports[0];
            if (latestReport) {
              console.log(`    - 최신: ${latestReport.week} (${latestReport.date})`);
            }
          }
        });
      }

      // 테스트 필드 확인
      if (dashboardData.testField) {
        console.log('\n🧪 테스트 필드:', dashboardData.testField);
      }

      if (dashboardData.debugTest) {
        console.log('🐛 디버그 테스트:', dashboardData.debugTest);
      }

    } else {
      console.log('⚠️ 데이터가 비어있습니다');
    }

  } catch (e) {
    console.error('❌ 예외 발생:', e.message);
  }
}

checkData();