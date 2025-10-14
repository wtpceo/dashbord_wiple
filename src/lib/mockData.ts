import { DashboardData } from '@/types/dashboard';
import { supabase } from './supabase';

const DASHBOARD_ID = 'default';

// Mock 데이터 생성 함수
export const generateMockData = (): DashboardData => {
  return {
    targetRevenue: 300000000,
    lastMonthRevenue: {
      total: 245000000,
      byChannel: [
        { channel: '토탈 마케팅', value: 95000000 },
        { channel: '퍼포먼스', value: 80000000 },
        { channel: '배달관리', value: 45000000 },
        { channel: '브랜드블로그', value: 25000000 },
      ],
    },
    currentMonthRevenue: {
      total: 268000000,
      byChannel: [
        { channel: '토탈 마케팅', value: 105000000 },
        { channel: '퍼포먼스', value: 88000000 },
        { channel: '배달관리', value: 48000000 },
        { channel: '브랜드블로그', value: 27000000 },
      ],
    },
    totalClients: {
      total: 156,
      byChannel: [
        { channel: '토탈 마케팅', value: 48 },
        { channel: '퍼포먼스', value: 52 },
        { channel: '배달관리', value: 35 },
        { channel: '브랜드블로그', value: 21 },
      ],
    },
    nextMonthExpiring: {
      total: 23,
      byChannel: [
        { channel: '토탈 마케팅', value: 8 },
        { channel: '퍼포먼스', value: 7 },
        { channel: '배달관리', value: 5 },
        { channel: '브랜드블로그', value: 3 },
      ],
    },
    currentMonthExpiring: {
      total: 18,
      byChannel: [
        { channel: '토탈 마케팅', value: 6 },
        { channel: '퍼포먼스', value: 5 },
        { channel: '배달관리', value: 4 },
        { channel: '브랜드블로그', value: 3 },
      ],
    },
    lastMonthRenewal: {
      count: 32,
      revenue: 89000000,
      rate: 78.5,
      byChannel: [
        { channel: '토탈 마케팅', count: 12, revenue: 35000000, rate: 80.0 },
        { channel: '퍼포먼스', count: 10, revenue: 28000000, rate: 76.9 },
        { channel: '배달관리', count: 7, revenue: 18000000, rate: 77.8 },
        { channel: '브랜드블로그', count: 3, revenue: 8000000, rate: 75.0 },
      ],
    },
    currentMonthRenewal: {
      count: 28,
      revenue: 76000000,
      rate: 82.4,
      byChannel: [
        { channel: '토탈 마케팅', count: 10, revenue: 30000000, rate: 83.3 },
        { channel: '퍼포먼스', count: 9, revenue: 25000000, rate: 81.8 },
        { channel: '배달관리', count: 6, revenue: 15000000, rate: 85.7 },
        { channel: '브랜드블로그', count: 3, revenue: 6000000, rate: 75.0 },
      ],
    },
    lastMonthNewClients: {
      total: 18,
      byChannel: [
        { channel: '토탈 마케팅', value: 6 },
        { channel: '퍼포먼스', value: 7 },
        { channel: '배달관리', value: 3 },
        { channel: '브랜드블로그', value: 2 },
      ],
    },
    currentMonthNewClients: {
      total: 22,
      byChannel: [
        { channel: '토탈 마케팅', value: 8 },
        { channel: '퍼포먼스', value: 8 },
        { channel: '배달관리', value: 4 },
        { channel: '브랜드블로그', value: 2 },
      ],
    },
    aeData: [
      { name: '이수빈', clientCount: 35, weeklyReports: [] },
      { name: '최호천', clientCount: 32, weeklyReports: [] },
      { name: '조아라', clientCount: 31, weeklyReports: [] },
      { name: '정우진', clientCount: 30, weeklyReports: [] },
      { name: '김민우', clientCount: 28, weeklyReports: [] },
      { name: '양주미', clientCount: 27, weeklyReports: [] },
    ],
  };
};

// 로컬 스토리지 키
export const DASHBOARD_DATA_KEY = 'wpl_dashboard_data';

