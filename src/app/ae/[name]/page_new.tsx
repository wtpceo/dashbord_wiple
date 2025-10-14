'use client';

import { use, useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { AEName, SalesName, AEWeeklyReport, SalesWeeklyReport, MarketingChannel, AEChannelReport } from '@/types/dashboard';
import { getCurrentWeek, formatDate } from '@/lib/mockData';
import Link from 'next/link';

export default function ReportPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = use(params);
  const personName = decodeURIComponent(encodedName);
  const { data, updateData } = useDashboard();
  const [saved, setSaved] = useState(false);
  
  // AE인지 영업사원인지 확인
  const aeData = data.aeData.find(ae => ae.name === personName);
  const salesData = data.salesData.find(s => s.name === personName);
  const isAE = !!aeData;
  const isSales = !!salesData;
  
  // AE 리포트 폼 - 매체별 데이터
  const channels: MarketingChannel[] = ['토탈 마케팅', '퍼포먼스', '배달관리', '브랜드블로그'];
  
  const [aeChannelData, setAeChannelData] = useState<AEChannelReport[]>(
    channels.map(channel => ({
      channel,
      totalClients: 0,
      expiringClients: 0,
      renewedClients: 0,
      renewalRevenue: 0,
      renewalRate: 0
    }))
  );
  
  const [aeNote, setAeNote] = useState<string>('');

  // 영업사원 리포트 폼
  const [salesFormData, setSalesFormData] = useState<SalesWeeklyReport>({
    week: getCurrentWeek(),
    date: formatDate(new Date()),
    channel: '토탈 마케팅',
    newClients: 0,
    newRevenue: 0,
    note: '',
  });

  useEffect(() => {
    if (aeData && aeData.weeklyReports && aeData.weeklyReports.length > 0) {
      const latestReport = aeData.weeklyReports[0];
      if (latestReport.byChannel && latestReport.byChannel.length > 0) {
        setAeChannelData(latestReport.byChannel);
        setAeNote(latestReport.note || '');
      }
    }
  }, [aeData]);

  // 매체별 데이터 업데이트 헬퍼 함수
  const updateChannelData = (channel: MarketingChannel, field: keyof AEChannelReport, value: number) => {
    setAeChannelData(prev => prev.map(item => {
      if (item.channel === channel) {
        const updated = { ...item, [field]: value };
        // 연장율 자동 계산
        if (field === 'expiringClients' || field === 'renewedClients') {
          updated.renewalRate = updated.expiringClients > 0
            ? (updated.renewedClients / updated.expiringClients) * 100
            : 0;
        }
        return updated;
      }
      return item;
    }));
  };

  // 전체 담당 업체 수 계산
  const totalAEClients = aeChannelData.reduce((sum, item) => sum + item.totalClients, 0);
  const totalExpiring = aeChannelData.reduce((sum, item) => sum + item.expiringClients, 0);
  const totalRenewed = aeChannelData.reduce((sum, item) => sum + item.renewedClients, 0);
  const totalRevenue = aeChannelData.reduce((sum, item) => sum + item.renewalRevenue, 0);
  const overallRenewalRate = totalExpiring > 0 ? (totalRenewed / totalExpiring) * 100 : 0;

  // AE 리포트 제출
  const handleAESubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aeData) return;

    const newReport: AEWeeklyReport = {
      week: getCurrentWeek(),
      date: formatDate(new Date()),
      byChannel: aeChannelData.map(item => ({
        ...item,
        renewalRate: parseFloat(item.renewalRate.toFixed(1))
      })),
      note: aeNote,
    };

    const updatedAeData = data.aeData.map(ae => {
      if (ae.name === personName) {
        const currentReports = ae.weeklyReports || [];
        const existingIndex = currentReports.findIndex(r => r.week === newReport.week);
        const updatedReports = existingIndex >= 0
          ? currentReports.map((r, i) => i === existingIndex ? newReport : r)
          : [...currentReports, newReport];

        return {
          ...ae,
          clientCount: totalAEClients, // 전체 담당 업체 수 업데이트
          weeklyReports: updatedReports.sort((a, b) => b.week.localeCompare(a.week))
        };
      }
      return ae;
    });

    try {
      await updateData({
        ...data,
        aeData: updatedAeData
      });
      setSaved(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('❌ 데이터 저장 실패:', error);
      alert('데이터 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 영업사원 리포트 제출
  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesData) return;

    const updatedSalesData = data.salesData.map(s => {
      if (s.name === personName) {
        const currentReports = s.weeklyReports || [];
        const existingIndex = currentReports.findIndex(r => r.week === salesFormData.week);
        const updatedReports = existingIndex >= 0
          ? currentReports.map((r, i) => i === existingIndex ? salesFormData : r)
          : [...currentReports, salesFormData];

        return {
          ...s,
          weeklyReports: updatedReports.sort((a, b) => b.week.localeCompare(a.week))
        };
      }
      return s;
    });

    try {
      await updateData({
        ...data,
        salesData: updatedSalesData
      });
      setSaved(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('❌ 데이터 저장 실패:', error);
      alert('데이터 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!isAE && !isSales) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">사용자를 찾을 수 없습니다</h1>
          <Link href="/ae" className="text-blue-400 hover:text-blue-300">
            ← 선택으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const weeklyReports = isAE ? (aeData?.weeklyReports || []) : (salesData?.weeklyReports || []);
  const thisWeekReport = weeklyReports.find(r => r.week === getCurrentWeek());

  // 영업사원 페이지
  if (isSales) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="container mx-auto px-6 py-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 mb-1">
                💼 {personName} 주간 리포트
              </h1>
              <p className="text-sm text-gray-400">
                {salesFormData.week} | {salesFormData.date} | 영업사원 (신규 담당)
              </p>
            </div>
            <Link 
              href="/dashboard"
              className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold"
            >
              ← 대시보드로
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 입력 폼 */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSalesSubmit} className="card-elevated rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-100 mb-6">주간 데이터 입력</h2>

                {saved && (
                  <div className="mb-4 p-4 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg text-sm font-semibold">
                    ✅ 데이터가 성공적으로 저장되었습니다
                    <div className="mt-2 text-xs text-green-300">
                      잠시 후 대시보드로 이동합니다...
                    </div>
                  </div>
                )}

                {thisWeekReport && (
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-400/30 text-blue-400 rounded-lg text-sm">
                    ℹ️ 이번 주 리포트가 이미 제출되었습니다. 수정하려면 다시 제출하세요.
                  </div>
                )}

                <div className="space-y-4">
                  {/* 매체 선택 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      신규 계약 매체
                    </label>
                    <select
                      value={salesFormData.channel}
                      onChange={(e) => setSalesFormData({ ...salesFormData, channel: e.target.value as MarketingChannel })}
                      className="input-field w-full px-4 py-3 rounded-lg text-gray-100 text-lg"
                      required
                    >
                      <option value="토탈 마케팅">토탈 마케팅</option>
                      <option value="퍼포먼스">퍼포먼스</option>
                      <option value="배달관리">배달관리</option>
                      <option value="브랜드블로그">브랜드블로그</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">신규 계약한 광고주의 매체를 선택하세요</p>
                  </div>

                  {/* 신규 계약 업체 수 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      신규 계약 업체 수
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={salesFormData.newClients}
                      onChange={(e) => setSalesFormData({ ...salesFormData, newClients: parseInt(e.target.value) || 0 })}
                      className="input-field w-full px-4 py-3 rounded-lg text-gray-100 number-display text-lg"
                      required
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">이번 주에 신규로 계약한 업체 수</p>
                  </div>

                  {/* 신규 계약 매출 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      신규 계약 매출 (원)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={salesFormData.newRevenue}
                      onChange={(e) => setSalesFormData({ ...salesFormData, newRevenue: parseInt(e.target.value) || 0 })}
                      className="input-field w-full px-4 py-3 rounded-lg text-gray-100 number-display text-lg"
                      required
                      min="0"
                      step="1000000"
                      placeholder="예: 50000000"
                    />
                    <p className="text-xs text-gray-500 mt-1">신규 계약 업체들의 총 매출</p>
                  </div>

                  {/* 특이사항 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      특이사항 (선택)
                    </label>
                    <textarea
                      value={salesFormData.note}
                      onChange={(e) => setSalesFormData({ ...salesFormData, note: e.target.value })}
                      className="input-field w-full px-4 py-3 rounded-lg text-gray-100 h-24 resize-none"
                      placeholder="특이사항이나 메모를 입력하세요..."
                    />
                  </div>

                  {/* 제출 버튼 */}
                  <button
                    type="submit"
                    className="btn-primary w-full py-4 rounded-lg font-semibold text-lg"
                  >
                    리포트 제출
                  </button>
                </div>
              </form>
            </div>

            {/* 통계 및 이력 */}
            <div className="space-y-6">
              {/* 주간 요약 */}
              <div className="card-elevated rounded-lg p-6">
                <h3 className="text-base font-bold text-gray-100 mb-4">이번 주 요약</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">매체</span>
                    <span className="text-lg font-bold text-cyan-400">{salesFormData.channel}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">신규 계약</span>
                    <span className="text-lg font-bold text-green-400 number-display">{salesFormData.newClients}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-400">신규 매출</span>
                    <span className="text-lg font-bold text-blue-400 number-display">
                      {salesFormData.newRevenue.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              {/* 최근 리포트 이력 */}
              <div className="card-elevated rounded-lg p-6">
                <h3 className="text-base font-bold text-gray-100 mb-4">최근 리포트</h3>
                {weeklyReports.length === 0 ? (
                  <p className="text-sm text-gray-400">아직 제출된 리포트가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {weeklyReports.slice(0, 5).map((report, index) => (
                      <div key={index} className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-gray-300">{report.week}</div>
                          <div className="text-xs text-gray-500">{report.date}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">매체</span>
                            <span className="font-semibold text-cyan-400">{(report as SalesWeeklyReport).channel}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">신규 계약</span>
                            <span className="font-semibold text-green-400">{(report as SalesWeeklyReport).newClients}개</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">신규 매출</span>
                            <span className="font-semibold text-blue-400">
                              {((report as SalesWeeklyReport).newRevenue || 0).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AE 페이지 - 매체별 입력
  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="container mx-auto px-6 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1">
              🎯 {personName} 주간 리포트 (AE)
            </h1>
            <p className="text-sm text-gray-400">
              {getCurrentWeek()} | {formatDate(new Date())} | 연장 담당
            </p>
          </div>
          <Link 
            href="/dashboard"
            className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold"
          >
            ← 대시보드로
          </Link>
        </div>

        <form onSubmit={handleAESubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* 전체 요약 카드 */}
            <div className="card-elevated rounded-lg p-6">
              <h3 className="text-base font-bold text-gray-100 mb-4">전체 요약</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-400">담당 업체</span>
                  <span className="text-lg font-bold text-gray-100 number-display">{totalAEClients}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-400">종료 예정</span>
                  <span className="text-lg font-bold text-yellow-400 number-display">{totalExpiring}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-400">연장 성공</span>
                  <span className="text-lg font-bold text-green-400 number-display">{totalRenewed}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-400">연장 매출</span>
                  <span className="text-sm font-bold text-purple-400 number-display">
                    {totalRevenue.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-xs text-gray-400">연장율</span>
                  <span className="text-lg font-bold text-blue-400 number-display">{overallRenewalRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* 매체별 입력 카드들 */}
            {aeChannelData.map((channelData, index) => (
              <div key={channelData.channel} className="card-elevated rounded-lg p-6">
                <h3 className="text-base font-bold text-cyan-400 mb-4">{channelData.channel}</h3>
                
                {saved && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg text-xs font-semibold">
                    ✅ 저장 완료
                  </div>
                )}

                <div className="space-y-3">
                  {/* 담당 업체 수 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      담당 업체
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={channelData.totalClients}
                      onChange={(e) => updateChannelData(channelData.channel, 'totalClients', parseInt(e.target.value) || 0)}
                      className="input-field w-full px-3 py-2 rounded-lg text-gray-100 number-display text-sm"
                      required
                      min="0"
                    />
                  </div>

                  {/* 종료 예정 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      종료 예정
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={channelData.expiringClients}
                      onChange={(e) => updateChannelData(channelData.channel, 'expiringClients', parseInt(e.target.value) || 0)}
                      className="input-field w-full px-3 py-2 rounded-lg text-gray-100 number-display text-sm"
                      required
                      min="0"
                    />
                  </div>

                  {/* 연장 성공 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      연장 성공
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={channelData.renewedClients}
                      onChange={(e) => updateChannelData(channelData.channel, 'renewedClients', parseInt(e.target.value) || 0)}
                      className="input-field w-full px-3 py-2 rounded-lg text-gray-100 number-display text-sm"
                      required
                      min="0"
                      max={channelData.expiringClients}
                    />
                  </div>

                  {/* 연장 매출 */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      연장 매출 (원)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={channelData.renewalRevenue}
                      onChange={(e) => updateChannelData(channelData.channel, 'renewalRevenue', parseInt(e.target.value) || 0)}
                      className="input-field w-full px-3 py-2 rounded-lg text-gray-100 number-display text-sm"
                      min="0"
                      step="100000"
                    />
                  </div>

                  {/* 연장율 표시 */}
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-xs text-gray-400">연장율</div>
                    <div className="text-xl font-bold text-blue-400 number-display">
                      {channelData.renewalRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 특이사항 및 제출 버튼 */}
          <div className="card-elevated rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  특이사항 (선택)
                </label>
                <textarea
                  value={aeNote}
                  onChange={(e) => setAeNote(e.target.value)}
                  className="input-field w-full px-4 py-3 rounded-lg text-gray-100 h-32 resize-none"
                  placeholder="이번 주 특이사항이나 메모를 입력하세요..."
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn-primary w-full py-4 rounded-lg font-semibold text-lg"
                >
                  📊 리포트 제출
                </button>
              </div>
            </div>
          </div>

          {saved && (
            <div className="card-elevated rounded-lg p-6 bg-green-500/10 border-2 border-green-400/50">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400 mb-2">
                  ✅ 데이터가 성공적으로 저장되었습니다!
                </div>
                <div className="text-sm text-green-300">
                  잠시 후 대시보드로 이동합니다...
                </div>
              </div>
            </div>
          )}
        </form>

        {/* 최근 리포트 이력 */}
        {weeklyReports.length > 0 && (
          <div className="card-elevated rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-100 mb-4">최근 리포트 이력</h3>
            <div className="space-y-4">
              {weeklyReports.slice(0, 3).map((report, index) => {
                const aeReport = report as AEWeeklyReport;
                const reportTotalClients = aeReport.byChannel?.reduce((sum, ch) => sum + ch.totalClients, 0) || 0;
                const reportTotalExpiring = aeReport.byChannel?.reduce((sum, ch) => sum + ch.expiringClients, 0) || 0;
                const reportTotalRenewed = aeReport.byChannel?.reduce((sum, ch) => sum + ch.renewedClients, 0) || 0;
                const reportTotalRevenue = aeReport.byChannel?.reduce((sum, ch) => sum + ch.renewalRevenue, 0) || 0;
                
                return (
                  <div key={index} className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm font-semibold text-gray-300">{report.week}</div>
                      <div className="text-xs text-gray-500">{report.date}</div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">담당</div>
                        <div className="text-sm font-bold text-gray-200">{reportTotalClients}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">종료</div>
                        <div className="text-sm font-bold text-yellow-400">{reportTotalExpiring}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">연장</div>
                        <div className="text-sm font-bold text-green-400">{reportTotalRenewed}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">매출</div>
                        <div className="text-xs font-bold text-purple-400">{(reportTotalRevenue / 1000000).toFixed(0)}M</div>
                      </div>
                    </div>

                    {aeReport.byChannel && aeReport.byChannel.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {aeReport.byChannel.map((ch, chIndex) => (
                          <div key={chIndex} className="text-xs p-2 bg-gray-900/50 rounded">
                            <div className="text-cyan-400 font-semibold mb-1">{ch.channel}</div>
                            <div className="text-gray-400">
                              {ch.totalClients}개 / {ch.renewedClients}연장 ({ch.renewalRate.toFixed(0)}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

