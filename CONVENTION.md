# CONVENTION.md

경북 CoCo 코딩 규약. 사람·AI 모두 따른다. 아키텍처 배경은 [CLAUDE.md](./CLAUDE.md), 디자인 토큰은 [DESIGN.md](./DESIGN.md) 참고.

---

## 1. 네이밍

### 1.1 파일

| 종류 | 규칙 | 예 |
| --- | --- | --- |
| 컴포넌트(default export) | `PascalCase.tsx` | `HeaderLayout.tsx`, `Login.tsx` |
| 페이지 | `pages/<Domain>/<Page>.tsx` | `pages/Planner/Planner.tsx` |
| 라우터 모듈 | `<domain>Router.tsx` (camelCase) | `plannerRouter.tsx` |
| Zustand 스토어 | `<name>Store.ts` | `themeStore.ts` |
| 커스텀 훅 | `use<Name>.ts(x)` | `useAuth.ts` |
| 유틸 | `camelCase.ts` | `cn.ts` |

### 1.2 식별자

```ts
// 변수·함수: camelCase
const selectedThemes = [];
function toggleTheme(value: string) {}

// 컴포넌트·타입·인터페이스: PascalCase
function HeaderLayout() {}
interface ThemeState {}
type RouteEntry = RouteObject;

// 상수(불변·전역 의미): UPPER_SNAKE_CASE
const DEFAULT_THEME = 'light';

// 옵션 객체·로컬 상수 배열: camelCase 유지
const themeOptions = [{ value: 'adventure', label: '어드벤처' }];

// boolean: is/has/can/should 접두
const isDrawerOpen = false;
const hasError = false;

// 이벤트 핸들러: handle<Event> 또는 on<Event>
const handleSubmit = () => {};
```

### 1.3 브랜치 · 커밋 메시지

브랜치 네이밍(`<type>/<scope>-<설명>`)과 커밋 메시지(`<type>(<scope>) <설명>`) 규칙은 프로세스 문서인 [CONTRIBUTING.md](./CONTRIBUTING.md)에 단일 정의한다 (type·scope 목록, 예시, Breaking Change 포함). 여기서 중복 기술하지 않는다.

---

## 2. 포맷팅·임포트

Prettier(`.prettierrc`)와 ESLint(`eslint.config.js`)가 자동 강제. 수동으로 손대지 않는다.

- 들여쓰기: **스페이스 2칸**.
- 줄 끝: LF.
- 따옴표: 작은따옴표(`'`). JSX 속성도 동일.
- 세미콜론: 항상.
- trailing comma: `'all'`.
- Tailwind 클래스 정렬: `prettier-plugin-tailwindcss` 자동.

### 임포트 순서

위에서 아래로 한 줄씩 빈 줄 없이, 그룹 사이만 빈 줄.

1. React / 표준 라이브러리
2. 외부 의존성 (`react-router-dom`, `zustand`, `axios`, `lucide-react`, …)
3. 절대 경로 내부 모듈 (`@/components/...`, `@/stores/...`)
4. 사이드 이펙트 CSS (`'react-datepicker/dist/react-datepicker.css'`)

```ts
import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import DatePicker from 'react-datepicker';

import Loading from '@/components/common/Loading.tsx';
import { useThemeStore } from '@/stores/themeStore.ts';
import { cn } from '@/utils/cn.ts';

import 'react-datepicker/dist/react-datepicker.css';
```

### 절대 경로

```ts
// Good
import Layout from '@/components/layout/Layout.tsx';

// Bad — 상대 경로 금지
import Layout from '../../components/layout/Layout';
```

### 타입 import

`verbatimModuleSyntax: true` 이므로 타입만 가져올 때는 `import type` 명시.

```ts
// Good
import type { RouteObject } from 'react-router-dom';
import { Navigate, type RouteObject } from 'react-router-dom'; // 혼합도 OK

// Bad
import { RouteObject } from 'react-router-dom';   // 빌드 에러
```

---

## 3. 폴더·레이어 구조

```
src/
├── api/            # 외부 통신만. UI 의존 금지.
├── components/
│   ├── auth/       # 인증 도메인 위젯
│   ├── common/     # 도메인 무관 재사용 (Loading, ThemeController)
│   └── layout/     # 셸 (Header, Footer, Layout, NotFound)
├── hooks/          # 커스텀 훅. 컴포넌트/페이지에서 import.
├── pages/          # 라우트 종착점. 비즈니스 로직은 여기와 hooks로.
├── routes/         # 라우팅 정의만. JSX 컴포넌트 정의 금지.
├── stores/         # Zustand 글로벌 상태.
└── utils/          # 순수 함수. React/DOM 의존 금지.
```