// Supabase에서 데이터 가져오기
export const getDashboardData = async (): Promise<DashboardData> => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') {
    return generateMockData();
  }

  // Supabase 설정이 없으면 로컬 스토리지 사용
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Supabase 미설정 - 로컬 스토리지 사용');
    return getDashboardDataFromLocal();
  }

  try {
    console.log('Supabase에서 데이터 조회 중...');
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('data')
      .eq('id', DASHBOARD_ID)
      .single();

    if (error) {
      console.error('Supabase 조회 에러:', error);
      console.log('로컬 스토리지로 Fallback');
      // 에러 시 로컬 데이터 사용
      return getDashboardDataFromLocal();
    }

    if (data && data.data) {
      console.log('Supabase에서 데이터 로드 성공');
      const dashboardData = data.data as DashboardData;
      
      // 데이터 마이그레이션
      if (!dashboardData.targetRevenue) {
        dashboardData.targetRevenue = 300000000;
      }
      
      const hasYangJuMi = dashboardData.aeData.some(ae => ae.name === '양주미');
      if (!hasYangJuMi) {
        dashboardData.aeData.push({
          name: '양주미',
          clientCount: 27,
          weeklyReports: []
        });
      }
      
      dashboardData.aeData = dashboardData.aeData.map(ae => ({
        ...ae,
        weeklyReports: ae.weeklyReports || []
      }));
      
      return dashboardData;
    }

    // 데이터가 없으면 초기 데이터 생성
    console.log('Supabase에 데이터 없음 - 초기 데이터 생성');
    const initialData = generateMockData();
    await saveDashboardData(initialData);
    return initialData;
    
  } catch (error) {
    console.error('Supabase 연결 에러:', error);
    console.log('로컬 스토리지로 Fallback');
    return getDashboardDataFromLocal();
  }
};

// 로컬 스토리지에서 데이터 가져오기 (Fallback)
const getDashboardDataFromLocal = (): DashboardData => {
  if (typeof window === 'undefined') {
    return generateMockData();
  }
  
  const stored = localStorage.getItem(DASHBOARD_DATA_KEY);
  if (stored) {
    try {
      const parsedData = JSON.parse(stored) as DashboardData;
      
      if (!parsedData.targetRevenue) {
        parsedData.targetRevenue = 300000000;
      }
      
      const hasYangJuMi = parsedData.aeData.some(ae => ae.name === '양주미');
      if (!hasYangJuMi) {
        parsedData.aeData.push({
          name: '양주미',
          clientCount: 27,
          weeklyReports: []
        });
      }
      
      parsedData.aeData = parsedData.aeData.map(ae => ({
        ...ae,
        weeklyReports: ae.weeklyReports || []
      }));
      
      localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(parsedData));
      
      return parsedData;
    } catch (error) {
      console.error('Failed to parse dashboard data:', error);
      return generateMockData();
    }
  }
  
  const initialData = generateMockData();
  localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(initialData));
  return initialData;
};

// Supabase에 데이터 저장
export const saveDashboardData = async (data: DashboardData): Promise<void> => {
  // Supabase 설정이 없으면 로컬 스토리지에만 저장
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Supabase 미설정 - 로컬 스토리지에 저장');
    if (typeof window !== 'undefined') {
      localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(data));
    }
    return;
  }

  try {
    const { error } = await supabase
      .from('dashboard_data')
      .upsert({
        id: DASHBOARD_ID,
        data: data,
      });

    if (error) {
      console.error('Supabase 저장 에러:', error);
      // 에러 시 로컬에도 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(data));
      }
    } else {
      console.log('Supabase에 데이터 저장 완료');
      // 성공 시에도 로컬에 백업
      if (typeof window !== 'undefined') {
        localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(data));
      }
    }
  } catch (error) {
    console.error('Supabase 연결 에러:', error);
    // 에러 시 로컬에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem(DASHBOARD_DATA_KEY, JSON.stringify(data));
    }
  }
};

// 현재 주차 계산 (ISO 8601)
export const getCurrentWeek = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
};

// 날짜 포맷팅
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
