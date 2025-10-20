// 월별 스냅샷에서 데이터 복구
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreFromSnapshot(snapshotId = '2025-10') {
  console.log(`🔄 스냅샷에서 데이터 복구 중... (ID: ${snapshotId})\n`);

  try {
    // 스냅샷 데이터 조회
    const { data: snapshot, error: fetchError } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (fetchError) {
      console.error('❌ 스냅샷 조회 실패:', fetchError.message);
      return;
    }

    if (!snapshot || !snapshot.data) {
      console.error('❌ 스냅샷 데이터가 없습니다.');
      return;
    }

    console.log('✅ 스냅샷 데이터 발견!');
    console.log(`   생성일: ${snapshot.snapshot_date}`);
    console.log(`   연월: ${snapshot.year}-${String(snapshot.month).padStart(2, '0')}\n`);

    const restoredData = snapshot.data;

    // AE 리포트 현황 출력
    if (restoredData.aeData) {
      const reportedAEs = restoredData.aeData.filter(ae => ae.weeklyReports && ae.weeklyReports.length > 0);
      console.log(`📊 복구할 AE 리포트: ${reportedAEs.length}명`);
      reportedAEs.forEach(ae => {
        console.log(`   - ${ae.name}: ${ae.weeklyReports.length}개 리포트`);
        ae.weeklyReports.forEach(report => {
          console.log(`     * ${report.week}`);
        });
      });
    }

    // 영업사원 리포트 현황 출력
    if (restoredData.salesData) {
      const reportedSales = restoredData.salesData.filter(sales => sales.weeklyReports && sales.weeklyReports.length > 0);
      console.log(`\n💼 복구할 영업사원 리포트: ${reportedSales.length}명`);
      reportedSales.forEach(sales => {
        console.log(`   - ${sales.name}: ${sales.weeklyReports.length}개 리포트`);
        sales.weeklyReports.forEach(report => {
          console.log(`     * ${report.week}`);
        });
      });
    }

    console.log('\n🔄 dashboard_data 테이블에 복구 중...');

    // dashboard_data 테이블에 복구
    const { error: updateError } = await supabase
      .from('dashboard_data')
      .upsert({
        id: 'default',
        data: restoredData,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('❌ 복구 실패:', updateError.message);
      return;
    }

    console.log('\n✅ 데이터 복구 성공!');
    console.log('   대시보드를 새로고침하면 복구된 데이터를 확인할 수 있습니다.');

  } catch (e) {
    console.error('❌ 예외 발생:', e.message);
  }
}

// 명령줄 인자로 스냅샷 ID 지정 가능
const snapshotId = process.argv[2] || '2025-10';
restoreFromSnapshot(snapshotId);