**레이어 의존 방향(상위 → 하위만 허용):**

```
pages → components → hooks → stores → api → utils
                          ↘ utils
```

- `utils`는 React/DOM/외부 API에 의존하지 않는다.
- `stores`는 컴포넌트를 import하지 않는다.
- `api`는 React 훅을 호출하지 않는다 (axios 인스턴스/함수만).
- `components/common`은 도메인 컴포넌트를 import하지 않는다.
- 역참조가 필요하면 콜백·props로 주입.

---

## 4. 컴포넌트

```tsx
// Good — 함수 선언 + default export
export default function HeaderLayout() {
  const [isOpen, setIsOpen] = useState(false);
  return <header>...</header>;
}

// 보조 컴포넌트가 같은 파일에 있으면 export 분리 검토
// (라우터 모듈처럼 react-refresh를 의식해야 하는 경우는 의도된 disable 주석 유지)
```

- 페이지·라우트 종착 컴포넌트는 default export 1개.
- 기존 `React.FC` 사용 코드(`Loading`, `ThemeController`)는 유지. 신규 코드는 `function` 선언 우선.
- `useEffect`의 이벤트 리스너는 cleanup에서 반드시 제거. (`Index.tsx`가 모범 사례)
- 한국어 UI 텍스트는 인라인 하드코딩. i18n 도입 시 일괄 추출.

---

## 5. 스타일링

세부 토큰·팔레트는 [DESIGN.md](./DESIGN.md) 참고. 여기서는 *코드 작성 규약*만.

### 5.1 `cn()` 사용

```tsx
// Good
<div className={cn('flex', 'items-center', isActive && 'tab-active')} />
<button className={cn('btn', 'btn-primary', disabled && 'btn-disabled')} />

// Bad — 충돌 시 무엇이 이기는지 불명, tailwind-merge 못 탐
<div className={`flex items-center ${isActive ? 'tab-active' : ''}`} />
```

### 5.2 색상

```tsx
// Good — @theme 토큰 또는 daisyUI 시맨틱
<div className="bg-primary-600 text-primary-50" />
<button className="btn btn-primary" />

// Bad — 임의값은 정말 일회성일 때만, 그것도 토큰화 가능하면 토큰으로
<div className="bg-[#007373] text-[#E6F2F2]" />
```

### 5.3 반응형

모바일 우선. 베이스 → `md:` → `lg:` 순.

```tsx
// Good
<main className={cn('w-full', 'px-4', 'lg:max-w-360', 'lg:px-10')} />

// Bad — 데스크톱 기준에서 모바일 덮어쓰기
<main className={cn('lg:px-10', 'max-md:px-4')} />
```

### 5.4 CSS 파일

- 전역 스타일은 `src/index.css`에만.
- 컴포넌트별 `.css` 파일 신규 생성 금지.
- 라이브러리 CSS 오버라이드(`react-datepicker__header` 등)도 `index.css`에 모은다.

---

## 6. 상태 관리

### 6.1 우선순위

```
useState / useReducer  →  Context (드물게)  →  Zustand
```

여러 컴포넌트가 공유하는 값일 때만 Zustand. 단일 트리 안에서 끝나는 상태는 로컬로.

### 6.2 Zustand 스토어 패턴

```ts
// stores/themeStore.ts 패턴 참고
interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem('theme') || 'light',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);                          // 영속화
    document.documentElement.setAttribute('data-theme', theme);    // DOM 부수효과
    set({ theme });
  },
}));

// 모듈 로드 시점 초기화 (새로고침 깜빡임 방지)
const saved = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
```

영속화·DOM 반영 책임은 **setter 내부**에 둔다. 컴포넌트에서 `useEffect`로 sync하지 않는다.

---

## 7. 라우팅

```tsx
// Good — 도메인별 RouteObject[]
/* eslint-disable react-refresh/only-export-components */
const Planner = lazy(() => import('@/pages/Planner/Planner'));

const plannerRouter: RouteObject[] = [
  {
    path: 'planner/',
    children: [
      {
        index: true,
        element: <Suspense fallback={<Loading />}><Planner /></Suspense>,
      },
    ],
  },
];
export default plannerRouter;

// 루트에서 spread
children: [...authRouter, ...plannerRouter, ...collectionRouter]
```

