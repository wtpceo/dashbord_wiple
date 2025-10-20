// 스냅샷 상세 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function detailedSnapshotCheck() {
  console.log('📊 스냅샷 상세 분석\n');

  try {
    // 모든 스냅샷 조회
    const { data: snapshots, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false });

    if (error) {
      console.error('❌ 조회 실패:', error.message);
      return;
    }

    if (!snapshots || snapshots.length === 0) {
      console.log('⚠️  저장된 스냅샷이 없습니다.\n');

      // dashboard_data 확인
      console.log('📋 현재 dashboard_data 확인 중...\n');
      const { data: current, error: currentError } = await supabase
        .from('dashboard_data')
        .select('*')
        .eq('id', 'default')
        .single();

      if (!currentError && current) {
        console.log('✅ 현재 dashboard_data:');
        console.log(`   업데이트 시간: ${current.updated_at}`);
        if (current.data) {
          analyzeData('현재 데이터', current.data, current.updated_at);
        }
      }
      return;
    }

    console.log(`✅ ${snapshots.length}개의 스냅샷 발견!\n`);
    console.log('=' .repeat(80));

    snapshots.forEach((snapshot, index) => {
      console.log(`\n📸 스냅샷 #${index + 1}`);
      console.log(`   ID: ${snapshot.id}`);
      console.log(`   생성일: ${snapshot.snapshot_date}`);
      console.log(`   연월: ${snapshot.year}-${String(snapshot.month).padStart(2, '0')}`);

      if (snapshot.data) {
        analyzeData(`스냅샷 #${index + 1}`, snapshot.data, snapshot.snapshot_date);
      }
      console.log('=' .repeat(80));
    });

  } catch (e) {
    console.error('❌ 예외 발생:', e.message);
  }
}

function analyzeData(label, data, timestamp) {
  console.log(`\n   💰 매출 정보:`);
  console.log(`      목표 매출: ${(data.targetRevenue || 0).toLocaleString()}원`);

  // AE 리포트 분석
  if (data.aeData) {
    console.log(`\n   👥 AE 리포트 (총 ${data.aeData.length}명):`);
    const aeWithReports = data.aeData.filter(ae => ae.weeklyReports && ae.weeklyReports.length > 0);
    console.log(`      리포트 제출: ${aeWithReports.length}명`);

    aeWithReports.forEach(ae => {
      console.log(`\n      📋 ${ae.name}:`);
      console.log(`         리포트 수: ${ae.weeklyReports.length}개`);

      ae.weeklyReports.forEach((report, idx) => {
        console.log(`         \n         리포트 #${idx + 1}:`);
        console.log(`           주차: ${report.week}`);
        console.log(`           날짜: ${report.reportDate || '기록 없음'}`);

        if (report.byChannel) {
          const totalClients = report.byChannel.reduce((sum, ch) => sum + (ch.totalClients || 0), 0);
          const renewalRevenue = report.byChannel.reduce((sum, ch) => sum + (ch.renewalRevenue || 0), 0);
          console.log(`           총 담당: ${totalClients}개`);
          console.log(`           연장 매출: ${renewalRevenue.toLocaleString()}원`);

          // 매체별 상세
          const nonZeroChannels = report.byChannel.filter(ch =>
            (ch.totalClients || 0) > 0 ||
            (ch.renewalRevenue || 0) > 0 ||
            (ch.expiringClients || 0) > 0 ||
            (ch.renewedClients || 0) > 0
          );

          if (nonZeroChannels.length > 0) {
            console.log(`           매체별 데이터:`);
            nonZeroChannels.forEach(ch => {
              console.log(`             - ${ch.channel}: 담당 ${ch.totalClients || 0}, 종료 ${ch.expiringClients || 0}, 연장 ${ch.renewedClients || 0}, 매출 ${(ch.renewalRevenue || 0).toLocaleString()}원`);
            });
          }
        }
      });
    });
  }

  // 영업사원 리포트 분석
  if (data.salesData) {
    console.log(`\n   💼 영업사원 리포트 (총 ${data.salesData.length}명):`);
    const salesWithReports = data.salesData.filter(s => s.weeklyReports && s.weeklyReports.length > 0);
    console.log(`      리포트 제출: ${salesWithReports.length}명`);

    salesWithReports.forEach(sales => {
      console.log(`\n      📋 ${sales.name}:`);
      console.log(`         리포트 수: ${sales.weeklyReports.length}개`);

      sales.weeklyReports.forEach((report, idx) => {
        console.log(`         \n         리포트 #${idx + 1}:`);
        console.log(`           주차: ${report.week}`);
        console.log(`           날짜: ${report.reportDate || '기록 없음'}`);

        if (report.byChannel) {
          const totalClients = report.byChannel.reduce((sum, ch) => sum + (ch.newClients || 0), 0);
          const totalRevenue = report.byChannel.reduce((sum, ch) => sum + (ch.newRevenue || 0), 0);
          console.log(`           신규 계약: ${totalClients}개`);
          console.log(`           신규 매출: ${totalRevenue.toLocaleString()}원`);

          // 매체별 상세
          const nonZeroChannels = report.byChannel.filter(ch =>
            (ch.newClients || 0) > 0 || (ch.newRevenue || 0) > 0
          );

          if (nonZeroChannels.length > 0) {
            console.log(`           매체별 데이터:`);
            nonZeroChannels.forEach(ch => {
              console.log(`             - ${ch.channel}: 계약 ${ch.newClients || 0}, 매출 ${(ch.newRevenue || 0).toLocaleString()}원`);
            });
          }
        }
      });
    });
  }
}

detailedSnapshotCheck();
