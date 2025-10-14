'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setResults(prev => [...prev, result]);
    console.log(result);
  };

  const runDebug = async () => {
    setResults([]);

    addResult('🔍 디버그 시작...');

    // 1. Supabase 클라이언트 확인
    const supabase = getSupabaseClient();
    if (!supabase) {
      addResult('❌ Supabase 클라이언트가 없습니다');
      return;
    }
    addResult('✅ Supabase 클라이언트 확인 완료');

    // 2. 환경 변수 확인
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    addResult(`📡 URL: ${url ? url.substring(0, 30) + '...' : '없음'}`);
    addResult(`🔑 KEY: ${key ? key.substring(0, 20) + '...' : '없음'}`);

    // 3. 간단한 SELECT 테스트
    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('id')
        .limit(1);

      if (error) {
        addResult(`❌ SELECT 에러: ${JSON.stringify(error)}`);
        addResult(`에러 타입: ${typeof error}`);
        addResult(`에러 키: ${Object.keys(error).join(', ')}`);
      } else {
        addResult(`✅ SELECT 성공: ${data?.length || 0}개 행`);
      }
    } catch (e: any) {
      addResult(`❌ SELECT 예외: ${e.message}`);
    }

    // 4. INSERT 테스트
    try {
      const testId = `test-${Date.now()}`;
      const { error } = await supabase
        .from('dashboard_data')
        .insert({
          id: testId,
          data: { test: true },
          updated_at: new Date().toISOString()
        });

      if (error) {
        addResult(`❌ INSERT 에러: ${JSON.stringify(error)}`);

        // 에러 객체 상세 분석
        addResult('에러 객체 분석:');
        for (const [key, value] of Object.entries(error)) {
          addResult(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        }
      } else {
        addResult(`✅ INSERT 성공: ${testId}`);

        // 삽입한 데이터 삭제
        await supabase.from('dashboard_data').delete().eq('id', testId);
      }
    } catch (e: any) {
      addResult(`❌ INSERT 예외: ${e.message}`);
    }

    // 5. UPSERT 테스트 (실제 사용하는 방식)
    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .upsert({
          id: 'default',
          data: { debugTest: new Date().toISOString() },
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        addResult(`❌ UPSERT 에러: ${JSON.stringify(error)}`);

        // 에러 상세 정보
        if (error.message) addResult(`  메시지: ${error.message}`);
        if (error.code) addResult(`  코드: ${error.code}`);
        if (error.details) addResult(`  상세: ${error.details}`);
        if (error.hint) addResult(`  힌트: ${error.hint}`);
      } else {
        addResult(`✅ UPSERT 성공`);
        if (data && data.length > 0) {
          addResult(`  반환 데이터: ${data[0].id}`);
        }
      }
    } catch (e: any) {
      addResult(`❌ UPSERT 예외: ${e.message}`);
    }

    // 6. RLS 정책 확인
    try {
      const { data: policies, error } = await supabase
        .rpc('get_policies', { table_name: 'dashboard_data' })
        .limit(10);

      if (error) {
        addResult(`⚠️ RLS 정책 조회 실패 (정상일 수 있음): ${error.message}`);
      } else if (policies) {
        addResult(`📋 RLS 정책: ${policies.length}개`);
      }
    } catch (e: any) {
      // RPC 함수가 없을 수 있음 - 무시
    }

    addResult('✅ 디버그 완료');
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">Supabase 디버그</h1>

        <button
          onClick={runDebug}
          className="btn-primary px-6 py-3 rounded-lg mb-8"
        >
          디버그 실행
        </button>

        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-green-400 font-mono text-sm">
            {results.length === 0 ? '디버그 실행 버튼을 클릭하세요...' : results.join('\n')}
          </pre>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <h2 className="text-lg font-bold text-blue-400 mb-2">해결 방법</h2>
          <ol className="list-decimal list-inside space-y-2 text-white">
            <li>Supabase 대시보드에 접속: https://supabase.com/dashboard</li>
            <li>프로젝트 선택 후 Table Editor 클릭</li>
            <li>dashboard_data 테이블 선택</li>
            <li>RLS Policies 탭에서 정책 확인</li>
            <li>모든 정책 삭제 후 &quot;Disable RLS&quot; 클릭 (테스트용)</li>
            <li>또는 fix_rls_policies.sql 파일 실행</li>
          </ol>
        </div>
      </div>
    </div>
  );
}