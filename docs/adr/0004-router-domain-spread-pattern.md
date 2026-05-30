# 0004. 라우터는 도메인별 RouteObject[] spread로 합성

- 상태: Accepted
- 결정일: 2026-05-05
- 결정자: 프런트엔드 팀

## 맥락

- 여러 도메인(`auth`, `planner`, `collection`, …)이 추가될 예정.
- 단일 `router.tsx`에 라우트가 모두 들어가면 파일이 비대해지고 도메인 경계가 흐려진다.
- 각 도메인은 자체 lazy import·index 리다이렉트·하위 라우트를 갖는다.

## 고려한 대안

- **단일 파일** — 모든 라우트를 `router.tsx`에 정의. 규모가 작을 때 직관적이지만 확장에 약함.
- **JSX 라우트(`BrowserRouter` + `<Routes>`)** — 코드 스플리팅이 까다롭고 라우트 메타데이터를 객체로 다루기 불편.
- **파일 시스템 기반 라우터(Next.js style, Vite 플러그인)** — 컨벤션이 강제되지만 별도 도구 도입 필요. 본 프로젝트엔 과함.
- **도메인별 `RouteObject[]` 모듈 + spread** — 각 도메인이 자기 RouteObject 배열을 default export하고, 루트 `router.tsx`가 `...domainRouter`로 펼침.

## 결정

**도메인별 `RouteObject[]` 파일 + 루트에서 spread** 채택.

- 파일명: `src/routes/<domain>Router.tsx`.
- 각 파일은 `RouteObject[]`를 default export.
- 모든 페이지 컴포넌트는 `React.lazy` + `<Suspense fallback={<Loading/>}>`.
- 파일 상단에 `/* eslint-disable react-refresh/only-export-components */` — RouteObject 상수와 lazy 컴포넌트를 같은 파일에 두기 위한 의도된 disable.

## 결과

긍정적:
- 도메인 추가 시 파일 하나 만들고 루트 라우터의 children에 한 줄 spread만 추가하면 된다.
- 코드 스플리팅이 자연스럽다 — 페이지 단위 lazy.
- 도메인 라우터는 다른 곳에 import해서 부분 사용·테스트하기 쉽다.

부정적:
- `react-refresh/only-export-components` 규칙을 파일별로 disable해야 한다. 신규 진입자가 의도를 모르고 제거할 우려가 있어 주석/문서에 명시.

후속:
- 도메인 안에 다시 중첩 라우터 분할이 필요해지면 `<domain>/<sub>Router.tsx`로 확장. 현재 시점엔 불필요.
