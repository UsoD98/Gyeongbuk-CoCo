# Vite + React + TypeScript + Tailwind + DaisyUI + lucide-react 프로젝트 설정 가이드

> 본 문서는 본 프로젝트와 동일한 스택을 **새로 시작**할 때의 단계별 가이드다.
> 현재 저장소의 *현행 구조·규약*은 다음 문서를 본다:
> - 아키텍처·작업 지침: [../CLAUDE.md](../CLAUDE.md)
> - 코딩 컨벤션: [../CONVENTION.md](../CONVENTION.md)
> - 디자인 시스템: [../DESIGN.md](../DESIGN.md)
> - 의사결정 기록: [./adr/](./adr/)

## 1) 절대 경로 설정: `@`

우선 절대 경로 설정을 위해 @types/node 패키지를 개발 의존성으로 설치합니다.

```bash
npm install -D @types/node
```

그리고 Vite 설정 파일인 `vite.config.ts`에서 절대 경로 설정을 추가합니다.

```ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
    },
  },
});
```

또한 TypeScript 설정 파일인 `tsconfig.app.json`에서도 절대 경로 설정
을 추가합니다.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    },
    "strict": true,
    "resolveJsonModule": true,
    "ignoreDeprecations": "6.0"
  }
}
```

> 참고 : 앱 코드의 import는 가능한 한 모두 `@/`를 사용합니다. <br/>
> 현재 프로젝트는 `tsconfig.node.json`도 함께 사용하므로 Vite 설정 파일은 해당 설정의 영향을 받습니다.

## 2) 스타일링 셋업: Tailwind v4 + daisyUI + lucide-react

Tailwind CSS와 daisyUI, lucide-react 아이콘 라이브러리를 설치합니다.

```bash
npm install tailwindcss@latest @tailwindcss/vite@latest daisyui@latest lucide-react
```

그리고 `src/index.css` 파일에서 Tailwind와 daisyUI를 불러옵니다.

```css
@import "tailwindcss";

@plugin "daisyui/index.js";
```

vite.config.ts 파일에서 Tailwind CSS 플러그인을 추가합니다.

```ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
    },
  },
});
```

### 확인 포인트

- Tailwind 4버전 환경이므로 기존 `tailwind.config.ts` 파일은 생성하지 않습니다.
- daisyUI는 Tailwind CSS의 플러그인으로, Tailwind 설정 파일이 없어도 기본 스타일이 적용됩니다. 필요에 따라 daisyUI의 테마 설정을 추가할 수 있습니다.
- lucide-react는 아이콘 라이브러리로, 필요한 아이콘을 컴포넌트로 불러와 사용할 수 있습니다.
- 이제 프로젝트에서 절대 경로와 Tailwind CSS, daisyUI, lucide-react를 활용하여 스타일링을 진행할 수 있습니다.

## 3) 진입점 설정

`src/main.tsx` 파일에서 React 애플리케이션의 진입점을 설정합니다.

```tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from '@/App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App/>
  </StrictMode>
);
```

이제 절대 경로와 Tailwind CSS, daisyUI, lucide-react를 활용하여 개발을 시작할 수 있습니다.

## 4) 클래스 유틸리티: `cn`

tailwind CSS를 사용할 때 발생할 수 있는 클래스 이름의 중복 문제를 해결하기 위해 유틸리티 함수를 추가합니다.
이를 위해 필요한 패키지를 설치합니다.

```bash
npm install clsx tailwind-merge
```

`src/utils/cn.ts` 파일을 생성하여 클래스 이름을 조건부로 조합하는 유틸리티 함수를 추가합니다.

```ts
import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 5) Prettier 설정

`TailWind CSS` 사용 시 클래스명이 길어지는 경우가 많으므로, Prettier 설정을 통해 클래스명을 자동으로 줄바꿈하도록 설정합니다.
터미널에서 Prettier와 Tailwind 정렬 플러그인을 설치합니다.

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

`.prettierrc` 파일을 생성하여 Prettier 설정을 추가합니다.

```json
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/index.css",
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all"
}
```

각 옵션의 의미:

