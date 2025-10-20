// 리포트 데이터 형식 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReportFormat() {
  console.log('📊 리포트 데이터 형식 확인\n');

  try {
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('data')
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('❌ 조회 실패:', error.message);
      return;
    }

    if (!data || !data.data) {
      console.log('⚠️  데이터가 없습니다.');
      return;
    }

    const dashboardData = data.data;

    // AE 리포트 형식 확인
    console.log('👥 AE 리포트 형식:\n');
    dashboardData.aeData.forEach(ae => {
      if (ae.weeklyReports && ae.weeklyReports.length > 0) {
        console.log(`${ae.name}:`);
        ae.weeklyReports.forEach((report, idx) => {
          console.log(`  리포트 ${idx + 1}:`);
          console.log(`    week: "${report.week}"`);
          console.log(`    reportDate: "${report.reportDate || '없음'}"`);
          if (report.byChannel && report.byChannel.length > 0) {
            console.log(`    매체 수: ${report.byChannel.length}`);
            console.log(`    첫 번째 매체:`, report.byChannel[0]);
          }
        });
        console.log('');
      }
    });

    // 영업사원 리포트 형식 확인
    console.log('\n💼 영업사원 리포트 형식:\n');
    dashboardData.salesData.forEach(sales => {
      if (sales.weeklyReports && sales.weeklyReports.length > 0) {
        console.log(`${sales.name}:`);
        sales.weeklyReports.forEach((report, idx) => {
          console.log(`  리포트 ${idx + 1}:`);
          console.log(`    week: "${report.week}"`);
          console.log(`    reportDate: "${report.reportDate || '없음'}"`);
          if (report.byChannel && report.byChannel.length > 0) {
            console.log(`    매체 수: ${report.byChannel.length}`);
            console.log(`    첫 번째 매체:`, report.byChannel[0]);
          }
        });
        console.log('');
      }
    });

    // 현재 월 계산
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    console.log(`\n📅 현재 월: ${currentMonth}`);
    console.log(`필터링 문자열: "${currentMonth.substring(0, 7)}"`);

    // 테스트
    const testWeek = "2025-W42";
    console.log(`\n테스트: "${testWeek}".startsWith("${currentMonth.substring(0, 7)}")`);
    console.log(`결과: ${testWeek.startsWith(currentMonth.substring(0, 7))}`);

  } catch (e) {
    console.error('❌ 예외 발생:', e.message);
  }
}

checkReportFormat();
