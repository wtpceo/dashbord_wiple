// 월별 히스토리 데이터 관리

import { DashboardData } from '@/types/dashboard';
import { MonthlySnapshot, MonthlyComparison } from '@/types/history';
import { getSupabaseClient } from './supabase';

// 월별 스냅샷 저장 (매달 말일 자동 실행)
export const saveMonthlySnapshot = async (
  year: number,
  month: number,
  data: DashboardData
): Promise<void> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error('Supabase 클라이언트가 초기화되지 않았습니다');
    return;
  }

  const snapshotId = `${year}-${String(month).padStart(2, '0')}`;
  const snapshot: MonthlySnapshot = {
    id: snapshotId,
    year,
    month,
    snapshotDate: new Date().toISOString(),
    data
  };

  try {
    const { error } = await supabase
      .from('monthly_snapshots')
      .upsert({
        id: snapshot.id,
        year: snapshot.year,
        month: snapshot.month,
        snapshot_date: snapshot.snapshotDate,
        data: snapshot.data
      });

    if (error) {
      console.error('월별 스냅샷 저장 실패:', error);
      throw error;
    }

    console.log(`✅ ${snapshotId} 월별 스냅샷 저장 완료`);
  } catch (error) {
    console.error('월별 스냅샷 저장 에러:', error);
    throw error;
  }
};

// 모든 월별 스냅샷 가져오기
export const getAllMonthlySnapshots = async (): Promise<MonthlySnapshot[]> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error('Supabase 클라이언트가 초기화되지 않았습니다');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('월별 스냅샷 조회 실패:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      year: row.year,
      month: row.month,
      snapshotDate: row.snapshot_date,
      data: row.data as DashboardData
    }));
  } catch (error) {
    console.error('월별 스냅샷 조회 에러:', error);
    return [];
  }
};

// 특정 월의 스냅샷 가져오기
export const getMonthlySnapshot = async (
  year: number,
  month: number
): Promise<MonthlySnapshot | null> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error('Supabase 클라이언트가 초기화되지 않았습니다');
    return null;
  }

  const snapshotId = `${year}-${String(month).padStart(2, '0')}`;

  try {
    const { data, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (error) {
      console.error('월별 스냅샷 조회 실패:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      year: data.year,
      month: data.month,
      snapshotDate: data.snapshot_date,
      data: data.data as DashboardData
    };
  } catch (error) {
    console.error('월별 스냅샷 조회 에러:', error);
    return null;
  }
};

// 월별 비교 데이터 생성 (차트용)
export const generateMonthlyComparisons = (
  snapshots: MonthlySnapshot[]
): MonthlyComparison[] => {
  return snapshots.map(snapshot => {
    const data = snapshot.data;

    // 이번달 실제 매출 계산 (신규 + 연장)
    const actualRevenue = data.currentMonthRevenue.total;

    // 목표 달성률
    const achievementRate = data.targetRevenue > 0
      ? (actualRevenue / data.targetRevenue) * 100
      : 0;

    // 신규 매출 (영업사원)
    const newRevenue = data.salesData.reduce((sum, sales) => {
      const weeklyReports = sales.weeklyReports || [];
      return sum + weeklyReports.reduce((reportSum, report) => {
        if (report.byChannel) {
          return reportSum + report.byChannel.reduce((channelSum, ch) =>
            channelSum + ch.newRevenue, 0);
        }
        return reportSum;
      }, 0);
    }, 0);

    // 연장 매출 (AE)
    const renewalRevenue = data.aeData.reduce((sum, ae) => {
      const weeklyReports = ae.weeklyReports || [];
      return sum + weeklyReports.reduce((reportSum, report) => {
        if (report.byChannel) {
          return reportSum + report.byChannel.reduce((channelSum, ch) =>
            channelSum + ch.renewalRevenue, 0);
        }
        return reportSum;
      }, 0);
    }, 0);

    // 총 광고주 수
    const totalClients = data.totalClients.total;

    // 신규 광고주 수
    const newClients = data.currentMonthNewClients.total;

    // 연장 성공 수
    const renewedClients = data.currentMonthRenewal.count;

    // 연장율
    const renewalRate = data.currentMonthRenewal.rate;

    return {
      month: snapshot.id,
      targetRevenue: data.targetRevenue,
      actualRevenue,
      achievementRate,
      newRevenue,
      renewalRevenue,
      totalClients,
      newClients,
      renewedClients,
      renewalRate
    };
  });
};

// 현재 월의 데이터를 스냅샷으로 저장 (수동 실행용)
export const saveCurrentMonthSnapshot = async (
  currentData: DashboardData
): Promise<void> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-based to 1-based

  await saveMonthlySnapshot(year, month, currentData);
};

// 월별 스냅샷 삭제 (관리자용)
export const deleteMonthlySnapshot = async (
  year: number,
  month: number
): Promise<void> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.error('Supabase 클라이언트가 초기화되지 않았습니다');
    return;
  }

  const snapshotId = `${year}-${String(month).padStart(2, '0')}`;

  try {
    const { error } = await supabase
      .from('monthly_snapshots')
      .delete()
      .eq('id', snapshotId);

    if (error) {
      console.error('월별 스냅샷 삭제 실패:', error);
      throw error;
    }

    console.log(`✅ ${snapshotId} 월별 스냅샷 삭제 완료`);
  } catch (error) {
    console.error('월별 스냅샷 삭제 에러:', error);
    throw error;
  }
};