- `plugins` — Tailwind 클래스 정렬 플러그인 등록.
- `tailwindStylesheet` — Tailwind v4에선 설정이 CSS 안의 `@theme`/`@plugin`으로 들어가므로, 플러그인이 클래스 정렬 기준을 잡을 수 있도록 **스타일시트 경로**를 가리킨다. v3 시절의 `tailwindConfig: "./tailwind.config.js"` 옵션은 v4에선 사용하지 않는다 (config 파일 자체가 없다).
- `singleQuote` — 작은따옴표.
- `semi` — 세미콜론 사용.
- `trailingComma: "all"` — 가능한 곳마다 후행 쉼표.

### 확인 포인트

- `prettier-plugin-tailwindcss`가 활성화되면 저장 시 클래스 순서가 자동 정렬된다 — 수동 정렬 금지.
- `.prettierrc`는 표준 JSON이므로 `//` 주석을 넣을 수 없다. 설명이 필요하면 본 문서나 PR에 적는다.

## 6) 레이아웃 및 라우터 설정

React Router를 설치하여 라우팅 기능을 추가합니다.

```bash
npm install react-router-dom
```

그리고 `src/routes/router.tsx` 파일에서 라우터 설정을 추가합니다.

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout.tsx';
import Loading from '@/components/common/Loading.tsx';
import NotFound from '@/components/layout/NotFoundLayout.tsx';

const LoadingComponent = <Loading />;
const Index = lazy(() => import('@/pages/Index'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={LoadingComponent}>
            <Index />
          </Suspense>
        ),
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
```

> 현행 본 저장소는 도메인별 라우터(`<domain>Router.tsx`)를 만들고 루트에서 `...spread`로 합성한다.
> 자세한 패턴은 [ADR 0004](./adr/0004-router-domain-spread-pattern.md) 참고. `RootLayout`은 도메인별 중간 레이아웃이 필요해질 때 활용할 placeholder로 남겨두었다.

이제 `src/App.tsx` 파일에서 라우터를 불러와 애플리케이션의 루트 컴포넌트로 설정합니다.

```tsx
import AppRouter from '@/routes/router.tsx';

export default function App() {
  return <AppRouter/>;
}
```

### 확인 포인트

- `createBrowserRouter`를 사용하여 라우터를 설정하고, `RouterProvider`로 애플리케이션에 라우터를 제공합니다.
- `Suspense`를 사용하여 라우트 컴포넌트가 로드되는 동안 로딩 컴포넌트를 표시합니다.
- `Lazy`를 사용하여 라우트 컴포넌트를 동적으로 불러와 초기 로딩 시간을 줄입니다.
- 각 path에 대한 레이아웃과 에러 페이지를 설정하여 사용자 경험을 향상시킵니다.
- `children` 배열을 사용하여 중첩된 라우트를 설정할 수 있습니다. 예를 들어, `/about` 경로를 추가하려면 `children` 배열에 새로운 객체를 추가하면 됩니다.
- `children` 내에서도 새로운 `<domain>Router.tsx` 파일을 만들어 라우팅 설정을 분리할 수 있습니다. 예를 들어, `src/routes/userRouter.tsx` 파일을 만들어 `/user` 경로에
  대한 라우팅 설정을 추가할 수 있습니다.

router 설정에 포함되는 레이아웃 및 Index 페이지 컴포넌트는 각각 구현하시면 됩니다. 이제 라우팅이 설정된 React 애플리케이션을 개발할 수 있습니다.

## 7) 상태 관리: `Zustand`

상태 관리를 위해 `Zustand` 라이브러리를 설치합니다.
상태 관리란 애플리케이션의 상태를 중앙에서 관리하는 것을 의미합니다. 이를 통해 컴포넌트 간에 상태를 쉽게 공유하고 관리할 수 있습니다.

```bash
npm install zustand
```

daisyUI를 설치하였으니 테마 설정을 상태 관리 라이브러리를 통해 유지 및 관리할 수 있습니다.
`src/stores/themeStore.ts` 파일을 생성하여 테마 상태를 관리하는 Zustand 스토어를 설정합니다.

```ts
import { create } from 'zustand';

export const themes = ['light', 'dark'];

interface ThemeState {
  theme: string;
  setTheme: (theme: string) => void;
  nextTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  // 초기 테마 설정 (시스템 테마나 로컬 스토리지 사용 가능)
  theme: localStorage.getItem('theme') || themes[0],

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  nextTheme: () => {
    const { theme, setTheme } = useThemeStore.getState();
    const currentIndex = themes.indexOf(theme);
    // 다음 인덱스 계산 (마지막이면 다시 0으로)
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  },
}));

