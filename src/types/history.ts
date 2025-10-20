// 월별 스냅샷 타입 정의

import { DashboardData } from './dashboard';

// 월별 스냅샷 데이터
export interface MonthlySnapshot {
  id: string; // 고유 ID (예: "2025-01")
  year: number; // 연도
  month: number; // 월 (1-12)
  snapshotDate: string; // 스냅샷 생성 날짜 (ISO format)
  data: DashboardData; // 해당 월의 대시보드 데이터
}

// 월별 비교 데이터 (차트용)
export interface MonthlyComparison {
  month: string; // "2025-01" 형식
  targetRevenue: number;
  actualRevenue: number;
  achievementRate: number;
  newRevenue: number;
  renewalRevenue: number;
  totalClients: number;
  newClients: number;
  renewedClients: number;
  renewalRate: number;
}

// AE 월별 성과 비교
export interface AEMonthlyPerformance {
  aeName: string;
  monthlyData: Array<{
    month: string;
    clientCount: number;
    renewalRevenue: number;
    renewalRate: number;
  }>;
}

// 영업사원 월별 성과 비교
export interface SalesMonthlyPerformance {
  salesName: string;
  monthlyData: Array<{
    month: string;
    newClients: number;
    newRevenue: number;
  }>;
}

// 매체별 월별 성장률
export interface ChannelGrowth {
  channel: string;
  monthlyData: Array<{
    month: string;
    revenue: number;
    clients: number;
    growthRate: number; // 전월 대비 성장률
  }>;
}
