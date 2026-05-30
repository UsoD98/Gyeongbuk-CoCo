# 0001. Vite를 빌드 도구로 채택

- 상태: Accepted
- 결정일: 2026-05-01
- 결정자: 프런트엔드 팀

## 맥락

새 SPA를 시작하면서 빌드·개발 서버 도구를 선택해야 했다. 요구사항:

- HMR이 빠를 것 (스타일·컴포넌트 반복 작업이 잦음).
- TypeScript·React 19를 즉시 지원.
- Tailwind v4 공식 플러그인을 곧바로 사용할 수 있을 것.
- 설정 파일 1~2개로 끝나는 단순한 구조.

## 고려한 대안

- **Vite 8** — esbuild/Rolldown 기반. 공식 React 플러그인(`@vitejs/plugin-react`), Tailwind v4용 `@tailwindcss/vite` 플러그인 지원. HMR이 매우 빠르고 설정이 짧다.
- **Next.js** — SSR/ISR/라우팅 등 풀스택 기능 제공. 하지만 본 프로젝트는 백엔드 분리형 SPA이고 SSR이 요구되지 않음. 빌드 규모와 학습 곡선이 과함.
- **Create React App** — 사실상 유지보수 중단(2023~). 후보에서 제외.

## 결정

**Vite 8 + `@vitejs/plugin-react` + `@tailwindcss/vite`** 채택.

## 결과

긍정적:
- `npm run dev` 기동·HMR이 즉각적이라 디자인 반복 속도가 빠르다.
- 설정은 `vite.config.ts` 한 파일에 압축. 절대 경로 alias도 같은 파일에서 처리.
- Tailwind v4 공식 플러그인을 그대로 사용해 설정 표면을 줄였다.

부정적:
- SSR이 필요해지면 별도 도구(Vite SSR, Next.js 마이그레이션 등) 도입을 다시 결정해야 한다.

후속:
- Tailwind v4 채택은 [0002](./0002-tailwind-v4-with-daisyui.md)에 별도 기록.