// 초기 실행 시 스토어 테마 적용
const savedTheme = localStorage.getItem('theme') || themes[0];
document.documentElement.setAttribute('data-theme', savedTheme);
```

> daisyUI에는 `cupcake`, `bumblebee`, `emerald`, `corporate` 등 추가 테마가 있다.
> 활성화하려면 ① `src/index.css`의 `@plugin "daisyui/index.js" { themes: ... }` 목록과 ② 위 `themes` 배열에 함께 추가한다. 본 저장소는 light/dark만 노출한다.

`useThemeStore` 훅을 사용하여 현재 테마 상태를 가져오고, `nextTheme` 함수를 호출하여 다음 테마로 전환하는 버튼을 구현합니다. 버튼을 클릭할 때마다 테마가 변경되고, 변경된 테마는 로컬
스토리지에 저장되어 페이지를 새로고침해도 유지됩니다.

라우터 설정을 위해 생성한 Index 페이지에서 테마 전환 버튼을 추가하여 Zustand 스토어를 활용하는 예시입니다.

```tsx
import {useThemeStore} from "@/stores/themeStore.ts";

export default function Index() {
  const {theme, nextTheme} = useThemeStore();

  return (
    <>
      {/* 테마 토글 버튼 */}
      <div className="p-10 text-center">
        <h1 className="text-4xl font-bold mb-4">테마: {theme}</h1>
        <p className="py-4 text-base-content/80">
          Tailwind v4와 daisyUI, Zustand로 구현한 테마입니다.
        </p>
        <button className="btn btn-accent" onClick={nextTheme}>Toggle Button</button>
      </div>
    </>
  )
}
```

### 확인 포인트

- Zustand를 사용하여 테마 상태를 중앙에서 관리하고, 컴포넌트에서 쉽게 접근할 수 있도록 설정합니다.
- 테마 전환 버튼을 클릭할 때마다 `nextTheme` 함수를 호출하여 다음 테마로 전환합니다.
- 변경된 테마는 로컬 스토리지에 저장되어 페이지를 새로고침해도 유지됩니다.
- `data-theme` 속성을 사용하여 daisyUI의 테마를 적용합니다. 이를 통해 Tailwind CSS와 daisyUI의 스타일이 자동으로 변경됩니다.
- Zustand 스토어는 다른 상태 관리에도 활용할 수 있으므로, 테마 외에도 애플리케이션의 다른 상태를 관리하는 데 사용할 수 있습니다.
- 예를 들어, 사용자 인증 상태, 애플리케이션 설정 등을 Zustand 스토어로 관리할 수 있습니다.

---

## 8) 그 다음 단계

본 가이드는 *기본 스택 셋업*까지를 다룬다. 본 저장소에 이미 적용된 추가 항목은 다음과 같다 — 새 환경에 도입할 땐 코드와 ADR을 참고한다.

- **HTTP 클라이언트(axios)** — `src/api/`에 도메인별 모듈을 두고 공용 인스턴스에서 베이스 URL·인터셉터를 관리. 환경 변수는 `VITE_` 접두사.
- **카카오 OAuth(`react-kakao-login`)** — JS 키를 `.env.development`의 `VITE_KAKAO_JAVASCRIPT_KEY`로 주입. 결정 배경은 [ADR 0006](./adr/0006-kakao-login-via-react-kakao-login.md).
- **날짜 입력** — `react-datepicker` (범위 선택). 라이브러리 CSS는 사용 컴포넌트에서 1회 import.
- **아이콘** — `lucide-react`. 기본 크기 `size={20}`.
- **ESLint** — `js.recommended`, `tseslint.recommended`, `react-hooks.flat.recommended`, `react-refresh.vite`. 도메인 라우터 파일 상단의 `/* eslint-disable react-refresh/only-export-components */`는 의도된 disable이다.

새 패턴/도구를 도입한 뒤에는 [CONVENTION.md](../CONVENTION.md)와 본 문서, 필요하면 새 ADR을 함께 갱신한다.