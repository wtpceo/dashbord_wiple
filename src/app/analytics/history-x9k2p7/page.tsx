'use client';

import { useState, useEffect } from 'react';
import { getAllMonthlySnapshots, generateMonthlyComparisons, saveCurrentMonthSnapshot } from '@/lib/historyData';
import { MonthlySnapshot, MonthlyComparison } from '@/types/history';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useDashboard } from '@/context/DashboardContext';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';

export default function HistoryPage() {
  const { data: currentData } = useDashboard();
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [comparisons, setComparisons] = useState<MonthlyComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'ae' | 'sales' | 'channel'>('overview');

  // Hydration 에러 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 데이터 로드
  useEffect(() => {
    const loadHistoryData = async () => {
      setLoading(true);
      try {
        const allSnapshots = await getAllMonthlySnapshots();
        setSnapshots(allSnapshots);

        const comparisonData = generateMonthlyComparisons(allSnapshots);
        setComparisons(comparisonData);

        console.log('✅ 히스토리 데이터 로드 완료:', allSnapshots.length, '개월');
      } catch (error) {
        console.error('❌ 히스토리 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      loadHistoryData();
    }
  }, [mounted]);

  // 이번 달 스냅샷 저장
  const handleSaveSnapshot = async () => {
    try {
      await saveCurrentMonthSnapshot(currentData);
      alert('✅ 이번 달 데이터가 저장되었습니다!');

      // 데이터 다시 로드
      const allSnapshots = await getAllMonthlySnapshots();
      setSnapshots(allSnapshots);
      const comparisonData = generateMonthlyComparisons(allSnapshots);
      setComparisons(comparisonData);
    } catch (error) {
      console.error('스냅샷 저장 실패:', error);
      alert('❌ 스냅샷 저장에 실패했습니다.');
    }
  };

  if (!mounted || loading) {
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              📊 월별 성과 히스토리
            </h1>
            <p className="text-sm text-gray-400">
              누적된 월별 데이터를 분석하고 추세를 확인하세요
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveSnapshot}
              className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              💾 이번 달 저장
            </button>
            <Link
              href="/dashboard"
              className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              ← 대시보드
            </Link>
          </div>
        </div>

        {/* 데이터 없음 */}
        {snapshots.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-300 mb-2">
              저장된 월별 데이터가 없습니다
            </h2>
            <p className="text-gray-400 mb-6">
              &quot;이번 달 저장&quot; 버튼을 눌러 첫 번째 스냅샷을 생성하세요
            </p>
          </div>
        )}

        {/* 데이터가 있을 때 */}
        {snapshots.length > 0 && (
          <>
            {/* 탭 네비게이션 */}
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setSelectedView('overview')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedView === 'overview'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                📈 전체 개요
              </button>
              <button
                onClick={() => setSelectedView('ae')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedView === 'ae'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                👥 AE 성과
              </button>
              <button
                onClick={() => setSelectedView('sales')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedView === 'sales'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💼 영업사원 성과
              </button>
              <button
                onClick={() => setSelectedView('channel')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  selectedView === 'channel'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                📊 매체별 분석
              </button>
            </div>

            {/* 전체 개요 */}
            {selectedView === 'overview' && (
              <div className="space-y-8">
                {/* 최근 달성률 원형 프로그레스 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {comparisons.slice(-4).map((comp, index) => {
                    const rate = Math.min(comp.achievementRate, 100);
                    const color = rate >= 100 ? '#10B981' : rate >= 80 ? '#3B82F6' : rate >= 60 ? '#F59E0B' : '#EF4444';

                    return (
                      <div key={comp.month} className="card-premium rounded-2xl p-6 text-center">
                        <div className="text-sm text-gray-400 mb-4">{comp.month}</div>
                        <ResponsiveContainer width="100%" height={120}>
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            data={[{ value: rate, fill: color }]}
                            startAngle={90}
                            endAngle={-270}
                          >
                            <RadialBar
                              background={{ fill: '#374151' }}
                              dataKey="value"
                              cornerRadius={10}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="text-3xl font-bold" style={{ color }}>
                          {rate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">목표 달성률</div>
                      </div>
                    );
                  })}
                </div>

                {/* 매출 추이 영역 차트 */}
                <div className="card-premium rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">📈 매출 추이</h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={comparisons}>
                      <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorRenewal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#A855F7" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="actualRevenue"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorActual)"
                        name="총 매출"
                      />
                      <Area
                        type="monotone"
                        dataKey="newRevenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorNew)"
                        name="신규 매출"
                      />
                      <Area
                        type="monotone"
                        dataKey="renewalRevenue"
                        stroke="#A855F7"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRenewal)"
                        name="연장 매출"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 달성률 바 차트 */}
                <div className="card-premium rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">🎯 월별 목표 달성률</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisons}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Legend />
                      <Bar
                        dataKey="achievementRate"
                        name="달성률"
                        radius={[8, 8, 0, 0]}
                      >
                        {comparisons.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.achievementRate >= 100 ? '#10B981' :
                              entry.achievementRate >= 80 ? '#3B82F6' :
                              entry.achievementRate >= 60 ? '#F59E0B' : '#EF4444'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 월별 매출 추이 */}
                <div className="card-premium rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">💰 월별 매출 추이</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">월</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">목표</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">실제 매출</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">달성률</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">신규</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">연장</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">총 광고주</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisons.map((comp, index) => (
                          <tr key={comp.month} className="border-b border-gray-800 hover:bg-gray-800/20">
                            <td className="py-3 px-4 font-semibold text-white">{comp.month}</td>
                            <td className="py-3 px-4 text-right text-gray-300">
                              {formatCurrency(comp.targetRevenue)}
                            </td>
                            <td className="py-3 px-4 text-right text-blue-400 font-bold">
                              {formatCurrency(comp.actualRevenue)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                comp.achievementRate >= 100
                                  ? 'bg-green-500/20 text-green-400'
                                  : comp.achievementRate >= 80
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {comp.achievementRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-green-400">
                              {formatCurrency(comp.newRevenue)}
                            </td>
                            <td className="py-3 px-4 text-right text-purple-400">
                              {formatCurrency(comp.renewalRevenue)}
                            </td>
                            <td className="py-3 px-4 text-right text-white font-semibold">
                              {comp.totalClients}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 월별 연장율 추이 */}
                <div className="card-premium rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">🔄 월별 연장 현황</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">월</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">신규 광고주</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">연장 성공</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">연장율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisons.map((comp) => (
                          <tr key={comp.month} className="border-b border-gray-800 hover:bg-gray-800/20">
                            <td className="py-3 px-4 font-semibold text-white">{comp.month}</td>
                            <td className="py-3 px-4 text-right text-green-400 font-semibold">
                              {comp.newClients}개
                            </td>
                            <td className="py-3 px-4 text-right text-blue-400 font-semibold">
                              {comp.renewedClients}개
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                comp.renewalRate >= 80
                                  ? 'bg-green-500/20 text-green-400'
                                  : comp.renewalRate >= 60
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {comp.renewalRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* AE 성과 */}
            {selectedView === 'ae' && (
              <div className="space-y-8">
                {/* AE별 최근 성과 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {(() => {
                    const allAENames = new Set<string>();
                    snapshots.forEach(snapshot => {
                      snapshot.data.aeData.forEach(ae => allAENames.add(ae.name));
                    });

                    return Array.from(allAENames).map(aeName => {
                      // 최근 월 데이터
                      const latestSnapshot = snapshots[snapshots.length - 1];
                      if (!latestSnapshot) return null;

                      const aeData = latestSnapshot.data.aeData.find(ae => ae.name === aeName);
                      if (!aeData) return null;

                      const weeklyReports = aeData.weeklyReports || [];
                      const aggregated = weeklyReports.reduce((sum, report) => {
                        if (report.byChannel) {
                          report.byChannel.forEach(ch => {
                            sum.expiringClients += ch.expiringClients || 0;
                            sum.renewedClients += ch.renewedClients || 0;
                          });
                        }
                        return sum;
                      }, { expiringClients: 0, renewedClients: 0 });

                      const renewalRate = aggregated.expiringClients > 0
                        ? (aggregated.renewedClients / aggregated.expiringClients) * 100
                        : 0;

                      const color = renewalRate >= 80 ? '#10B981' : renewalRate >= 60 ? '#3B82F6' : '#F59E0B';

                      return (
                        <div key={aeName} className="glass-card rounded-xl p-4 text-center">
                          <div className="text-sm font-semibold text-white mb-2">{aeName}</div>
                          <ResponsiveContainer width="100%" height={80}>
                            <RadialBarChart
                              cx="50%"
                              cy="50%"
                              innerRadius="60%"
                              outerRadius="90%"
                              data={[{ value: renewalRate, fill: color }]}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <RadialBar
                                background={{ fill: '#374151' }}
                                dataKey="value"
                                cornerRadius={10}
                              />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="text-2xl font-bold" style={{ color }}>
                            {renewalRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">연장율</div>
                        </div>
                      );
                    }).filter(Boolean);
                  })()}
                </div>

                {/* AE별 연장율 추이 차트 */}
                <div className="card-premium rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">📈 AE별 연장율 추이</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        type="category"
                        allowDuplicatedCategory={false}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Legend />
                      {(() => {
                        const allAENames = new Set<string>();
                        snapshots.forEach(snapshot => {
                          snapshot.data.aeData.forEach(ae => allAENames.add(ae.name));
                        });

                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

                        return Array.from(allAENames).map((aeName, index) => {
                          const aeMonthlyData = snapshots.map(snapshot => {
                            const aeData = snapshot.data.aeData.find(ae => ae.name === aeName);
                            if (!aeData) return null;

                            const weeklyReports = aeData.weeklyReports || [];
                            const aggregated = weeklyReports.reduce((sum, report) => {
                              if (report.byChannel) {
                                report.byChannel.forEach(ch => {
                                  sum.expiringClients += ch.expiringClients || 0;
                                  sum.renewedClients += ch.renewedClients || 0;
                                });
                              }
                              return sum;
                            }, { expiringClients: 0, renewedClients: 0 });

                            const renewalRate = aggregated.expiringClients > 0
                              ? (aggregated.renewedClients / aggregated.expiringClients) * 100
                              : 0;

                            return {
                              month: snapshot.id,
                              [aeName]: renewalRate
                            };
                          }).filter(Boolean);

                          return (
                            <Line
                              key={aeName}
                              type="monotone"
                              dataKey={aeName}
                              data={aeMonthlyData}
                              stroke={colors[index % colors.length]}
                              strokeWidth={3}
                              name={aeName}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          );
                        });
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* AE별 월별 연장 성과 */}
                {(() => {
                  // 모든 AE 이름 수집
                  const allAENames = new Set<string>();
                  snapshots.forEach(snapshot => {
                    snapshot.data.aeData.forEach(ae => allAENames.add(ae.name));
                  });

                  return Array.from(allAENames).map(aeName => {
                    // 해당 AE의 월별 데이터 수집
                    const monthlyData = snapshots.map(snapshot => {
                      const aeData = snapshot.data.aeData.find(ae => ae.name === aeName);
                      if (!aeData) return null;

                      // 해당 월의 모든 주차 리포트 집계
                      const weeklyReports = aeData.weeklyReports || [];
                      const aggregated = weeklyReports.reduce((sum, report) => {
                        if (report.byChannel) {
                          report.byChannel.forEach(ch => {
                            sum.renewalRevenue += ch.renewalRevenue || 0;
                            sum.expiringClients += ch.expiringClients || 0;
                            sum.renewedClients += ch.renewedClients || 0;
                          });
                        }
                        return sum;
                      }, { renewalRevenue: 0, expiringClients: 0, renewedClients: 0 });

                      const renewalRate = aggregated.expiringClients > 0
                        ? (aggregated.renewedClients / aggregated.expiringClients) * 100
                        : 0;

                      return {
                        month: snapshot.id,
                        ...aggregated,
                        renewalRate
                      };
                    }).filter(Boolean);

                    return (
                      <div key={aeName} className="card-premium rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">👤 {aeName}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">월</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">연장 매출</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">종료 예정</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">연장 성공</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">연장율</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyData.map((data: any) => (
                                <tr key={data.month} className="border-b border-gray-800 hover:bg-gray-800/20">
                                  <td className="py-3 px-4 font-semibold text-white">{data.month}</td>
                                  <td className="py-3 px-4 text-right text-purple-400 font-bold">
                                    {formatCurrency(data.renewalRevenue)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-yellow-400">
                                    {data.expiringClients}개
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-400">
                                    {data.renewedClients}개
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                      data.renewalRate >= 80
                                        ? 'bg-green-500/20 text-green-400'
                                        : data.renewalRate >= 60
                                          ? 'bg-blue-500/20 text-blue-400'
                                          : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                      {data.renewalRate.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* 영업사원 성과 */}
            {selectedView === 'sales' && (
              <div className="space-y-8">
                {/* 영업사원별 최근 성과 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {(() => {
                    const allSalesNames = new Set<string>();
                    snapshots.forEach(snapshot => {
                      snapshot.data.salesData.forEach(sales => allSalesNames.add(sales.name));
                    });

                    return Array.from(allSalesNames).map((salesName, index) => {
                      // 최근 월 데이터
                      const latestSnapshot = snapshots[snapshots.length - 1];
                      if (!latestSnapshot) return null;

                      const salesData = latestSnapshot.data.salesData.find(s => s.name === salesName);
                      if (!salesData) return null;

                      const weeklyReports = salesData.weeklyReports || [];
                      const aggregated = weeklyReports.reduce((sum, report) => {
                        if (report.byChannel) {
                          report.byChannel.forEach(ch => {
                            sum.newRevenue += ch.newRevenue || 0;
                            sum.newClients += ch.newClients || 0;
                          });
                        }
                        return sum;
                      }, { newRevenue: 0, newClients: 0 });

                      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

                      return (
                        <div key={salesName} className="glass-card rounded-xl p-6 text-center">
                          <div className="text-lg font-bold text-white mb-2">{salesName}</div>
                          <div className="text-3xl font-bold text-blue-400 mb-2">
                            {formatCurrency(aggregated.newRevenue)}
                          </div>
                          <div className="text-sm text-gray-400 mb-4">신규 매출</div>
                          <div className="flex justify-center items-center gap-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center`}
                                 style={{ backgroundColor: `${colors[index % colors.length]}20` }}>
                              <span className="text-lg font-bold" style={{ color: colors[index % colors.length] }}>
                                {aggregated.newClients}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">신규 광고주</span>
                          </div>
                        </div>
                      );
                    }).filter(Boolean);
                  })()}
                </div>

                {/* 영업사원별 신규 매출 추이 차트 */}
                <div className="card-premium rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">📈 영업사원별 신규 매출 추이</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={(() => {
                        return snapshots.map(snapshot => {
                          const monthData: any = { month: snapshot.id };

                          const allSalesNames = new Set<string>();
                          snapshot.data.salesData.forEach(sales => allSalesNames.add(sales.name));

                          Array.from(allSalesNames).forEach(salesName => {
                            const salesData = snapshot.data.salesData.find(s => s.name === salesName);
                            if (salesData) {
                              const weeklyReports = salesData.weeklyReports || [];
                              const aggregated = weeklyReports.reduce((sum, report) => {
                                if (report.byChannel) {
                                  report.byChannel.forEach(ch => {
                                    sum.newRevenue += ch.newRevenue || 0;
                                  });
                                }
                                return sum;
                              }, { newRevenue: 0 });

                              monthData[salesName] = aggregated.newRevenue;
                            }
                          });

                          return monthData;
                        });
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      {(() => {
                        const allSalesNames = new Set<string>();
                        snapshots.forEach(snapshot => {
                          snapshot.data.salesData.forEach(sales => allSalesNames.add(sales.name));
                        });

                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

                        return Array.from(allSalesNames).map((salesName, index) => (
                          <Bar
                            key={salesName}
                            dataKey={salesName}
                            fill={colors[index % colors.length]}
                            name={salesName}
                            radius={[8, 8, 0, 0]}
                          />
                        ));
                      })()}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 영업사원별 월별 신규 성과 */}
                {(() => {
                  // 모든 영업사원 이름 수집
                  const allSalesNames = new Set<string>();
                  snapshots.forEach(snapshot => {
                    snapshot.data.salesData.forEach(sales => allSalesNames.add(sales.name));
                  });

                  return Array.from(allSalesNames).map(salesName => {
                    // 해당 영업사원의 월별 데이터 수집
                    const monthlyData = snapshots.map(snapshot => {
                      const salesData = snapshot.data.salesData.find(s => s.name === salesName);
                      if (!salesData) return null;

                      // 해당 월의 모든 주차 리포트 집계
                      const weeklyReports = salesData.weeklyReports || [];
                      const aggregated = weeklyReports.reduce((sum, report) => {
                        if (report.byChannel) {
                          report.byChannel.forEach(ch => {
                            sum.newRevenue += ch.newRevenue || 0;
                            sum.newClients += ch.newClients || 0;
                          });
                        }
                        return sum;
                      }, { newRevenue: 0, newClients: 0 });

                      return {
                        month: snapshot.id,
                        ...aggregated
                      };
                    }).filter(Boolean);

                    return (
                      <div key={salesName} className="card-premium rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">💼 {salesName}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">월</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">신규 매출</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">신규 광고주</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">평균 계약 단가</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyData.map((data: any) => {
                                const avgPrice = data.newClients > 0 ? data.newRevenue / data.newClients : 0;
                                return (
                                  <tr key={data.month} className="border-b border-gray-800 hover:bg-gray-800/20">
                                    <td className="py-3 px-4 font-semibold text-white">{data.month}</td>
                                    <td className="py-3 px-4 text-right text-blue-400 font-bold">
                                      {formatCurrency(data.newRevenue)}
                                    </td>
                                    <td className="py-3 px-4 text-right text-green-400 font-bold">
                                      {data.newClients}개
                                    </td>
                                    <td className="py-3 px-4 text-right text-purple-400">
                                      {formatCurrency(avgPrice)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* 매체별 분석 */}
            {selectedView === 'channel' && (
              <div className="space-y-8">
                {/* 매체별 총 매출 비교 차트 */}
                <div className="card-premium rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-6">📊 매체별 월별 총 매출</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={(() => {
                        const channels = ['토탈 마케팅', '퍼포먼스', '배달관리', '브랜드블로그', '댓글', '미디어', '당근'];

                        return snapshots.map(snapshot => {
                          const monthData: any = { month: snapshot.id };

                          channels.forEach(channel => {
                            const aeRevenue = snapshot.data.aeData.reduce((sum, ae) => {
                              const weeklyReports = ae.weeklyReports || [];
                              return sum + weeklyReports.reduce((reportSum, report) => {
                                if (report.byChannel) {
                                  const channelReport = report.byChannel.find(ch => ch.channel === channel);
                                  return reportSum + (channelReport?.renewalRevenue || 0);
                                }
                                return reportSum;
                              }, 0);
                            }, 0);

                            const salesRevenue = snapshot.data.salesData.reduce((sum, sales) => {
                              const weeklyReports = sales.weeklyReports || [];
                              return sum + weeklyReports.reduce((reportSum, report) => {
                                if (report.byChannel) {
                                  const channelReport = report.byChannel.find(ch => ch.channel === channel);
                                  return reportSum + (channelReport?.newRevenue || 0);
                                }
                                return reportSum;
                              }, 0);
                            }, 0);

                            monthData[channel] = aeRevenue + salesRevenue;
                          });

                          return monthData;
                        });
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="토탈 마케팅" stackId="a" fill="#3B82F6" />
                      <Bar dataKey="퍼포먼스" stackId="a" fill="#8B5CF6" />
                      <Bar dataKey="배달관리" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="브랜드블로그" stackId="a" fill="#EC4899" />
                      <Bar dataKey="댓글" stackId="a" fill="#10B981" />
                      <Bar dataKey="미디어" stackId="a" fill="#6366F1" />
                      <Bar dataKey="당근" stackId="a" fill="#EAB308" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 매체별 월별 매출 추이 */}
                {(() => {
                  // 모든 매체 타입
                  const channels = ['토탈 마케팅', '퍼포먼스', '배달관리', '브랜드블로그', '댓글', '미디어', '당근'];

                  return channels.map(channel => {
                    // 해당 매체의 월별 데이터 수집
                    const monthlyData = snapshots.map(snapshot => {
                      // AE 연장 매출
                      const aeRevenue = snapshot.data.aeData.reduce((sum, ae) => {
                        const weeklyReports = ae.weeklyReports || [];
                        return sum + weeklyReports.reduce((reportSum, report) => {
                          if (report.byChannel) {
                            const channelReport = report.byChannel.find(ch => ch.channel === channel);
                            return reportSum + (channelReport?.renewalRevenue || 0);
                          }
                          return reportSum;
                        }, 0);
                      }, 0);

                      // 영업사원 신규 매출
                      const salesRevenue = snapshot.data.salesData.reduce((sum, sales) => {
                        const weeklyReports = sales.weeklyReports || [];
                        return sum + weeklyReports.reduce((reportSum, report) => {
                          if (report.byChannel) {
                            const channelReport = report.byChannel.find(ch => ch.channel === channel);
                            return reportSum + (channelReport?.newRevenue || 0);
                          }
                          return reportSum;
                        }, 0);
                      }, 0);

                      const totalRevenue = aeRevenue + salesRevenue;

                      return {
                        month: snapshot.id,
                        aeRevenue,
                        salesRevenue,
                        totalRevenue
                      };
                    });

                    // 전월 대비 성장률 계산
                    const dataWithGrowth = monthlyData.map((data, index) => {
                      if (index === 0) return { ...data, growthRate: 0 };
                      const prevRevenue = monthlyData[index - 1].totalRevenue;
                      const growthRate = prevRevenue > 0
                        ? ((data.totalRevenue - prevRevenue) / prevRevenue) * 100
                        : 0;
                      return { ...data, growthRate };
                    });

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
                      <div key={channel} className="card-premium rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${channelColors[channel]}`}></div>
                          <h3 className="text-lg font-bold text-white">{channel}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">월</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">총 매출</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">신규 매출</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">연장 매출</th>
                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">전월 대비</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dataWithGrowth.map((data) => (
                                <tr key={data.month} className="border-b border-gray-800 hover:bg-gray-800/20">
                                  <td className="py-3 px-4 font-semibold text-white">{data.month}</td>
                                  <td className="py-3 px-4 text-right text-white font-bold">
                                    {formatCurrency(data.totalRevenue)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-green-400">
                                    {formatCurrency(data.salesRevenue)}
                                  </td>
                                  <td className="py-3 px-4 text-right text-purple-400">
                                    {formatCurrency(data.aeRevenue)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {data.growthRate !== 0 && (
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        data.growthRate > 0
                                          ? 'bg-green-500/20 text-green-400'
                                          : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {data.growthRate > 0 ? '↑' : '↓'} {Math.abs(data.growthRate).toFixed(1)}%
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
