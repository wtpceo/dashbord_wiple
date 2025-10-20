// 스냅샷 관리 유틸리티
import { DashboardData } from '@/types/dashboard';
import { getSupabaseClient } from './supabase';

export interface Snapshot {
  id: string;
  year: number;
  month: number;
  snapshot_date: string;
  data: DashboardData;
  created_at: string;
  updated_at: string;
}

// 자동 스냅샷 생성 (데이터 저장 시마다)
export async function createAutoSnapshot(data: DashboardData): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const snapshotId = `${year}-${String(month).padStart(2, '0')}`;

    console.log('📸 자동 스냅샷 생성 중...', snapshotId);

    // 월별 스냅샷 업데이트 (같은 월이면 덮어쓰기)
    const { error } = await supabase
      .from('monthly_snapshots')
      .upsert({
        id: snapshotId,
        year,
        month,
        snapshot_date: now.toISOString(),
        data,
      });

    if (error) {
      console.error('❌ 스냅샷 생성 실패:', error.message);
    } else {
      console.log('✅ 자동 스냅샷 저장 완료:', snapshotId);
    }
  } catch (error) {
    console.error('❌ 스냅샷 생성 예외:', error);
  }
}

// 모든 스냅샷 조회
export async function getAllSnapshots(): Promise<Snapshot[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false });

    if (error) {
      console.error('❌ 스냅샷 조회 실패:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ 스냅샷 조회 예외:', error);
    return [];
  }
}

// 특정 스냅샷으로 복구
export async function restoreFromSnapshot(snapshotId: string): Promise<DashboardData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    console.log('🔄 스냅샷 복구 중...', snapshotId);

    // 스냅샷 데이터 조회
    const { data: snapshot, error: fetchError } = await supabase
      .from('monthly_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (fetchError || !snapshot) {
      console.error('❌ 스냅샷 조회 실패:', fetchError?.message);
      return null;
    }

    const restoredData = snapshot.data as DashboardData;

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
      return null;
    }

    console.log('✅ 복구 성공:', snapshotId);
    return restoredData;
  } catch (error) {
    console.error('❌ 복구 예외:', error);
    return null;
  }
}

// 스냅샷 삭제
export async function deleteSnapshot(snapshotId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('monthly_snapshots')
      .delete()
      .eq('id', snapshotId);

    if (error) {
      console.error('❌ 스냅샷 삭제 실패:', error.message);
      return false;
    }

    console.log('✅ 스냅샷 삭제 완료:', snapshotId);
    return true;
  } catch (error) {
    console.error('❌ 스냅샷 삭제 예외:', error);
    return false;
  }
}
