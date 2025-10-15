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

  // 지난달 매출 데이터는 실제로 저장된 데이터를 사용하고,
  // 현재달 매출은 실제 리포트에서 계산
  let tempLastMonthRevenue = data.lastMonthRevenue.total;
  let tempCurrentMonthRevenue = 0;  // 실제 데이터에서 계산될 것

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

  // 이번달 AE 리포트 집계
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

  // AE별 이번달 성과 (매체별 데이터 합산)
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

  // 영업사원 이번달 신규 매출 집계
  const salesAggregation = data.salesData.reduce((acc, sales) => {
    const weeklyReports = sales.weeklyReports || [];
    const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);

    if (thisWeekReport && thisWeekReport.byChannel) {
      // 매체별 데이터를 합산
      thisWeekReport.byChannel.forEach(channelReport => {
        acc.newClients += channelReport.newClients;
        acc.newRevenue += channelReport.newRevenue;
      });
      acc.reportedSales += 1;
    }

    return acc;
  }, {
    newClients: 0,
    newRevenue: 0,
    reportedSales: 0
  });

  // 영업사원별 이번달 성과 (매체별 데이터 합산)
  const salesWeeklyPerformance = data.salesData.map(sales => {
    const weeklyReports = sales.weeklyReports || [];
    const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);

    if (!thisWeekReport || !thisWeekReport.byChannel) {
      return {
        name: sales.name,
        reported: false,
        newClients: 0,
        newRevenue: 0,
        channel: '' as any
      };
    }

    // 매체별 데이터를 합산
    const aggregated = thisWeekReport.byChannel.reduce((sum, ch) => ({
      newClients: sum.newClients + ch.newClients,
      newRevenue: sum.newRevenue + ch.newRevenue
    }), { newClients: 0, newRevenue: 0 });

    // 가장 많은 매출을 발생시킨 매체 찾기
    const mainChannel = thisWeekReport.byChannel.reduce((prev, current) =>
      current.newRevenue > prev.newRevenue ? current : prev
    );

    return {
      name: sales.name,
      reported: true,
      ...aggregated,
      channel: mainChannel.channel
    };
  }).sort((a, b) => {
    if (!a.reported && !b.reported) return 0;
    if (!a.reported) return 1;
    if (!b.reported) return -1;
    return (b.newRevenue || 0) - (a.newRevenue || 0);
  });

  // ============================================
  // 📊 실제 데이터 기반 계산 (이번 달 전체 집계)
  // ============================================

  // 이번 달의 모든 주차 데이터 집계를 위한 함수
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonth = getCurrentMonth();

  // 이번 달 전체 AE 데이터 집계
  const monthlyAEAggregation = data.aeData.reduce((acc, ae) => {
    const weeklyReports = ae.weeklyReports || [];
    // 이번 달의 모든 주차 리포트 집계
    weeklyReports.forEach(report => {
      if (report.week && report.week.startsWith(currentMonth.substring(0, 7))) {
        if (report.byChannel) {
          report.byChannel.forEach(channelReport => {
            acc.totalClients = Math.max(acc.totalClients, channelReport.totalClients || 0);
            acc.expiringClients += channelReport.expiringClients || 0;
            acc.renewedClients += channelReport.renewedClients || 0;
            acc.renewalRevenue += channelReport.renewalRevenue || 0;
          });
        }
      }
    });
    return acc;
  }, {
    totalClients: 0,
    expiringClients: 0,
    renewedClients: 0,
    renewalRevenue: 0
  });

  // 이번 달 전체 영업사원 데이터 집계
  const monthlySalesAggregation = data.salesData.reduce((acc, sales) => {
    const weeklyReports = sales.weeklyReports || [];
    // 이번 달의 모든 주차 리포트 집계
    weeklyReports.forEach(report => {
      if (report.week && report.week.startsWith(currentMonth.substring(0, 7))) {
        if (report.byChannel) {
          report.byChannel.forEach(channelReport => {
            acc.newClients += channelReport.newClients || 0;
            acc.newRevenue += channelReport.newRevenue || 0;
          });
        }
      }
    });
    return acc;
  }, {
    newClients: 0,
    newRevenue: 0
  });

  // 1. 이번달 신규 매출 = 모든 영업사원들의 매출의 합
  const calculatedNewRevenue = monthlySalesAggregation.newRevenue || salesAggregation.newRevenue;

  // 2. 이번달 연장 매출 = AE들의 연장 매출의 합
  const calculatedRenewalRevenue = monthlyAEAggregation.renewalRevenue || weeklyAggregation.renewalRevenue;

  // 3. 이번달 총 매출 = 신규 매출 + 연장 매출
  const calculatedTotalRevenue = calculatedNewRevenue + calculatedRenewalRevenue;

  // 4. 총 광고주 = AE들이 가지고 있는 광고주의 합 (가장 최근 리포트 기준)
  const calculatedTotalClients = weeklyAggregation.totalClients || monthlyAEAggregation.totalClients;

  // 5. 매체별 매출 현황 = 영업사원과 AE들의 매체별 매출의 합
  const calculatedRevenueByChannel = (() => {
    const channels: { [key: string]: number } = {
      '토탈 마케팅': 0,
      '퍼포먼스': 0,
      '배달관리': 0,
      '브랜드블로그': 0,
      '댓글': 0,
      '미디어': 0,
      '당근': 0
    };

    // AE 연장 매출 집계
    data.aeData.forEach(ae => {
      const weeklyReports = ae.weeklyReports || [];
      const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
      if (thisWeekReport && thisWeekReport.byChannel) {
        thisWeekReport.byChannel.forEach(ch => {
          channels[ch.channel] = (channels[ch.channel] || 0) + ch.renewalRevenue;
        });
      }
    });

    // 영업사원 신규 매출 집계
    data.salesData.forEach(sales => {
      const weeklyReports = sales.weeklyReports || [];
      const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
      if (thisWeekReport && thisWeekReport.byChannel) {
        thisWeekReport.byChannel.forEach(ch => {
          channels[ch.channel] = (channels[ch.channel] || 0) + ch.newRevenue;
        });
      }
    });

    return Object.entries(channels).map(([channel, value]) => ({
      channel: channel as any,
      value
    }));
  })();

  // 6. 종료 예정 현황 = AE들의 광고주 종료 예정의 합
  const calculatedExpiringClients = weeklyAggregation.expiringClients;

  // 7. 연장 현황 = 이번달 AE들의 연장한 업체의 합
  const calculatedRenewedClients = weeklyAggregation.renewedClients;
  const calculatedRenewalRate = calculatedExpiringClients > 0
    ? (calculatedRenewedClients / calculatedExpiringClients) * 100
    : 0;

  // 8. 신규 광고주 = 영업사원들의 광고주 합
  const calculatedNewClients = salesAggregation.newClients;

  // 8-1. 매체별 신규 광고주 수
  const calculatedNewClientsByChannel = (() => {
    const channels: { [key: string]: number } = {
      '토탈 마케팅': 0,
      '퍼포먼스': 0,
      '배달관리': 0,
      '브랜드블로그': 0,
      '댓글': 0,
      '미디어': 0,
      '당근': 0
    };

    // 영업사원 신규 계약 집계
    data.salesData.forEach(sales => {
      const weeklyReports = sales.weeklyReports || [];
      const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
      if (thisWeekReport && thisWeekReport.byChannel) {
        thisWeekReport.byChannel.forEach(ch => {
          channels[ch.channel] = (channels[ch.channel] || 0) + ch.newClients;
        });
      }
    });

    return Object.entries(channels).map(([channel, value]) => ({
      channel: channel as any,
      value
    }));
  })();

  // 9. 매체별 광고주 수
  const calculatedClientsByChannel = (() => {
    const channels: { [key: string]: number } = {
      '토탈 마케팅': 0,
      '퍼포먼스': 0,
      '배달관리': 0,
      '브랜드블로그': 0,
      '댓글': 0,
      '미디어': 0,
      '당근': 0
    };

    // AE 담당 광고주 집계
    data.aeData.forEach(ae => {
      const weeklyReports = ae.weeklyReports || [];
      const thisWeekReport = weeklyReports.find(r => r.week === currentWeek);
      if (thisWeekReport && thisWeekReport.byChannel) {
        thisWeekReport.byChannel.forEach(ch => {
          channels[ch.channel] = (channels[ch.channel] || 0) + ch.totalClients;
        });
      }
    });

    return Object.entries(channels).map(([channel, value]) => ({
      channel: channel as any,
      value
    }));
  })();

  // 최종 계산된 값들
  tempCurrentMonthRevenue = calculatedTotalRevenue;

  // 매출 증가율 계산
  const revenueGrowth = calculateGrowthRate(
    tempCurrentMonthRevenue,
    tempLastMonthRevenue
  );

  // 목표 달성률 계산
  const achievementRate = data.targetRevenue > 0
    ? (tempCurrentMonthRevenue / data.targetRevenue) * 100
    : 0;

  if (!mounted) {
    // 서버 렌더링 시에는 로딩 상태 표시
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
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

        {/* 섹션 1: 핵심 성과 지표 (Hero Section) */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Performance Overview</h2>
            <div className="h-px bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-transparent"></div>
          </div>

          {/* 목표 달성률 - 대형 카드 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 목표 매출 달성률 - 좌측 대형 */}
            <div className="lg:col-span-5 glow-card card-premium rounded-2xl p-10 group hover:scale-[1.01] transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🎯</span>
              <span className="text-base font-medium text-gray-400 uppercase tracking-wider">이번달 목표 달성률</span>
            </div>
            <div className="text-7xl font-bold mb-8">
              <span className="gradient-text-animated number-transition">{achievementRate.toFixed(1)}</span>
              <span className="text-4xl text-gray-400 ml-2">%</span>
            </div>

            {/* 게이지 바 */}
            <div className="relative mb-8">
              <div className="progress-bar w-full h-12 rounded-full">
                <div
                  className={`progress-fill h-12 rounded-full ${
                    achievementRate >= 100
                      ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400'
                      : achievementRate >= 80
                        ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400'
                        : achievementRate >= 60
                          ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-400'
                          : 'bg-gradient-to-r from-red-400 via-red-500 to-pink-400'
                  }`}
                  style={{ width: `${Math.min(achievementRate, 100)}%` }}
                >
                </div>
              </div>
            </div>

            <div className="flex justify-between text-base">
              <span className="text-gray-400">목표</span>
              <span className="text-white font-bold text-lg">{formatCurrency(data.targetRevenue)}</span>
            </div>
            <div className="flex justify-between text-base mt-2">
              <span className="text-gray-400">현재</span>
              <span className="text-blue-400 font-bold text-lg">{formatCurrency(calculatedTotalRevenue)}</span>
            </div>
          </div>

            {/* 우측 매출 지표들 */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 이번달 총 매출 */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">이번달 총 매출</div>
                  <div className="text-3xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {formatCurrency(calculatedTotalRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      revenueGrowth > 0
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">전월 대비</span>
                  </div>
                </div>
              </div>

              {/* 이번달 신규 매출 */}
              <div className="glass-card rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-500">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">신규 매출</span>
            </div>
            <div className="text-3xl font-bold mb-3">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {formatCurrency(calculatedNewRevenue)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
                +{calculatedNewClients}개
              </span>
              <span className="text-xs text-gray-500">신규 계약</span>
            </div>
          </div>

              {/* 이번달 연장 매출 */}
              <div className="glass-card rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-500">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                <span className="text-xl">🔄</span>
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">연장 매출</span>
            </div>
            <div className="text-3xl font-bold mb-3">
              <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                {formatCurrency(calculatedRenewalRevenue)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold">
                {calculatedRenewalRate.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">연장 성공 {calculatedRenewedClients}개</span>
            </div>
          </div>

              {/* 지난달 총 매출 - 비교용 */}
              <div className="neumorphic rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">지난달 총 매출</div>
              <div className="text-3xl font-bold mb-2">
                <span className="text-gray-300">{formatCurrency(tempLastMonthRevenue)}</span>
              </div>
              <div className="text-xs text-gray-500">전월 실적 기준</div>
            </div>
          </div>

        </div>
        </div>
        </div>

        {/* 섹션 2: 클라이언트 현황 */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Client Management</h2>
            <div className="h-px bg-gradient-to-r from-teal-500/50 via-green-500/50 to-transparent"></div>
          </div>

          {/* 총 광고주 수 */}
          <div className="card-premium rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">총 광고주</div>
              <div className="text-4xl font-bold">
                <span className="gradient-text-animated number-transition">{calculatedTotalClients}</span>
                <span className="text-xl text-gray-400 ml-1">개</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {calculatedClientsByChannel.map((channel, index) => {
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-purple-400 to-purple-600',
                  'from-orange-400 to-orange-600',
                  'from-pink-400 to-pink-600'
                ];
                return (
                  <div key={index} className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-2 rounded-xl bg-gradient-to-br ${colors[index]} p-0.5 hover:scale-110 transition-transform duration-300`}>
                      <div className="w-full h-full bg-black/80 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-white number-transition">{channel.value}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{channel.channel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          {/* 클라이언트 상태 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 종료 예정 현황 */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400">종료 예정</h3>
                <span className="text-2xl">⏰</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {calculatedExpiringClients}
              </div>
              <p className="text-xs text-gray-500">이번달 만료 예정 계약</p>
            </div>

            {/* 연장 현황 */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400">연장 성공</h3>
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {calculatedRenewedClients}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">연장율</span>
                <span className="badge-modern bg-green-500/10 text-green-400">
                  {calculatedRenewalRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* 신규 계약 */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-400">신규 계약</h3>
                <span className="text-2xl">🆕</span>
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {calculatedNewClients}
              </div>
              <p className="text-xs text-gray-500">이번달 신규 광고주</p>
            </div>
          </div>
        </div>

        {/* 섹션 3: 팀 성과 리포트 */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Team Performance</h2>
            <div className="h-px bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AE 주간 리포트 집계 */}
          <div className="lg:col-span-3 card-premium rounded-2xl p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                    이번달 AE 리포트 집계
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="badge-modern bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400">
                      {currentWeek}
                    </span>
                    <span className="text-xs text-gray-400">
                      {weeklyAggregation.reportedAEs}명 / {data.aeData.length}명 제출
                    </span>
                  </div>
                </div>
                <Link
                  href="/ae"
                  className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold relative overflow-hidden group"
                >
                  <span>리포트 입력 →</span>
                </Link>
              </div>
            </div>

            {weeklyAggregation.reportedAEs === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">아직 제출된 리포트가 없습니다.</p>
                <p className="text-sm">AE들이 리포트를 입력하면 여기에 자동으로 집계됩니다.</p>
              </div>
            ) : (
              <div>
                {/* 주간 집계 KPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="neumorphic-inset rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">총 담당 업체</div>
                    <div className="text-2xl font-bold text-gray-100 number-display">{weeklyAggregation.totalClients}</div>
                  </div>
                  <div className="glass-card bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                    <div className="text-xs text-yellow-400 mb-1">이번달 종료 예정</div>
                    <div className="text-2xl font-bold text-yellow-400 number-transition">{weeklyAggregation.expiringClients}</div>
                  </div>
                  <div className="glass-card bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                    <div className="text-xs text-green-400 mb-1">연장 성공</div>
                    <div className="text-2xl font-bold text-green-400 number-transition">{weeklyAggregation.renewedClients}</div>
                  </div>
                  <div className="glass-card bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                    <div className="text-xs text-purple-400 mb-1">연장 매출</div>
                    <div className="text-xl font-bold text-purple-400 number-transition">
                      {formatCurrency(weeklyAggregation.renewalRevenue)}
                    </div>
                  </div>
                  <div className="glass-card bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                    <div className="text-xs text-blue-400 mb-1">이번달 연장율</div>
                    <div className="text-2xl font-bold text-blue-400 number-transition">{weeklyRenewalRate.toFixed(1)}%</div>
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
                        <tr key={ae.name} className="border-b border-gray-800/50 hover:bg-gradient-to-r hover:from-transparent hover:via-purple-500/5 hover:to-transparent transition-all duration-300">
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

          </div>

          {/* 영업사원 신규 매출 집계 */}
          <div className="card-premium rounded-2xl p-6 mb-6">
            <div className="border-b border-gray-700/50 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-100 mb-1">💼 이번달 영업사원 신규 매출</h2>
                  <p className="text-xs text-gray-400">이번달 | {salesAggregation.reportedSales}명 / {data.salesData.length}명 제출</p>
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
        </div>

        {/* 섹션 4: 매체별 분석 */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Channel Analysis</h2>
            <div className="h-px bg-gradient-to-r from-orange-500/50 via-yellow-500/50 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 매체별 매출 현황 */}
            <div className="neumorphic rounded-2xl p-6">
              <div className="mb-5">
                <h2 className="text-base font-bold text-gray-100 mb-1">📊 매체별 매출 현황</h2>
                <p className="text-xs text-gray-400">이번달 실적 (AE 연장 + 영업사원 신규)</p>
              </div>
              <div className="space-y-4">
                {calculatedRevenueByChannel.map((channel, index) => {
                  const lastMonthChannel = data.lastMonthRevenue.byChannel.find(c => c.channel === channel.channel);
                  const lastMonth = lastMonthChannel?.value || 0;
                  const currentMonth = channel.value;
                  const growth = calculateGrowthRate(currentMonth, lastMonth);
                  const maxValue = Math.max(...calculatedRevenueByChannel.map(c => c.value));
                  const percentage = maxValue > 0 ? (currentMonth / maxValue) * 100 : 0;

                  const channelColors: { [key: string]: string } = {
                    '토탈 마케팅': 'from-blue-500 to-cyan-400',
                    '퍼포먼스': 'from-purple-500 to-violet-400',
                    '배달관리': 'from-orange-500 to-amber-400',
                    '브랜드블로그': 'from-pink-500 to-rose-400',
                    '댓글': 'from-green-500 to-emerald-400',
                    '미디어': 'from-indigo-500 to-blue-400',
                    '당근': 'from-yellow-500 to-orange-400'
                  };

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">{channel.channel}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-100 number-display">
                            {formatCurrency(currentMonth)}
                          </span>
                          {lastMonth > 0 && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${growth > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {growth > 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${channelColors[channel.channel] || 'from-blue-500 to-cyan-400'} h-2.5 rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 매체별 신규 광고주 */}
            <div className="glass-card rounded-2xl p-6">
              <div className="mb-5">
                <h2 className="text-base font-bold text-gray-100 mb-1">🆕 매체별 신규 광고주</h2>
                <p className="text-xs text-gray-400">이번달 신규 계약 현황</p>
              </div>
              <div className="space-y-4">
                {calculatedNewClientsByChannel.map((item, index) => {
                  const maxValue = Math.max(...calculatedNewClientsByChannel.map(c => c.value));
                  const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                  const channelColors: { [key: string]: string } = {
                    '토탈 마케팅': 'from-blue-400 to-blue-600',
                    '퍼포먼스': 'from-purple-400 to-purple-600',
                    '배달관리': 'from-orange-400 to-orange-600',
                    '브랜드블로그': 'from-pink-400 to-pink-600',
                    '댓글': 'from-green-400 to-green-600',
                    '미디어': 'from-indigo-400 to-indigo-600',
                    '당근': 'from-yellow-400 to-yellow-600'
                  };

                  return (
                    <div key={index} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">{item.channel}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white number-display">{item.value}</span>
                          <span className="text-xs text-gray-500">개</span>
                        </div>
                      </div>
                      {item.value > 0 && (
                        <div className="w-full bg-gray-800/30 rounded-full h-2 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${channelColors[item.channel] || 'from-blue-400 to-blue-600'} h-2 rounded-full transition-all duration-700 ease-out group-hover:shadow-lg`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="pt-4 border-t border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-400">총 신규</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {calculatedNewClients}개
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 섹션 5: AE 성과 테이블 */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">AE Performance Details</h2>
            <div className="h-px bg-gradient-to-r from-cyan-500/50 via-teal-500/50 to-transparent"></div>
          </div>

          <div className="card-premium rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-1">
                  AE별 담당 현황
                </h2>
                <p className="text-xs text-gray-400">총 {calculatedTotalClients}개 광고주 관리 중</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs text-gray-400">실시간 집계</span>
              </div>
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
                  {aeWeeklyPerformance
                    .sort((a, b) => {
                      // 리포트 제출한 AE를 우선 정렬
                      if (!a.reported && !b.reported) return 0;
                      if (!a.reported) return 1;
                      if (!b.reported) return -1;
                      return b.totalClients - a.totalClients;
                    })
                    .map((ae, index) => {
                      const total = aeWeeklyPerformance.filter(a => a.reported).reduce((sum, a) => sum + a.totalClients, 0);
                      const percentage = ae.reported && total > 0 ? (ae.totalClients / total) * 100 : 0;
                      const maxCount = Math.max(...aeWeeklyPerformance.filter(a => a.reported).map(a => a.totalClients));
                      const barWidth = ae.reported && maxCount > 0 ? (ae.totalClients / maxCount) * 100 : 0;

                      return (
                        <tr key={index} className="border-b border-gray-800/50 hover:bg-gradient-to-r hover:from-transparent hover:via-purple-500/5 hover:to-transparent transition-all duration-300">
                          <td className="py-4 px-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-transform hover:scale-110 ${
                              !ae.reported ? 'bg-gray-800/30 text-gray-600' :
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30' :
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/30' :
                              'bg-gray-700/50 text-gray-300'
                            }`}>
                              {ae.reported ? index + 1 : '-'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-gray-100">{ae.name}</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="text-lg font-bold text-gray-100 number-transition">
                              {ae.reported ? ae.totalClients : '-'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="text-sm text-gray-400">
                              {ae.reported ? `${percentage.toFixed(1)}%` : '-'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {ae.reported ? (
                              <div className="w-full bg-gray-800/30 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-violet-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${barWidth}%` }}
                                ></div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">리포트 미제출</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
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