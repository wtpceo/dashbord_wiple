'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 로컬 스토리지 완전 삭제
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();

      // 캐시 삭제 확인
      console.log('✅ 로컬 스토리지 삭제 완료');
      console.log('✅ 세션 스토리지 삭제 완료');

      setCleared(true);

      // 2초 후 대시보드로 리다이렉트
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">캐시 초기화</h1>
        {cleared ? (
          <div>
            <p className="text-green-500 mb-2">✅ 로컬 캐시가 모두 삭제되었습니다!</p>
            <p className="text-gray-400">대시보드로 이동 중...</p>
          </div>
        ) : (
          <p className="text-gray-400">캐시 삭제 중...</p>
        )}
      </div>
    </div>
  );
}