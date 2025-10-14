'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { getDashboardData, saveDashboardData, generateMockData } from '@/lib/mockData';

export default function ProductionCheckPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };

  const checkEnvironment = async () => {
    setResults([]);
    setLoading(true);

    try {
      // 1. 환경 변수 확인
      addResult('🔍 환경 변수 확인...');
      const response = await fetch('/api/check-env');
      const env = await response.json();

      addResult(`✅ Supabase URL 설정: ${env.hasSupabaseUrl ? '예' : '❌ 아니오'}`);
      addResult(`✅ Supabase Key 설정: ${env.hasSupabaseKey ? '예' : '❌ 아니오'}`);
      addResult(`📍 환경: ${env.nodeEnv || 'unknown'}`);
      addResult(`🚀 Vercel 환경: ${env.vercelEnv || '로컬'}`);

      // 2. 클라이언트 사이드 환경 변수 확인
      addResult('\n🔍 클라이언트 환경 변수...');
      const clientUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const clientKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      addResult(`✅ Client URL: ${clientUrl ? '설정됨' : '❌ 없음'}`);
      addResult(`✅ Client Key: ${clientKey ? '설정됨' : '❌ 없음'}`);

      // 3. Supabase 연결 테스트
      addResult('\n🔍 Supabase 연결 테스트...');
      const supabase = getSupabaseClient();

      if (!supabase) {
        addResult('❌ Supabase 클라이언트 생성 실패!');
        addResult('⚠️ 환경 변수를 확인하세요.');
        return;
      }

      addResult('✅ Supabase 클라이언트 생성 성공');

      // 4. 데이터 읽기 테스트
      addResult('\n🔍 데이터 읽기 테스트...');
      try {
        const data = await getDashboardData();
        addResult(`✅ 데이터 읽기 성공`);
        addResult(`  - AE: ${data.aeData?.length || 0}명`);
        addResult(`  - 영업사원: ${data.salesData?.length || 0}명`);
        addResult(`  - 목표 매출: ${data.targetRevenue?.toLocaleString() || 0}원`);
      } catch (error) {
        addResult(`❌ 데이터 읽기 실패: ${error}`);
      }

      // 5. 데이터 쓰기 테스트
      addResult('\n🔍 데이터 쓰기 테스트...');
      try {
        const testData = {
          ...generateMockData(),
          testTimestamp: new Date().toISOString()
        };
        await saveDashboardData(testData);
        addResult('✅ 데이터 쓰기 성공');
      } catch (error) {
        addResult(`❌ 데이터 쓰기 실패: ${error}`);
      }

      // 6. 직접 Supabase 쿼리 테스트
      addResult('\n🔍 직접 쿼리 테스트...');
      try {
        const { data, error } = await supabase
          .from('dashboard_data')
          .select('id, updated_at')
          .eq('id', 'default')
          .single();

        if (error) {
          addResult(`❌ 쿼리 에러: ${JSON.stringify(error)}`);
        } else {
          addResult(`✅ 쿼리 성공`);
          addResult(`  - ID: ${data?.id}`);
          addResult(`  - 업데이트: ${data?.updated_at}`);
        }
      } catch (error) {
        addResult(`❌ 쿼리 예외: ${error}`);
      }

    } catch (error) {
      addResult(`❌ 전체 에러: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1419] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          프로덕션 환경 체크
        </h1>

        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-blue-400 mb-2">배포 환경 설정 방법</h2>
          <ol className="list-decimal list-inside space-y-2 text-white text-sm">
            <li>Vercel 대시보드 접속: https://vercel.com/dashboard</li>
            <li>프로젝트 선택 → Settings → Environment Variables</li>
            <li>다음 변수 추가:
              <ul className="ml-6 mt-1 space-y-1">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </li>
            <li>Redeploy 실행</li>
          </ol>
        </div>

        <button
          onClick={checkEnvironment}
          disabled={loading}
          className="btn-primary px-6 py-3 rounded-lg mb-6"
        >
          {loading ? '체크 중...' : '다시 체크'}
        </button>

        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm font-mono">
            {results.length === 0 ?
              <span className="text-gray-400">체크 중...</span> :
              results.map((result, i) => (
                <div key={i} className={
                  result.includes('❌') ? 'text-red-400' :
                  result.includes('✅') ? 'text-green-400' :
                  result.includes('⚠️') ? 'text-yellow-400' :
                  result.includes('🔍') ? 'text-blue-400' :
                  'text-gray-300'
                }>
                  {result}
                </div>
              ))
            }
          </pre>
        </div>

        {results.some(r => r.includes('❌')) && (
          <div className="mt-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <h3 className="text-red-400 font-bold mb-2">문제 해결 방법</h3>
            <div className="text-white text-sm space-y-2">
              <p>1. <strong>환경 변수 누락</strong>: Vercel/Netlify 대시보드에서 환경 변수 설정</p>
              <p>2. <strong>RLS 정책</strong>: Supabase 대시보드에서 RLS 비활성화</p>
              <p>3. <strong>재배포</strong>: 환경 변수 설정 후 반드시 재배포 필요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}