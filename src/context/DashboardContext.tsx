'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DashboardData } from '@/types/dashboard';
import { getDashboardData, saveDashboardData, generateMockData } from '@/lib/mockData';

interface DashboardContextType {
  data: DashboardData;
  loading: boolean;
  updateData: (newData: DashboardData) => Promise<void>;
  resetData: () => void;
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
    <DashboardContext.Provider value={{ data, loading, updateData, resetData, reloadData }}>
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
