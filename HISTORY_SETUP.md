# 📊 월별 히스토리 시스템 설정 가이드

월별 성과 데이터를 누적하고 추세를 분석할 수 있는 히스토리 시스템이 구축되었습니다.

## 🎯 주요 기능

- **월별 스냅샷 저장**: 매달 말일에 현재 데이터를 자동 저장
- **히든 페이지 접근**: 보안을 위한 랜덤 키가 포함된 URL
- **월별 추세 분석**: 매출, 달성률, 연장율 등 핵심 지표 추이 확인
- **데이터 영구 보존**: 월별 리셋에도 히스토리 데이터는 유지

## 📦 설치 단계

### 1단계: Supabase 테이블 생성

1. Supabase 대시보드에 로그인 (https://supabase.com)
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. 새 쿼리 만들기
5. 프로젝트 루트의 `supabase-monthly-snapshots.sql` 파일 내용 복사
6. SQL 에디터에 붙여넣기
7. **Run** 버튼 클릭하여 실행

✅ 성공 메시지: "monthly_snapshots 테이블이 성공적으로 생성되었습니다!"

### 2단계: 히스토리 페이지 접근

히스토리 페이지 URL (보안을 위해 랜덤 키 포함):
```
https://your-domain.com/analytics/history-x9k2p7
```

또는 대시보드에서:
1. 대시보드 페이지 우측 상단
2. **"📊 히스토리"** 버튼 클릭

### 3단계: 첫 번째 스냅샷 저장

1. 히스토리 페이지로 이동
2. 우측 상단의 **"💾 이번 달 저장"** 버튼 클릭
3. 현재 월의 데이터가 스냅샷으로 저장됨
4. 페이지가 자동으로 새로고침되어 저장된 데이터 표시

## 📊 히스토리 페이지 구성

### 전체 개요 탭
- **월별 매출 추이 테이블**
  - 목표 매출 vs 실제 매출
  - 달성률
  - 신규 매출 / 연장 매출
  - 총 광고주 수

- **월별 연장 현황 테이블**
  - 신규 광고주 수
  - 연장 성공 건수
  - 연장율 추이

### 추가 탭 (개발 예정)
- **AE 성과**: AE별 월별 성과 비교
- **영업사원 성과**: 영업사원별 월별 신규 매출 비교
- **매체별 분석**: 매체별 성장률 추세

## 🔄 자동화 옵션

### 월말 자동 저장 (선택사항)

매달 말일에 자동으로 스냅샷을 저장하려면:

1. Supabase Functions 생성
2. 크론 작업 설정

```sql
-- Supabase Edge Function 예제 (선택사항)
CREATE OR REPLACE FUNCTION auto_save_monthly_snapshot()
RETURNS void AS $$
BEGIN
  -- 매달 말일 23:59에 실행
  -- 현재 dashboard_data의 데이터를 monthly_snapshots에 복사
  INSERT INTO monthly_snapshots (
    id,
    year,
    month,
    snapshot_date,
    data
  )
  SELECT
    TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    NOW(),
    data
  FROM dashboard_data
  WHERE id = 'default'
  ON CONFLICT (id) DO UPDATE
  SET
    snapshot_date = NOW(),
    data = EXCLUDED.data,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

## 🔐 보안 고려사항

### URL 보호
- 히스토리 페이지 URL에는 랜덤 키 `x9k2p7`이 포함되어 있습니다
- 이 URL을 외부에 공유하지 마세요
- 필요시 `src/app/analytics/history-x9k2p7` 폴더명을 변경하여 다른 랜덤 키 사용 가능

### RLS 정책
- Supabase의 RLS(Row Level Security) 정책이 활성화되어 있습니다
- 현재는 모든 사용자가 읽기/쓰기 가능하도록 설정
- 보안 강화가 필요하면 RLS 정책을 수정하세요

## 📝 사용 예시

### 수동 스냅샷 저장
```typescript
// 히스토리 페이지에서 "이번 달 저장" 버튼 클릭
// 또는 코드로 직접 호출:
import { saveCurrentMonthSnapshot } from '@/lib/historyData';
import { useDashboard } from '@/context/DashboardContext';

const { data } = useDashboard();
await saveCurrentMonthSnapshot(data);
```

### 특정 월 데이터 조회
```typescript
import { getMonthlySnapshot } from '@/lib/historyData';

// 2025년 1월 데이터 가져오기
const snapshot = await getMonthlySnapshot(2025, 1);
console.log(snapshot);
```

### 모든 히스토리 조회
```typescript
import { getAllMonthlySnapshots } from '@/lib/historyData';

const allSnapshots = await getAllMonthlySnapshots();
console.log(`총 ${allSnapshots.length}개월 데이터`);
```

## 🎨 커스터마이징

### URL 변경
현재 히스토리 페이지 URL을 변경하려면:

1. 폴더명 변경:
   ```bash
   mv src/app/analytics/history-x9k2p7 src/app/analytics/history-[새로운-랜덤-키]
   ```

2. 대시보드 링크 업데이트:
   ```typescript
   // src/app/dashboard/page.tsx
   <Link href="/analytics/history-[새로운-랜덤-키]">
   ```

### 데이터 보존 기간 설정
스냅샷을 자동으로 삭제하려면 (예: 2년 이상 된 데이터):

```sql
-- Supabase에서 실행
DELETE FROM monthly_snapshots
WHERE snapshot_date < NOW() - INTERVAL '2 years';
```

## 🐛 문제 해결

### 테이블이 생성되지 않음
- Supabase 프로젝트 권한 확인
- SQL 쿼리 실행 에러 메시지 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 스냅샷 저장 실패
- 브라우저 콘솔에서 에러 메시지 확인
- Supabase 연결 상태 확인 (`.env.local` 파일)
- 데이터 크기가 너무 크지 않은지 확인

### 히스토리 페이지가 로드되지 않음
- 올바른 URL로 접근했는지 확인
- 브라우저 캐시 삭제 후 재시도
- 서버 재시작: `npm run dev`

## 📞 지원

추가 질문이나 문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. Supabase 로그 확인
3. GitHub Issues에 문의

---

✅ 모든 설정이 완료되면 월별 성과 데이터를 영구적으로 누적하고 추세를 분석할 수 있습니다!
