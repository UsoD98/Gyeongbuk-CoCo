# CLAUDE.md

이 파일은 Claude Code가 본 저장소에서 동작할 때 자동으로 읽힌다. 사람이 읽는 문서가 아니라 AI에게 주는 작업 지침이므로 간결·명령형으로 유지한다.

## 프로젝트

**경북 CoCo** — 경상북도 여행 일정·예산을 계획하고 컬렉션으로 관리하는 SPA.

스택: **React 19, TypeScript 6, Vite 8, Tailwind v4, daisyUI, Zustand, react-router-dom 7, axios, react-kakao-login**.

## 명령어

```powershell
npm install          # 의존성 설치
npm run dev          # 개발 서버 (http://localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint 전수 검사
npm run preview      # 빌드 결과 미리보기
```

테스트 러너는 아직 없다. UI 변경은 `npm run dev`로 브라우저 검증.

## 디렉터리

```
src/
├── main.tsx · App.tsx          # 진입점
├── index.css                   # Tailwind v4 + daisyUI + @theme 변수 (전역 CSS는 여기만)
├── api/                        # axios 모듈 (현재 비어 있음)
├── components/{auth,common,layout}/
├── hooks/                      # 커스텀 훅 (현재 비어 있음)
├── pages/<Domain>/<Page>.tsx
├── routes/router.tsx           # createBrowserRouter
│         <domain>Router.tsx    # 도메인별 RouteObject[] (default export)
├── stores/<name>Store.ts       # Zustand
└── utils/cn.ts                 # clsx + tailwind-merge
```

핵심 파일:
- `src/routes/router.tsx` — 루트 라우터. 도메인 라우터를 `...spread`로 합성.
- `src/components/layout/Layout.tsx` — 전역 셸 (Header + main + Footer, 반응형 폭).
- `src/stores/themeStore.ts` — Zustand + localStorage + `data-theme` 동기화 모범 사례.
- `src/utils/cn.ts` — 모든 클래스 합성에 사용.
- `src/index.css` — `@theme` 색상 토큰, daisyUI 테마 활성화, 폰트.
- `.env.development` — `VITE_KAKAO_JAVASCRIPT_KEY`, `VITE_REDIRECT_URI`. 커밋·로그 노출 금지.

## 규칙

**반드시 지킬 것:**
- 모든 앱 코드 import는 `@/` 절대 경로로 작성. 상대 경로 금지.
- 두 개 이상의 Tailwind 클래스를 합치거나 조건부일 때는 `cn()` 사용. 템플릿 문자열 연결 금지.
- 타입 전용 import는 `import type` 명시 (`verbatimModuleSyntax: true`).
- 페이지 컴포넌트는 항상 `React.lazy` + `<Suspense fallback={<Loading/>}>` 패턴.
- 새 도메인 라우터는 `<domain>Router.tsx`로 만들고 `RouteObject[]`를 default export, `router.tsx`에서 `...spread`.
- 컴포넌트 파일 `PascalCase.tsx`, 스토어 `<name>Store.ts`, 라우터 `<domain>Router.tsx`.
- 환경 변수는 반드시 `VITE_` 접두사.
- 커밋 메시지는 `<type>(<scope>) <한국어 설명>` (예: `feat(planner) 일정 선택 UI 추가`).
- 브랜치 기본은 `develop`. `main`은 릴리스 대상.

**하지 말 것:**
- `tailwind.config.js`/`tailwind.config.ts` 생성 금지 (Tailwind v4는 CSS 기반 설정만 사용).
- 페이지·컴포넌트별 별도 `.css` 파일 추가 금지. 전역 스타일은 `src/index.css`에만.
- `BrowserRouter` + JSX 라우트 사용 금지 — `createBrowserRouter`만.
- 도메인 라우터 파일 상단의 `/* eslint-disable react-refresh/only-export-components */` 제거 금지 (의도된 disable).
- `RootLayout.tsx` 삭제 금지 (의도된 placeholder).
- `package-lock.json` 임의 재생성 금지. 패키지 추가는 `npm install <pkg>`로만.
- `.env*` 파일을 커밋·로그·외부 공유에 노출 금지.
- `main` 브랜치에 직접 push 금지. `git reset --hard`, `git push --force`는 사용자 확인 필수.

**작업 종료 전 점검:**
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과 (TS 타입 검사 포함)
- [ ] UI 변경은 `npm run dev`로 모바일·데스크톱 폭 모두 확인

## 환경

- OS: Windows 11. 기본 셸은 **PowerShell 7+**. `2>$null`, `$env:VAR`, `Remove-Item -Recurse -Force` 같은 PS 문법 사용. POSIX 스크립트가 필요하면 `Bash` 도구.
- 패키지 매니저: **npm 고정**. `yarn`/`pnpm` 전환 금지.

## 다른 문서

- 코딩 컨벤션 상세: [CONVENTION.md](./CONVENTION.md)
- 디자인 시스템(색·타이포·컴포넌트 패턴): [DESIGN.md](./DESIGN.md)
- 기여 절차·브랜치 전략·PR 규칙: [CONTRIBUTING.md](./CONTRIBUTING.md)
