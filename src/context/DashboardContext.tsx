'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DashboardData } from '@/types/dashboard';
import { getDashboardData, saveDashboardData, generateMockData } from '@/lib/mockData';

interface DashboardContextType {
  data: DashboardData;
  loading: boolean;
  updateData: (newData: DashboardData) => Promise<void>;
  resetData: () => void;
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
    setData(newData);
    await saveDashboardData(newData);
  };

  // 데이터 초기화 함수
  const resetData = () => {
    const freshData = generateMockData();
    setData(freshData);
    saveDashboardData(freshData);
  };

  return (
    <DashboardContext.Provider value={{ data, loading, updateData, resetData }}>
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
