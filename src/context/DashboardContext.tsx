'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DashboardData } from '@/types/dashboard';
import { getDashboardData, saveDashboardData, generateMockData } from '@/lib/mockData';
import { getSupabaseClient } from '@/lib/supabase';
import { createAutoSnapshot } from '@/lib/snapshotManager';

interface DashboardContextType {
  data: DashboardData;
  loading: boolean;
  updateData: (newData: DashboardData) => Promise<void>;
  resetData: () => void;
  resetMonthlyReports: () => Promise<void>;
  reloadData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<DashboardData>(generateMockData());
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const loadedData = await getDashboardData();
        setData(loadedData);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Supabase 실시간 구독 설정
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    console.log('🔄 Supabase 실시간 구독 설정 중...');

    // dashboard_data 테이블의 변경사항을 구독
    const subscription = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE 모든 이벤트
          schema: 'public',
          table: 'dashboard_data',
          filter: 'id=eq.default'
        },
        (payload) => {
          console.log('📡 Supabase 변경사항 감지:', payload);

          // 데이터가 변경되면 자동으로 새로고침
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new.data as DashboardData;
            setData(newData);
            console.log('✅ 실시간 데이터 동기화 완료');
          }
        }
      )
      .subscribe();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log('🔌 Supabase 구독 해제');
      subscription.unsubscribe();
    };
  }, []);

  // 폴링 방식으로 주기적으로 데이터 새로고침 (비활성화)
  // 자동 새로고침이 데이터를 리셋시킬 수 있어 주석 처리
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     try {
  //       const loadedData = await getDashboardData();
  //       setData(loadedData);
  //       console.log('🔄 데이터 자동 새로고침 (10초)');
  //     } catch (error) {
  //       console.error('자동 새로고침 실패:', error);
  //     }
  //   }, 10000); // 10초마다 새로고침

  //   return () => clearInterval(interval);
  // }, []);

  // 데이터 업데이트 함수
  const updateData = async (newData: DashboardData) => {
    console.log('📝 Context updateData 호출됨');
    console.log('새 데이터:', newData);
    console.log('AE 리포트 상세:', newData.aeData.map(ae => ({
      name: ae.name,
      reportCount: ae.weeklyReports?.length || 0,
      reports: ae.weeklyReports || []
    })));

    // 즉시 상태 업데이트
    setData(newData);
    console.log('✅ React state 업데이트 완료');

    try {
      await saveDashboardData(newData);
      console.log('✅ saveDashboardData 완료');

      // 자동 스냅샷 생성 (백업)
      await createAutoSnapshot(newData);
      console.log('✅ 자동 스냅샷 백업 완료');
    } catch (error) {
      console.error('❌ saveDashboardData 에러:', error);
      throw error;
    }
  };

  // 데이터 초기화 함수
  const resetData = () => {
    const freshData = generateMockData();
    setData(freshData);
    saveDashboardData(freshData);
  };

  // 월간 리포트만 리셋하는 함수
  const resetMonthlyReports = async () => {
    console.log('🔄 월간 리포트 리셋 중...');
    const newData = {
      ...data,
      aeData: data.aeData.map(ae => ({
        ...ae,
        weeklyReports: [] // AE 주간 리포트 비우기
      })),
      salesData: data.salesData.map(sales => ({
        ...sales,
        weeklyReports: [] // 영업사원 주간 리포트 비우기
      }))
    };

    setData(newData);
    await saveDashboardData(newData);
    console.log('✅ 월간 리포트 리셋 완료');
  };

  // 데이터 다시 로드 함수
  const reloadData = async () => {
    console.log('🔄 데이터 다시 로드 중...');
    setLoading(true);
    try {
      const loadedData = await getDashboardData();
      setData(loadedData);
      console.log('✅ 데이터 다시 로드 완료:', loadedData);
    } catch (error) {
      console.error('❌ 데이터 다시 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContext.Provider value={{ data, loading, updateData, resetData, resetMonthlyReports, reloadData }}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom Hook
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
