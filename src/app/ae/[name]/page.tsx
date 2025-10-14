'use client';

import { use, useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { AEName, AEWeeklyReport } from '@/types/dashboard';
import { getCurrentWeek, formatDate } from '@/lib/mockData';
import Link from 'next/link';

export default function AEReportPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = use(params);
  const aeName = decodeURIComponent(encodedName) as AEName;
  const { data, updateData } = useDashboard();
  const [saved, setSaved] = useState(false);
  
  const aeData = data.aeData.find(ae => ae.name === aeName);
  
  // weeklyReports가 없으면 빈 배열로 초기화
  const weeklyReports = aeData?.weeklyReports || [];
  
  const [formData, setFormData] = useState<Omit<AEWeeklyReport, 'renewalRate'>>({
    week: getCurrentWeek(),
    date: formatDate(new Date()),
    totalClients: aeData?.clientCount || 0,
    expiringClients: 0,
    renewedClients: 0,
    note: '',
  });

  useEffect(() => {
    if (aeData) {
      setFormData(prev => ({
        ...prev,
        totalClients: aeData.clientCount
      }));
    }
  }, [aeData]);

  const renewalRate = formData.expiringClients > 0 
    ? (formData.renewedClients / formData.expiringClients) * 100 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aeData) return;

    console.log('=== AE 리포트 제출 시작 ===');
    console.log('현재 formData:', formData);

    const newReport: AEWeeklyReport = {
      ...formData,
      renewalRate: parseFloat(renewalRate.toFixed(1)),
    };

    console.log('생성된 리포트:', newReport);

    const updatedAeData = data.aeData.map(ae => {
      if (ae.name === aeName) {
        // weeklyReports가 없으면 빈 배열로 초기화
        const currentReports = ae.weeklyReports || [];
        
        // 같은 주차의 기존 리포트가 있으면 업데이트, 없으면 추가
        const existingIndex = currentReports.findIndex(r => r.week === newReport.week);
        const updatedReports = existingIndex >= 0
          ? currentReports.map((r, i) => i === existingIndex ? newReport : r)
          : [...currentReports, newReport];

        console.log(`${aeName} 업데이트된 리포트 수:`, updatedReports.length);

        return {
          ...ae,
          weeklyReports: updatedReports.sort((a, b) => b.week.localeCompare(a.week))
        };
      }
      return ae;
    });

    const newData = {
      ...data,
      aeData: updatedAeData
    };

    console.log('저장할 전체 데이터:', newData);

    try {
      await updateData(newData);
      console.log('✅ 데이터 저장 완료');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('❌ 데이터 저장 실패:', error);
      alert('데이터 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!aeData) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">AE를 찾을 수 없습니다</h1>
          <Link href="/ae" className="text-blue-400 hover:text-blue-300">
            ← AE 선택으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const thisWeekReport = weeklyReports.find(r => r.week === getCurrentWeek());

  return (
    <div className="min-h-screen bg-[#0f1419]">
      <div className="container mx-auto px-6 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-1">
              {aeName} 주간 리포트
            </h1>
            <p className="text-sm text-gray-400">
              {formData.week} | {formData.date}
            </p>
          </div>
          <Link 
            href="/ae"
            className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-semibold"
          >
            ← AE 선택
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 입력 폼 */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card-elevated rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-100 mb-6">주간 데이터 입력</h2>

              {saved && (
                <div className="mb-4 p-4 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg text-sm font-semibold">
                  ✅ 데이터가 성공적으로 저장되었습니다
                </div>
              )}

              {thisWeekReport && (
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-400/30 text-blue-400 rounded-lg text-sm">
                  ℹ️ 이번 주 리포트가 이미 제출되었습니다. 수정하려면 다시 제출하세요.
                </div>
              )}

              <div className="space-y-4">
                {/* 현재 담당 업체 수 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    현재 담당 업체 수
                  </label>
                  <input
                    type="number"
                    value={formData.totalClients}
                    onChange={(e) => setFormData({ ...formData, totalClients: parseInt(e.target.value) })}
                    className="input-field w-full px-4 py-3 rounded-lg text-gray-100 number-display text-lg"
                    required
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">현재 담당하고 있는 전체 광고주 수</p>
                </div>

                {/* 이번주 종료 예정 업체 수 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    이번주 종료 예정 업체 수
                  </label>
                  <input
                    type="number"
                    value={formData.expiringClients}
                    onChange={(e) => setFormData({ ...formData, expiringClients: parseInt(e.target.value) })}
                    className="input-field w-full px-4 py-3 rounded-lg text-gray-100 number-display text-lg"
                    required
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">이번 주에 계약이 종료되는 업체 수</p>
                </div>

                {/* 연장 성공 업체 수 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    연장 성공 업체 수
                  </label>
                  <input
                    type="number"
                    value={formData.renewedClients}
                    onChange={(e) => setFormData({ ...formData, renewedClients: parseInt(e.target.value) })}
                    className="input-field w-full px-4 py-3 rounded-lg text-gray-100 number-display text-lg"
                    required
                    min="0"
                    max={formData.expiringClients}
                  />
                  <p className="text-xs text-gray-500 mt-1">종료 예정 업체 중 연장에 성공한 업체 수</p>
                </div>

                {/* 연장율 자동 계산 */}
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">연장율 (자동 계산)</div>
                  <div className="text-3xl font-bold text-green-400 number-display">
                    {renewalRate.toFixed(1)}%
                  </div>
                </div>

                {/* 특이사항 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    특이사항 (선택)
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                  <span className="text-sm text-gray-400">담당 업체</span>
                  <span className="text-lg font-bold text-gray-100 number-display">{formData.totalClients}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">종료 예정</span>
                  <span className="text-lg font-bold text-yellow-400 number-display">{formData.expiringClients}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">연장 성공</span>
                  <span className="text-lg font-bold text-green-400 number-display">{formData.renewedClients}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-400">연장율</span>
                  <span className="text-lg font-bold text-green-400 number-display">{renewalRate.toFixed(1)}%</span>
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
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">담당</div>
                          <div className="font-semibold text-gray-200">{report.totalClients}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">종료</div>
                          <div className="font-semibold text-yellow-400">{report.expiringClients}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">연장</div>
                          <div className="font-semibold text-green-400">{report.renewedClients}</div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700/50">
                        <span className="text-xs text-gray-500">연장율: </span>
                        <span className="text-sm font-bold text-green-400">{report.renewalRate}%</span>
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