```tsx
// Bad — BrowserRouter + JSX 라우트
<BrowserRouter>
  <Routes>
    <Route path="/planner" element={<Planner />} />
  </Routes>
</BrowserRouter>
```

- `/foo/` index 진입을 다른 경로로 강제하려면 `<Navigate to="login" replace />`.
- 신규 페이지: `pages/<Domain>/<Page>.tsx` → `<domain>Router.tsx`에 lazy 등록 → 루트 라우터에 spread.

---

## 8. API 호출

- HTTP 클라이언트는 `axios`.
- 베이스 URL·인터셉터·에러 변환은 `src/api/`의 공용 인스턴스에 모은다(아직 미구현 — 첫 모듈 추가 시 본 문서 갱신).
- 환경 변수는 `VITE_` 접두사. 그 외 키는 클라이언트에 노출되지 않는다.

```ts
// Good — 도메인별 모듈
// src/api/auth.ts
import { http } from '@/api/http';
export const loginWithKakao = (token: string) =>
  http.post('/auth/kakao', { token });

// Bad — 컴포넌트에서 직접 axios 인스턴스 생성
const res = await axios.create({ baseURL: '...' }).post('/auth/kakao', {});
```

---

## 9. 에러 처리·로깅

- 네트워크 호출은 `try/catch`로 감싸고 사용자에게 의미 있는 메시지를 노출. `console.error`로 원본 에러는 보존.
- 폼/입력 검증 실패는 throw가 아닌 상태로 표현 (`error: string | null`).
- 운영 코드에 `console.log` 디버그 로그를 남기지 않는다. 임시 로그는 PR 머지 전 제거. (현재 `KakoLoginComponent.tsx`의 `console.log`는 디버그용 — 토큰 흐름 정식화 시 제거)
- 외부 키 부재 같은 환경 오류는 컴포넌트가 fallback UI를 노출 (`KakoLoginComponent.tsx`의 alert 패턴).

---

## 10. 주석

- 기본은 **주석 없음**. 식별자 이름과 코드로 의도를 표현.
- 다음 경우에만 주석:
  - 코드만 봐서는 알 수 없는 **이유**(외부 제약, 버그 우회, 의도된 disable 등).
  - 매직 넘버·매직 색상의 출처(피그마 기준값 등).
- 변경 이력·작성자·날짜는 주석에 적지 않는다 — `git log`로.

```tsx
// Good — 왜 disable인지 짧게
/* eslint-disable react-refresh/only-export-components */
// RouteObject 상수와 lazy 컴포넌트를 같은 파일에 두기 위함

// Good — 매직 값의 출처
'lg:max-w-360' /* 피그마 데스크톱 기준 1440px */

// Bad — 무엇을 하는지 자명한 코드 설명
// 사용자가 클릭하면 드로어를 토글한다
const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
```

---

## 11. TypeScript

- `strict: true`. `any` 금지. 외부 타입이 부족하면 `unknown` + narrowing.
- `noUnusedLocals`/`noUnusedParameters` 활성. 의도적 미사용은 `_arg`.
- props 타입은 짧으면 인라인, 길면 같은 파일 상단 `interface XxxProps`.

```tsx
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}
function Button({ label, onClick }: ButtonProps) { ... }

// Bad
function Button(props: any) { ... }
```

---

## 12. 금지 패턴 모음

| 금지 | 대안 |
| --- | --- |
| 상대 경로 import (`../../`) | `@/` 절대 경로 |
| 템플릿 문자열로 Tailwind 클래스 조합 | `cn(...)` |
| `import { Type } from ...` (타입 전용) | `import type { Type }` |
| 페이지별 `.css` 파일 추가 | `index.css` 또는 Tailwind |
| `tailwind.config.js` 생성 | `src/index.css`의 `@theme` |
| `BrowserRouter` + `<Routes>` | `createBrowserRouter` + `RouteObject[]` |
| `console.log` 운영 코드 잔존 | 제거 또는 명시적 디버그 가드 |
| `any` 타입 | `unknown` + 타입 가드 |
| `.env*` 값 커밋·로그 노출 | `.env.example`만 추적, 실값은 비공개 |
