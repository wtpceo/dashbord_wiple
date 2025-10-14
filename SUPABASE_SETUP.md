## 🗄️ Supabase 데이터베이스 설정

### 1. 테이블 생성하기

Supabase 대시보드에서 SQL Editor를 열고 아래 SQL을 실행하세요:

```sql
-- dashboard_data 테이블 생성
CREATE TABLE dashboard_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dashboard_data_updated_at BEFORE UPDATE
    ON dashboard_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 비활성화 (개발용)
-- 프로덕션에서는 적절한 정책 설정 필요
ALTER TABLE dashboard_data DISABLE ROW LEVEL SECURITY;

-- 초기 데이터 삽입
INSERT INTO dashboard_data (id, data) 
VALUES ('default', '{}'::jsonb);
```

### 2. 환경 변수 설정

`.env.local` 파일을 열고 아래 값을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**값을 찾는 방법:**
1. Supabase 대시보드 접속
2. Settings → API 메뉴 클릭
3. Project URL과 anon public key 복사

### 3. 서버 재시작

환경 변수를 수정했으므로 개발 서버를 재시작하세요:

```bash
# 현재 서버 중지 (Ctrl + C)
# 다시 시작
npm run dev
```

### 4. 테스트

1. 대시보드 접속: http://localhost:3007
2. 어드민 페이지에서 데이터 입력
3. Supabase 대시보드에서 Table Editor → dashboard_data 확인
4. 다른 브라우저나 시크릿 모드에서도 같은 데이터가 보이는지 확인!

---

## 📝 주의사항

### 보안
- `.env.local` 파일은 절대 Git에 커밋하지 마세요!
- `.gitignore`에 이미 포함되어 있습니다

### 프로덕션 배포 시
1. Vercel/Netlify 등에서 환경 변수 설정
2. Row Level Security (RLS) 활성화
3. 인증 시스템 추가 권장

### 로컬 스토리지 → Supabase 마이그레이션
- 기존 로컬 스토리지 데이터는 자동으로 Supabase에 저장됩니다
- 첫 로드 시 로컬 데이터를 Supabase로 업로드합니다

