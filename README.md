# Dashboard (대쉬보드)

위플 프로젝트 홈페이지 대쉬보드입니다.

## 🚀 기술 스택

- **Next.js 15** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **ESLint** - 코드 품질 관리

## 📦 시작하기

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 빌드

```bash
npm run build
```

### 프로덕션 서버 실행

```bash
npm start
```

## 📁 프로젝트 구조

```
.
├── src/
│   └── app/
│       ├── layout.tsx      # 루트 레이아웃
│       ├── page.tsx        # 홈페이지
│       └── globals.css     # 글로벌 스타일
├── public/                 # 정적 파일
├── next.config.ts          # Next.js 설정
├── tailwind.config.ts      # Tailwind CSS 설정
├── tsconfig.json           # TypeScript 설정
└── package.json            # 프로젝트 의존성
```

## 🔧 개발 가이드

### 새 페이지 추가

`src/app` 디렉토리에 새 폴더를 만들고 `page.tsx` 파일을 추가하세요.

예: `src/app/about/page.tsx`

```tsx
export default function About() {
  return <div>About Page</div>;
}
```

### 컴포넌트 추가

`src/components` 디렉토리를 만들고 재사용 가능한 컴포넌트를 추가하세요.

### API 라우트 추가

`src/app/api` 디렉토리에 API 라우트를 추가할 수 있습니다.

## 📚 더 알아보기

- [Next.js 문서](https://nextjs.org/docs) - Next.js 기능 및 API 문서
- [Learn Next.js](https://nextjs.org/learn) - 인터랙티브 Next.js 튜토리얼
- [Tailwind CSS 문서](https://tailwindcss.com/docs) - Tailwind CSS 문서

## 🤝 기여하기

이 프로젝트는 위플 프로젝트의 일부입니다.

---

Made with ❤️ by 위플 팀

