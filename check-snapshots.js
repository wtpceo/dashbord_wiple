// 월별 스냅샷 데이터 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSnapshots() {
  console.log('📊 월별 스냅샷 데이터 확인\n');

  try {
    // 모든 스냅샷 조회
    const { data: snapshots, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false });

    if (error) {
      console.error('❌ 스냅샷 조회 실패:', error.message);
      return;
    }

    if (!snapshots || snapshots.length === 0) {
      console.log('⚠️  저장된 스냅샷이 없습니다.');
      return;
    }

    console.log(`✅ ${snapshots.length}개의 스냅샷 발견!\n`);

    snapshots.forEach((snapshot, index) => {
      console.log(`\n${index + 1}. 스냅샷 ID: ${snapshot.id}`);
      console.log(`   생성일: ${snapshot.snapshot_date}`);
      console.log(`   연월: ${snapshot.year}-${String(snapshot.month).padStart(2, '0')}`);

      if (snapshot.data) {
        const data = snapshot.data;
        console.log(`   목표 매출: ${(data.targetRevenue || 0).toLocaleString()}원`);

        if (data.aeData) {
          const reportedAEs = data.aeData.filter(ae => ae.weeklyReports && ae.weeklyReports.length > 0);
          console.log(`   AE 리포트: ${reportedAEs.length}명 제출`);
          reportedAEs.forEach(ae => {
            console.log(`     - ${ae.name}: ${ae.weeklyReports.length}개 리포트`);
          });
        }

        if (data.salesData) {
          const reportedSales = data.salesData.filter(sales => sales.weeklyReports && sales.weeklyReports.length > 0);
          console.log(`   영업사원 리포트: ${reportedSales.length}명 제출`);
          reportedSales.forEach(sales => {
            console.log(`     - ${sales.name}: ${sales.weeklyReports.length}개 리포트`);
          });
        }
      }
    });

  } catch (e) {
    console.error('❌ 예외 발생:', e.message);
  }
}

checkSnapshots();
