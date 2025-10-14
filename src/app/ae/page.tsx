'use client';

import { AEName } from '@/types/dashboard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const aeList: AEName[] = ['이수빈', '최호천', '조아라', '정우진', '김민우', '양주미'];

export default function AELoginPage() {
  const router = useRouter();

  const handleSelectAE = (ae: AEName) => {
    // 클릭하면 바로 해당 AE 페이지로 이동
    router.push(`/ae/${encodeURIComponent(ae)}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              AE 주간 리포트
            </h1>
            <p className="text-sm text-gray-400">
              본인의 이름을 선택하여 리포트를 입력하세요
            </p>
          </div>

          {/* AE 선택 카드 */}
          <div className="card-elevated rounded-lg p-6 mb-6">
            <div className="space-y-3">
              {aeList.map((ae) => (
                <button
                  key={ae}
                  onClick={() => handleSelectAE(ae)}
                  className="w-full p-5 rounded-lg text-left font-semibold transition-all bg-gray-800/30 border-2 border-gray-700/50 text-gray-100 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{ae}</span>
                    <span className="text-gray-500">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 돌아가기 */}
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-300">
              ← 대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

