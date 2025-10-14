'use client';

import { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { DashboardData, MarketingChannel, AEName } from '@/types/dashboard';
import Link from 'next/link';

const channels: MarketingChannel[] = ['토탈 마케팅', '퍼포먼스', '배달관리', '브랜드블로그'];
const aeNames: AEName[] = ['이수빈', '최호천', '조아라', '정우진', '김민우', '양주미'];

export default function AdminPage() {
  const { data, updateData, resetData } = useDashboard();
  const [formData, setFormData] = useState<DashboardData>(data);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateData(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('모든 데이터를 초기화하시겠습니까?')) {
      resetData();
      setFormData(data);
    }
  };

  // 매출 업데이트
  const updateRevenue = (
    period: 'lastMonthRevenue' | 'currentMonthRevenue',
    type: 'total' | 'channel',
    channelIndex?: number,
    value?: number
  ) => {
    const newData = { ...formData };
    if (type === 'total' && value !== undefined) {
      newData[period].total = value;
    } else if (type === 'channel' && channelIndex !== undefined && value !== undefined) {
      newData[period].byChannel[channelIndex].value = value;
    }
    setFormData(newData);
  };

  // 광고주 수 업데이트
  const updateClients = (
    field: 'totalClients' | 'nextMonthExpiring' | 'currentMonthExpiring',
    type: 'total' | 'channel',
    channelIndex?: number,
    value?: number
  ) => {
    const newData = { ...formData };
    if (type === 'total' && value !== undefined) {
      newData[field].total = value;
    } else if (type === 'channel' && channelIndex !== undefined && value !== undefined) {
      newData[field].byChannel[channelIndex].value = value;
    }
    setFormData(newData);
  };

  // 연장 데이터 업데이트
  const updateRenewal = (
    period: 'lastMonthRenewal' | 'currentMonthRenewal',
    field: 'count' | 'revenue' | 'rate',
    channelIndex?: number,
    value?: number
  ) => {
    const newData = { ...formData };
    if (channelIndex === undefined) {
      newData[period][field] = value!;
    } else {
      (newData[period].byChannel[channelIndex] as any)[field] = value!;
    }
    setFormData(newData);
  };

  // 신규 광고주 업데이트
  const updateNewClients = (
    period: 'lastMonthNewClients' | 'currentMonthNewClients',
    type: 'total' | 'channel',
    channelIndex?: number,
    value?: number
  ) => {
    const newData = { ...formData };
    if (type === 'total' && value !== undefined) {
      newData[period].total = value;
    } else if (type === 'channel' && channelIndex !== undefined && value !== undefined) {
      newData[period].byChannel[channelIndex].value = value;
    }
    setFormData(newData);
  };

  // AE 데이터 업데이트
  const updateAE = (index: number, value: number) => {
    const newData = { ...formData };
    newData.aeData[index].clientCount = value;
    setFormData(newData);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] cyber-grid">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8 card-elevated p-6 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 bg-purple-400 rounded-full status-indicator"></div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-100">
                  데이터 관리
                </h1>
              </div>
              <p className="text-gray-400 text-sm ml-6">
                대시보드 데이터 입력 및 수정
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link 
                href="/dashboard"
                className="btn-secondary px-5 py-3 rounded-lg text-sm font-semibold"
              >
                ← 대시보드
              </Link>
              <button
                onClick={handleReset}
                className="px-5 py-3 rounded-lg text-sm font-semibold bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                🔄 초기화
              </button>
              <button
                onClick={handleSave}
                className="btn-primary px-5 py-3 rounded-lg text-sm font-semibold"
              >
                💾 저장
              </button>
            </div>
          </div>
          
          {saved && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-400/50 text-green-400 rounded-lg text-sm font-semibold">
              ✅ 데이터가 성공적으로 저장되었습니다
            </div>
          )}
        </div>

        {/* 매출 데이터 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-blue-400 rounded"></div>
            <h2 className="text-xl font-bold text-gray-100">
              💰 매출 데이터
            </h2>
          </div>
          
          {/* 목표 매출 */}
          <div className="mb-6">
            <div className="card-elevated rounded-lg p-6">
              <h3 className="text-base font-bold text-gray-100 mb-4 pb-3 border-b border-gray-700/50">
                이번달 목표 매출
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  목표 매출 (원)
                </label>
                <input
                  type="number"
                  value={formData.targetRevenue}
                  onChange={(e) => setFormData({ ...formData, targetRevenue: parseInt(e.target.value) })}
                  className="input-field w-full px-4 py-3 rounded-lg text-gray-100 number-display text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">이번 달 달성하고자 하는 목표 매출액</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 지난달 매출 */}
            <div className="card-elevated rounded-lg p-6">
              <h3 className="text-base font-bold text-gray-100 mb-4 pb-3 border-b border-gray-700/50">
                지난달 매출
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    총 매출 (원)
                  </label>
                  <input
                    type="number"
                    value={formData.lastMonthRevenue.total}
                    onChange={(e) => updateRevenue('lastMonthRevenue', 'total', undefined, parseInt(e.target.value))}
                    className="input-field w-full px-4 py-2.5 rounded-lg text-gray-100 number-display"
                  />
                </div>
                {channels.map((channel, index) => (
                  <div key={channel}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      {channel} (원)
                    </label>
                    <input
                      type="number"
                      value={formData.lastMonthRevenue.byChannel[index].value}
                      onChange={(e) => updateRevenue('lastMonthRevenue', 'channel', index, parseInt(e.target.value))}
                      className="input-field w-full px-4 py-2 rounded-lg text-gray-100 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 이번달 매출 */}
            <div className="card-elevated rounded-lg p-6">
              <h3 className="text-base font-bold text-gray-100 mb-4 pb-3 border-b border-gray-700/50">
                이번달 매출
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    총 매출 (원)
                  </label>
                  <input
                    type="number"
                    value={formData.currentMonthRevenue.total}
                    onChange={(e) => updateRevenue('currentMonthRevenue', 'total', undefined, parseInt(e.target.value))}
                    className="input-field w-full px-4 py-2.5 rounded-lg text-gray-100 number-display"
                  />
                </div>
                {channels.map((channel, index) => (
                  <div key={channel}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      {channel} (원)
                    </label>
                    <input
                      type="number"
                      value={formData.currentMonthRevenue.byChannel[index].value}
                      onChange={(e) => updateRevenue('currentMonthRevenue', 'channel', index, parseInt(e.target.value))}
                      className="input-field w-full px-4 py-2 rounded-lg text-gray-100 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 광고주 현황 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-purple-400 rounded"></div>
            <h2 className="text-xl font-bold text-gray-100">
              👥 광고주 현황
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { title: '총 광고주 수', field: 'totalClients' as const },
              { title: '이번달 종료', field: 'currentMonthExpiring' as const },
              { title: '다음달 종료 예정', field: 'nextMonthExpiring' as const }
            ].map(({ title, field }) => (
              <div key={field} className="card-elevated rounded-lg p-6">
                <h3 className="text-sm font-bold text-gray-100 mb-3 pb-2 border-b border-gray-700/50">
                  {title}
                </h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={formData[field].total}
                    onChange={(e) => updateClients(field, 'total', undefined, parseInt(e.target.value))}
                    className="input-field w-full px-3 py-2 rounded-lg text-gray-100 text-sm number-display"
                    placeholder="총 개수"
                  />
                  {channels.map((channel, index) => (
                    <input
                      key={channel}
                      type="number"
                      value={formData[field].byChannel[index].value}
                      onChange={(e) => updateClients(field, 'channel', index, parseInt(e.target.value))}
                      className="input-field w-full px-3 py-1.5 rounded text-gray-100 text-xs"
                      placeholder={channel}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 연장 데이터 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-green-400 rounded"></div>
            <h2 className="text-xl font-bold text-gray-100">
              🔄 연장 데이터
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(['lastMonthRenewal', 'currentMonthRenewal'] as const).map((period) => (
              <div key={period} className="card-elevated rounded-lg p-6">
                <h3 className="text-base font-bold text-gray-100 mb-4 pb-3 border-b border-gray-700/50">
                  {period === 'lastMonthRenewal' ? '지난달 연장' : '이번달 연장'}
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">개수</label>
                      <input
                        type="number"
                        value={formData[period].count}
                        onChange={(e) => updateRenewal(period, 'count', undefined, parseInt(e.target.value))}
                        className="input-field w-full px-3 py-2 rounded text-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">매출</label>
                      <input
                        type="number"
                        value={formData[period].revenue}
                        onChange={(e) => updateRenewal(period, 'revenue', undefined, parseInt(e.target.value))}
                        className="input-field w-full px-3 py-2 rounded text-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">연장율%</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData[period].rate}
                        onChange={(e) => updateRenewal(period, 'rate', undefined, parseFloat(e.target.value))}
                        className="input-field w-full px-3 py-2 rounded text-gray-100 text-sm"
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">매체별</p>
                    {channels.map((channel, index) => (
                      <div key={channel} className="grid grid-cols-3 gap-2 mb-2">
                        <input
                          type="number"
                          placeholder={channel.substring(0, 4)}
                          value={formData[period].byChannel[index].count}
                          onChange={(e) => updateRenewal(period, 'count', index, parseInt(e.target.value))}
                          className="input-field px-2 py-1.5 text-xs rounded text-gray-100"
                        />
                        <input
                          type="number"
                          value={formData[period].byChannel[index].revenue}
                          onChange={(e) => updateRenewal(period, 'revenue', index, parseInt(e.target.value))}
                          className="input-field px-2 py-1.5 text-xs rounded text-gray-100"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={formData[period].byChannel[index].rate}
                          onChange={(e) => updateRenewal(period, 'rate', index, parseFloat(e.target.value))}
                          className="input-field px-2 py-1.5 text-xs rounded text-gray-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 신규 광고주 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-yellow-400 rounded"></div>
            <h2 className="text-xl font-bold text-gray-100">
              ✨ 신규 광고주
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(['lastMonthNewClients', 'currentMonthNewClients'] as const).map((period) => (
              <div key={period} className="card-elevated rounded-lg p-6">
                <h3 className="text-sm font-bold text-gray-100 mb-3 pb-2 border-b border-gray-700/50">
                  {period === 'lastMonthNewClients' ? '지난달 신규' : '이번달 신규'}
                </h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={formData[period].total}
                    onChange={(e) => updateNewClients(period, 'total', undefined, parseInt(e.target.value))}
                    className="input-field w-full px-3 py-2 rounded-lg text-gray-100 text-sm number-display"
                    placeholder="총 개수"
                  />
                  {channels.map((channel, index) => (
                    <input
                      key={channel}
                      type="number"
                      value={formData[period].byChannel[index].value}
                      onChange={(e) => updateNewClients(period, 'channel', index, parseInt(e.target.value))}
                      className="input-field w-full px-3 py-1.5 rounded text-gray-100 text-xs"
                      placeholder={channel}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AE별 담당 광고주 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-pink-400 rounded"></div>
            <h2 className="text-xl font-bold text-gray-100">
              👨‍💼 AE별 담당
            </h2>
          </div>
          <div className="card-elevated rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {aeNames.map((name, index) => (
                <div key={name}>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    {name}
                  </label>
                  <input
                    type="number"
                    value={formData.aeData[index].clientCount}
                    onChange={(e) => updateAE(index, parseInt(e.target.value))}
                    className="input-field w-full px-4 py-2 rounded-lg text-gray-100 number-display"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <div className="flex justify-center gap-6 mb-8">
          <button
            onClick={handleReset}
            className="px-10 py-4 rounded-lg font-semibold bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            🔄 데이터 초기화
          </button>
          <button
            onClick={handleSave}
            className="btn-primary px-10 py-4 rounded-lg font-semibold"
          >
            💾 모든 변경사항 저장
          </button>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-gray-700/50 pt-6">
          <div className="text-gray-500 text-xs">
            <p>위플 마케팅 팀 © 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
