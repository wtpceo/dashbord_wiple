'use client';

import { useDashboard } from '@/context/DashboardContext';
import { formatCurrency, formatPercent, calculateGrowthRate } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { data, loading, reloadData } = useDashboard();
  const [mounted, setMounted] = useState(false);

  // Hydration 에러 방지: 클라이언트에서만 렌더링
  useEffect(() => {
    setMounted(true);
  }, []);

  // 데이터 변경 감지 로그
  useEffect(() => {
    console.log('🔄 대시보드 데이터 업데이트됨:', data);
    console.log('📊 AE 리포트 개수:', data.aeData.map(ae => ({
      name: ae.name,
      reports: ae.weeklyReports?.length || 0
    })));
  }, [data]);

  // 새로고침 핸들러
  const handleRefresh = async () => {
    await reloadData();
  };

  // 매출 증가율 계산
  const revenueGrowth = calculateGrowthRate(
    data.currentMonthRevenue.total,
    data.lastMonthRevenue.total
  );

  // 목표 달성률 계산
  const achievementRate = data.targetRevenue > 0 
    ? (data.currentMonthRevenue.total / data.targetRevenue) * 100 
    : 0;

  // AE 데이터 집계 함수
  const getCurrentWeekFromDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const currentWeek = getCurrentWeekFromDate();

  // 이번 주 AE 리포트 집계
  const weeklyAggregation = data.aeData.reduce((acc, ae) => {
    const weeklyReports = ae.weeklyReports || [];
    const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
    
    if (thisWeekReport && thisWeekReport.byChannel) {
      // 매체별 데이터를 합산
      thisWeekReport.byChannel.forEach(channelReport => {
        acc.totalClients += channelReport.totalClients;
        acc.expiringClients += channelReport.expiringClients;
        acc.renewedClients += channelReport.renewedClients;
        acc.renewalRevenue += channelReport.renewalRevenue || 0;
      });
      acc.reportedAEs += 1;
    }
    
    return acc;
  }, {
    totalClients: 0,
    expiringClients: 0,
    renewedClients: 0,
    renewalRevenue: 0,
    reportedAEs: 0
  });

  const weeklyRenewalRate = weeklyAggregation.expiringClients > 0 
    ? (weeklyAggregation.renewedClients / weeklyAggregation.expiringClients) * 100 
    : 0;

  // AE별 이번 주 성과 (매체별 데이터 합산)
  const aeWeeklyPerformance = data.aeData.map(ae => {
    const weeklyReports = ae.weeklyReports || [];
    const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
    
    if (!thisWeekReport || !thisWeekReport.byChannel) {
      return {
        name: ae.name,
        reported: false,
        totalClients: 0,
        expiringClients: 0,
        renewedClients: 0,
        renewalRevenue: 0,
        renewalRate: 0
      };
    }

    // 매체별 데이터를 합산
    const aggregated = thisWeekReport.byChannel.reduce((sum, ch) => ({
      totalClients: sum.totalClients + ch.totalClients,
      expiringClients: sum.expiringClients + ch.expiringClients,
      renewedClients: sum.renewedClients + ch.renewedClients,
      renewalRevenue: sum.renewalRevenue + ch.renewalRevenue
    }), { totalClients: 0, expiringClients: 0, renewedClients: 0, renewalRevenue: 0 });

    const renewalRate = aggregated.expiringClients > 0
      ? (aggregated.renewedClients / aggregated.expiringClients) * 100
      : 0;

    return {
      name: ae.name,
      reported: true,
      ...aggregated,
      renewalRate
    };
  }).sort((a, b) => {
    if (!a.reported && !b.reported) return 0;
    if (!a.reported) return 1;
    if (!b.reported) return -1;
    return (b.renewalRate || 0) - (a.renewalRate || 0);
  });

  // 영업사원 이번 주 신규 매출 집계
  const salesAggregation = data.salesData.reduce((acc, sales) => {
    const weeklyReports = sales.weeklyReports || [];
    const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
    
    if (thisWeekReport) {
      acc.newClients += thisWeekReport.newClients;
      acc.newRevenue += thisWeekReport.newRevenue;
      acc.reportedSales += 1;
    }
    
    return acc;
  }, {
    newClients: 0,
    newRevenue: 0,
    reportedSales: 0
  });

  // 영업사원별 이번 주 성과
  const salesWeeklyPerformance = data.salesData.map(sales => {
    const weeklyReports = sales.weeklyReports || [];
    const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
    return {
      name: sales.name,
      reported: !!thisWeekReport,
      ...thisWeekReport
    };
  }).sort((a, b) => {
    if (!a.reported && !b.reported) return 0;
    if (!a.reported) return 1;
    if (!b.reported) return -1;
    return (b.newRevenue || 0) - (a.newRevenue || 0);
  });

  if (!mounted) {
    // 서버 렌더링 시에는 로딩 상태 표시
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="container mx-auto px-6 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1">
              위플 대시보드
            </h1>
            <p className="text-sm text-gray-400">
              마케팅 성과 종합 분석
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로딩 중...' : '🔄 새로고침'}
            </button>
            <Link 
              href="/ae"
              className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              AE 리포트
            </Link>
            <Link 
              href="/admin"
              className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              데이터 관리
            </Link>
          </div>
        </div>

        {/* 최상단 KPI: 목표 매출 + 신규 매출 + 연장 매출 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 목표 매출 달성률 */}
          <div className="card-elevated rounded-lg p-6">
            <div className="text-xs font-medium text-gray-400 mb-2">🎯 이번달 목표 달성률</div>
            <div className="text-4xl font-bold text-gray-100 number-display mb-3">
              {achievementRate.toFixed(1)}%
            </div>
            
            {/* 게이지 바 */}
            <div className="relative mb-3">
              <div className="w-full h-6 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${
                    achievementRate >= 100 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : achievementRate >= 80
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        : achievementRate >= 60
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                          : 'bg-gradient-to-r from-red-500 to-pink-400'
                  }`}
                  style={{ width: `${Math.min(achievementRate, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">목표: {formatCurrency(data.targetRevenue)}</span>
              <span className="text-blue-400 font-semibold">{formatCurrency(data.currentMonthRevenue.total)}</span>
            </div>
          </div>

          {/* 이번달 신규 매출 */}
          <div className="card-elevated rounded-lg p-6">
            <div className="text-xs font-medium text-gray-400 mb-2">💼 이번달 신규 매출</div>
            <div className="text-4xl font-bold text-green-400 mb-3 number-display">
              {formatCurrency(salesAggregation.newRevenue)}
            </div>
            <div className="text-xs text-gray-500">
              신규 계약 {salesAggregation.newClients}개
            </div>
          </div>

          {/* 이번달 연장 매출 */}
          <div className="card-elevated rounded-lg p-6">
            <div className="text-xs font-medium text-gray-400 mb-2">🔄 이번달 연장 매출</div>
            <div className="text-4xl font-bold text-purple-400 mb-3 number-display">
              {formatCurrency(weeklyAggregation.renewalRevenue)}
            </div>
            <div className="text-xs text-gray-500">
              연장 성공 {weeklyAggregation.renewedClients}개 ({weeklyRenewalRate.toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* 매출 비교 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 지난달 총 매출 */}
          <div className="card-elevated rounded-lg p-5">
            <div className="text-xs font-medium text-gray-400 mb-2">지난달 총 매출</div>
            <div className="text-3xl font-bold text-gray-100 mb-1 number-display">
              {formatCurrency(data.lastMonthRevenue.total)}
            </div>
            <div className="text-xs text-gray-500">전월 실적</div>
          </div>

          {/* 이번달 총 매출 */}
          <div className="card-elevated rounded-lg p-5">
            <div className="text-xs font-medium text-gray-400 mb-2">이번달 총 매출</div>
            <div className="text-3xl font-bold text-blue-400 mb-1 number-display">
              {formatCurrency(data.currentMonthRevenue.total)}
            </div>
            <div className={`text-xs font-semibold ${revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {revenueGrowth > 0 ? '▲' : '▼'} {Math.abs(revenueGrowth).toFixed(1)}% 전월 대비
            </div>
          </div>
        </div>

        {/* 총 광고주 수 */}
        <div className="card-elevated rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-400 mb-2">총 광고주</div>
              <div className="text-3xl font-bold text-gray-100 number-display">
                {data.totalClients.total}개
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-right">
              {data.totalClients.byChannel.map((channel, index) => (
                <div key={index}>
                  <div className="text-xs text-gray-400 mb-1">{channel.channel}</div>
                  <div className="text-lg font-bold text-gray-200 number-display">{channel.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* AE 주간 리포트 집계 */}
          <div className="lg:col-span-3 card-elevated rounded-lg p-6">
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-100 mb-1">이번 주 AE 리포트 집계</h2>
                  <p className="text-xs text-gray-400">{currentWeek} | {weeklyAggregation.reportedAEs}명 / {data.aeData.length}명 제출</p>
                </div>
                <Link 
                  href="/ae"
                  className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  리포트 입력 →
                </Link>
              </div>
            </div>

            {weeklyAggregation.reportedAEs === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">아직 제출된 주간 리포트가 없습니다.</p>
                <p className="text-sm">AE들이 금요일에 리포트를 입력하면 여기에 자동으로 집계됩니다.</p>
              </div>
            ) : (
              <div>
                {/* 주간 집계 KPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                    <div className="text-xs text-gray-400 mb-1">총 담당 업체</div>
                    <div className="text-2xl font-bold text-gray-100 number-display">{weeklyAggregation.totalClients}</div>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                    <div className="text-xs text-yellow-400 mb-1">이번 주 종료 예정</div>
                    <div className="text-2xl font-bold text-yellow-400 number-display">{weeklyAggregation.expiringClients}</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <div className="text-xs text-green-400 mb-1">연장 성공</div>
                    <div className="text-2xl font-bold text-green-400 number-display">{weeklyAggregation.renewedClients}</div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                    <div className="text-xs text-purple-400 mb-1">연장 매출</div>
                    <div className="text-xl font-bold text-purple-400 number-display">
                      {formatCurrency(weeklyAggregation.renewalRevenue)}
                    </div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <div className="text-xs text-blue-400 mb-1">주간 연장율</div>
                    <div className="text-2xl font-bold text-blue-400 number-display">{weeklyRenewalRate.toFixed(1)}%</div>
                  </div>
                </div>

                {/* AE별 성과 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">순위</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">AE</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">담당</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">종료 예정</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">연장 성공</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">연장 매출</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">연장율</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aeWeeklyPerformance.map((ae, index) => (
                        <tr key={ae.name} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                          <td className="py-3 px-4">
                            {ae.reported ? (
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-gray-700/20 text-gray-400'
                              }`}>
                                {index + 1}
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-gray-500">-</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-100">{ae.name}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-gray-100 font-semibold number-display">
                              {ae.reported ? ae.totalClients : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-yellow-400 font-semibold number-display">
                              {ae.reported ? ae.expiringClients : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-green-400 font-semibold number-display">
                              {ae.reported ? ae.renewedClients : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {ae.reported && ae.renewalRevenue ? (
                              <span className="text-purple-400 font-semibold number-display">
                                {formatCurrency(ae.renewalRevenue)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {ae.reported ? (
                              <span className={`text-base font-bold number-display ${
                                (ae.renewalRate || 0) >= 80 ? 'text-green-400' :
                                (ae.renewalRate || 0) >= 60 ? 'text-blue-400' :
                                (ae.renewalRate || 0) >= 40 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {ae.renewalRate?.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {ae.reported ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                                제출 완료
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-700/30 text-gray-500">
                                미제출
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 영업사원 신규 매출 집계 */}
          <div className="lg:col-span-2 card-elevated rounded-lg p-6">
            <div className="border-b border-gray-700/50 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-100 mb-1">💼 이번달 영업사원 신규 매출</h2>
                  <p className="text-xs text-gray-400">{currentWeek} | {salesAggregation.reportedSales}명 / {data.salesData.length}명 제출</p>
                </div>
                <Link 
                  href="/ae"
                  className="btn-secondary px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  리포트 입력 →
                </Link>
              </div>
            </div>

            {salesAggregation.reportedSales === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">아직 제출된 영업사원 리포트가 없습니다.</p>
                <p className="text-sm">영업사원들이 리포트를 입력하면 여기에 자동으로 집계됩니다.</p>
              </div>
            ) : (
              <div>
                {/* 이번달 집계 KPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <div className="text-xs text-green-400 mb-1">이번달 신규 계약</div>
                    <div className="text-2xl font-bold text-green-400 number-display">{salesAggregation.newClients}개</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <div className="text-xs text-blue-400 mb-1">이번달 신규 매출</div>
                    <div className="text-xl font-bold text-blue-400 number-display">
                      {formatCurrency(salesAggregation.newRevenue)}
                    </div>
                  </div>
                </div>

                {/* 영업사원별 성과 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">순위</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">영업사원</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">매체</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">신규 계약</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">신규 매출</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-400">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesWeeklyPerformance.map((sales, index) => (
                        <tr key={sales.name} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                          <td className="py-3 px-4">
                            {sales.reported ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-700/20 text-gray-400'
                              }`}>
                                {index + 1}
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-800/20 text-gray-600">
                                -
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-100">{sales.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            {sales.reported ? (
                              <span className="text-cyan-400 font-medium text-sm">{sales.channel}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-green-400 font-semibold number-display">
                              {sales.reported ? sales.newClients : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {sales.reported ? (
                              <span className="text-blue-400 font-semibold number-display">
                                {formatCurrency(sales.newRevenue || 0)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {sales.reported ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                                제출 완료
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-700/30 text-gray-500">
                                미제출
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 매체별 매출 현황 */}
          <div className="lg:col-span-2 card-elevated rounded-lg p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-100 mb-1">매체별 매출 현황</h2>
              <p className="text-xs text-gray-400">이번달 vs 지난달</p>
            </div>
            <div className="space-y-4">
              {data.currentMonthRevenue.byChannel.map((channel, index) => {
                const lastMonth = data.lastMonthRevenue.byChannel[index].value;
                const currentMonth = channel.value;
                const growth = calculateGrowthRate(currentMonth, lastMonth);
                const maxValue = Math.max(...data.currentMonthRevenue.byChannel.map(c => c.value));
                const percentage = (currentMonth / maxValue) * 100;

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-300">{channel.channel}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-100 number-display">
                          {formatCurrency(currentMonth)}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${growth > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {growth > 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 종료 예정 현황 */}
          <div className="card-elevated rounded-lg p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-100 mb-1">종료 예정 현황</h2>
              <p className="text-xs text-gray-400">계약 종료 알림</p>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-xs text-yellow-400 mb-1">이번달 종료</div>
                <div className="text-3xl font-bold text-yellow-400 number-display">
                  {data.currentMonthExpiring.total}
                </div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="text-xs text-orange-400 mb-1">다음달 종료 예정</div>
                <div className="text-3xl font-bold text-orange-400 number-display">
                  {data.nextMonthExpiring.total}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-700/50">
                <div className="text-xs text-gray-400 mb-2">매체별 이번달 종료</div>
                {data.currentMonthExpiring.byChannel.map((item, index) => (
                  <div key={index} className="flex justify-between py-1.5">
                    <span className="text-xs text-gray-400">{item.channel}</span>
                    <span className="text-xs font-semibold text-gray-200">{item.value}개</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 연장 및 신규 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 연장 현황 */}
          <div className="card-elevated rounded-lg p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-100 mb-1">연장 현황</h2>
              <p className="text-xs text-gray-400">월별 비교</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">지난달</div>
                <div className="text-xl font-bold text-gray-100 mb-1 number-display">
                  {data.lastMonthRenewal.count}개
                </div>
                <div className="text-xs text-green-400 font-semibold">
                  {formatPercent(data.lastMonthRenewal.rate)}
                </div>
              </div>
              <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">이번달</div>
                <div className="text-xl font-bold text-green-400 mb-1 number-display">
                  {data.currentMonthRenewal.count}개
                </div>
                <div className="text-xs text-green-400 font-semibold">
                  {formatPercent(data.currentMonthRenewal.rate)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">매체별 이번달 연장율</div>
              {data.currentMonthRenewal.byChannel.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-300">{item.channel}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{item.count}개</span>
                    <span className="text-sm font-semibold text-green-400">{formatPercent(item.rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 신규 광고주 */}
          <div className="card-elevated rounded-lg p-6">
            <div className="mb-5">
              <h2 className="text-base font-bold text-gray-100 mb-1">신규 광고주</h2>
              <p className="text-xs text-gray-400">월별 비교</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="text-center p-4 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">지난달</div>
                <div className="text-xl font-bold text-gray-100 number-display">
                  {data.lastMonthNewClients.total}개
                </div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-gray-400 mb-2">이번달</div>
                <div className="text-xl font-bold text-blue-400 number-display">
                  {data.currentMonthNewClients.total}개
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">매체별 이번달 신규</div>
              {data.currentMonthNewClients.byChannel.map((item, index) => {
                const maxValue = Math.max(...data.currentMonthNewClients.byChannel.map(c => c.value));
                const percentage = (item.value / maxValue) * 100;
                
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">{item.channel}</span>
                      <span className="text-sm font-semibold text-gray-100">{item.value}개</span>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-400 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AE 성과 테이블 */}
        <div className="card-elevated rounded-lg p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-gray-100 mb-1">AE별 담당 현황</h2>
            <p className="text-xs text-gray-400">총 {data.aeData.reduce((sum, ae) => sum + ae.clientCount, 0)}개 광고주 관리 중</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">순위</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">이름</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">담당 광고주</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">비율</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">진행도</th>
                </tr>
              </thead>
              <tbody>
                {data.aeData
                  .sort((a, b) => b.clientCount - a.clientCount)
                  .map((ae, index) => {
                    const total = data.aeData.reduce((sum, a) => sum + a.clientCount, 0);
                    const percentage = (ae.clientCount / total) * 100;
                    const maxCount = Math.max(...data.aeData.map(a => a.clientCount));
                    const barWidth = (ae.clientCount / maxCount) * 100;

                    return (
                      <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                        <td className="py-4 px-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-700/20 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-100">{ae.name}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-lg font-bold text-gray-100 number-display">{ae.clientCount}</div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="text-sm text-gray-400">{percentage.toFixed(1)}%</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-full bg-gray-800/50 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>위플 마케팅 팀 © 2025</p>
        </div>
      </div>
    </div>
  );
}
