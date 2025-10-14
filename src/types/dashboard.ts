// 마케팅 매체 타입
export type MarketingChannel = '토탈 마케팅' | '퍼포먼스' | '배달관리' | '브랜드블로그';

// AE 이름 타입 - 더 유연하게 string으로 변경
export type AEName = string;

// 영업사원 이름 타입 - 더 유연하게 string으로 변경
export type SalesName = string;

// 매체별 데이터 인터페이스
export interface ChannelData {
  channel: MarketingChannel;
  value: number; // 매출 또는 광고주 수
}

// 월별 매출 데이터
export interface MonthlyRevenue {
  total: number; // 총 매출
  byChannel: ChannelData[]; // 매체별 매출
}

// 광고주 수 데이터
export interface ClientCount {
  total: number; // 총 광고주 수
  byChannel: ChannelData[]; // 매체별 광고주 수
}

// 종료 예정 광고주 데이터
export interface ExpiringClients {
  total: number; // 총 종료 예정 광고주 수
  byChannel: ChannelData[]; // 매체별 종료 예정 광고주 수
}

// 연장 데이터
export interface RenewalData {
  count: number; // 연장 업체 수
  revenue: number; // 연장 매출
  rate: number; // 연장율 (%)
  byChannel: Array<{
    channel: MarketingChannel;
    count: number;
    revenue: number;
    rate: number;
  }>;
}

// 신규 광고주 데이터
export interface NewClients {
  total: number; // 총 신규 광고주 수
  byChannel: ChannelData[]; // 매체별 신규 광고주 수
}

// 매체별 AE 리포트 상세 데이터
export interface AEChannelReport {
  channel: MarketingChannel;
  totalClients: number; // 담당 업체 수
  expiringClients: number; // 종료 예정 업체 수
  renewedClients: number; // 연장 성공 업체 수
  renewalRevenue: number; // 연장 매출
  renewalRate: number; // 연장율 (자동 계산)
}

// AE 주간 리포트 데이터
export interface AEWeeklyReport {
  week: string; // 주차 (예: "2025-W03")
  date: string; // 입력 날짜
  byChannel: AEChannelReport[]; // 매체별 리포트
  note?: string; // 특이사항
}

// 매체별 영업사원 리포트 상세 데이터
export interface SalesChannelReport {
  channel: MarketingChannel;
  newClients: number; // 신규 계약 업체 수
  newRevenue: number; // 신규 계약 매출
}

// 영업사원 주간 리포트 데이터
export interface SalesWeeklyReport {
  week: string; // 주차 (예: "2025-W03")
  date: string; // 입력 날짜
  byChannel: SalesChannelReport[]; // 매체별 리포트
  note?: string; // 특이사항
}

// AE별 담당 광고주 데이터
export interface AEClientData {
  name: AEName;
  clientCount: number; // 담당 광고주 수
  weeklyReports: AEWeeklyReport[]; // 주간 리포트 배열
}

// 영업사원 데이터
export interface SalesData {
  name: SalesName;
  weeklyReports: SalesWeeklyReport[]; // 주간 리포트 배열
}

// 전체 대시보드 데이터
export interface DashboardData {
  // 목표 매출
  targetRevenue: number; // 이번달 목표 매출
  
  // 매출 데이터
  lastMonthRevenue: MonthlyRevenue; // 지난달 매출
  currentMonthRevenue: MonthlyRevenue; // 이번달 매출
  
  // 광고주 수
  totalClients: ClientCount; // 총 광고주 수
  
  // 종료 예정 광고주
  nextMonthExpiring: ExpiringClients; // 다음달 종료 예정
  currentMonthExpiring: ExpiringClients; // 이번달 종료
  
  // 연장 데이터
  lastMonthRenewal: RenewalData; // 지난달 연장
  currentMonthRenewal: RenewalData; // 이번달 연장
  
  // 신규 광고주
  lastMonthNewClients: NewClients; // 지난달 신규
  currentMonthNewClients: NewClients; // 이번달 신규
  
  // AE별 데이터
  aeData: AEClientData[]; // AE별 담당 광고주 수
  
  // 영업사원 데이터
  salesData: SalesData[]; // 영업사원별 신규 매출
}
