import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          {/* 메인 타이틀 */}
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              위플 대시보드
            </span>
          </h1>
          
          <p className="text-lg text-gray-300 mb-12">
            마케팅 성과 분석 플랫폼
          </p>
          
          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/dashboard"
              className="btn-primary px-10 py-4 rounded-lg text-base font-semibold w-full sm:w-auto"
            >
              대시보드 보기
            </Link>
            <Link
              href="/ae"
              className="btn-secondary px-10 py-4 rounded-lg text-base font-semibold w-full sm:w-auto"
            >
              AE 리포트 입력
            </Link>
            <Link
              href="/admin"
              className="btn-secondary px-10 py-4 rounded-lg text-base font-semibold w-full sm:w-auto"
            >
              데이터 관리
            </Link>
          </div>

          {/* 기능 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="card-elevated p-6 rounded-lg hover:-translate-y-1 transition-all text-left">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-blue-400 rounded"></div>
              </div>
              <h2 className="text-lg font-bold mb-2 text-gray-100">매출 분석</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                월별 매출 현황 및 매체별 성과를 한눈에 확인하세요
              </p>
            </div>
            
            <div className="card-elevated p-6 rounded-lg hover:-translate-y-1 transition-all text-left">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-purple-400 rounded"></div>
              </div>
              <h2 className="text-lg font-bold mb-2 text-gray-100">고객 관리</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                광고주 현황과 계약 종료 일정을 체계적으로 관리하세요
              </p>
            </div>
            
            <div className="card-elevated p-6 rounded-lg hover:-translate-y-1 transition-all text-left">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <div className="w-6 h-6 bg-green-400 rounded"></div>
              </div>
              <h2 className="text-lg font-bold mb-2 text-gray-100">성과 추적</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                연장율과 신규 고객 유입을 실시간으로 모니터링하세요
              </p>
            </div>
          </div>

          {/* 푸터 */}
          <div className="mt-16 text-gray-500 text-xs">
            <p>위플 마케팅 팀 © 2025</p>
          </div>
        </div>
      </main>
    </div>
  );
}
