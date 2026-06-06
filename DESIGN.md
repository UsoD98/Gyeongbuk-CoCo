# DESIGN.md

경북 CoCo 디자인 시스템. 현재 구현(Tailwind v4 + daisyUI 기반)에서 사용 중인 토큰과 패턴을 기록한다. 코드 위치 기준이며, 가장 권위 있는 소스는 `src/index.css`다.

---

## 1. 디자인 원칙

- **모바일 우선**, 데스크톱 확장. 콘텐츠 최대 폭 1440px(`lg:max-w-360`), 최소 폭 360px(`min-w-90`).
- **여행자의 빠른 의사결정을 돕는 UI**. 폼은 한 줄(데스크톱)/세로 스택(모바일)으로 단순화한다.
- **시맨틱 우선, 임의값 최소**. 색은 `@theme` 토큰 또는 daisyUI 시맨틱을 우선.
- **테마 가변성**. light/dark 토글이 기본. daisyUI 테마(`cupcake`, `bumblebee`, …)는 활성화만 되어 있고 store에서는 light/dark 2개만 노출.

---

## 2. 색상 팔레트

`src/index.css`의 `@theme` 블록에 정의. Tailwind에서 `bg-primary-500`, `text-secondary-700` 형태로 사용.

### 2.1 Primary — Teal (메인 브랜드 컬러)

| 토큰 | HEX | 주 용도 |
| --- | --- | --- |
| `--color-primary-50`  | `#E6F2F2` | Navbar 텍스트, 강조 위 텍스트 |
| `--color-primary-100` | `#CCE5E5` | Hover 텍스트 |
| `--color-primary-200` | `#99CCCC` | 비활성 탭 텍스트 |
| `--color-primary-300` | `#66B2B2` | — |
| `--color-primary-400` | `#339999` | — |
| `--color-primary-500` | `#008080` | **메인 브랜드** (`--color-primary` 기본값) |
| `--color-primary-600` | `#007373` | 버튼 hover 배경 |
| `--color-primary-700` | `#005C5C` | — |
| `--color-primary-800` | `#004545` | — |
| `--color-primary-900` | `#002E2E` | — |

### 2.2 Secondary — Yellow (카카오/포인트)

| 토큰 | HEX | 주 용도 |
| --- | --- | --- |
| `--color-secondary-50`  | `#FFFDE7` | — |
| `--color-secondary-100` | `#FFF9C4` | — |
| `--color-secondary-200` | `#FFF59D` | — |
| `--color-secondary-300` | `#FFF176` | — |
| `--color-secondary-400` | `#FFEE58` | — |
| `--color-secondary-500` | `#FEE500` | **카카오 옐로우** (`--color-secondary` 기본값) |
| `--color-secondary-600` | `#FDD835` | — |
| `--color-secondary-700` | `#FBC02D` | — |
| `--color-secondary-800` | `#F9A825` | — |
| `--color-secondary-900` | `#F57F17` | — |

> 카카오 로그인 버튼은 브랜드 규약상 `#FEE502` / hover `#F1D800` / text `#181600`을 그대로 사용한다 (`KakoLoginComponent.tsx`).

### 2.3 배경

- 페이지 배경(루트): `#F8F9FF` — `:root { background-color: #F8F9FF; }` 및 `<main>`의 `bg-[#F8F9FF]`.
- 카드/입력 배경: `bg-white`.
- 보조 영역(Footer): daisyUI 시맨틱 `bg-base-300`.

### 2.4 텍스트

- 본문: 기본 (`text-base-content`).
- 보조: `text-gray-500` / `text-gray-700` (입력 라벨, 부가 설명).
- 강조 위(primary 배경): `text-primary-50`.

---

## 3. 타이포그래피

`src/index.css`의 `@theme`/`@font-face`.

- 패밀리: **Pretendard** (CDN). `font-sans`, `font-serif` 모두 Pretendard로 설정.
  `https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Regular.woff2`
- 기본 적용: `@layer base { body { @apply font-sans; } }`.

### 스케일 가이드

| 용도 | Tailwind 클래스 |
| --- | --- |
| 페이지 헤드라인 | `text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold` |
| 섹션 타이틀 | `text-lg md:text-2xl font-bold` |
| 본문 | `text-sm md:text-base` |
| 보조/라벨 | `text-xs font-semibold text-gray-500` |
| 마이크로카피 | `text-xs text-gray-400` |

---

## 4. 간격·레이아웃

### 4.1 컨테이너

`Layout.tsx`의 `<main>`이 단일 컨테이너 규칙을 강제한다.

```
w-full max-w-full lg:max-w-360 min-w-90 lg:min-w-90
mx-auto
px-4 lg:px-10
py-6
bg-[#F8F9FF]
```

- `lg:max-w-360` = `max-width: 1440px` (피그마 데스크톱 기준).
- 좌우 패딩: 모바일 16px → 데스크톱 40px.

### 4.2 카드/패널

- 둥근 모서리: 일반 카드 `rounded-2xl`, 입력 묶음(검색 바) 데스크톱 `sm:rounded-full`.
- 그림자: `shadow-lg`.
- 내부 패딩: `p-3 sm:p-4`.

### 4.3 그리드 간격

- 카드 내부 요소 사이: `gap-3 sm:gap-4`.
- 네비게이션 탭 사이: `gap-2 md:gap-4`.

---

## 5. 반응형 브레이크포인트

Tailwind 기본. 모바일 우선.

| 접두사 | 기준 폭 | 본 프로젝트 용도 |
| --- | --- | --- |
| (없음) | `< 640px` | 모바일 베이스 |
| `sm:` | `≥ 640px` | 큰 모바일·작은 태블릿 |
| `md:` | `≥ 768px` | 태블릿. 헤더 데스크톱 네비게이션 활성 |
| `lg:` | `≥ 1024px` | 데스크톱. `<main>` 폭 캡, 검색 바 가로 배치 |
| `xl:` / `2xl:` | `≥ 1280px` / `≥ 1536px` | 현재 미사용 |

데스크톱(`md:` 이상)과 모바일에서 네비게이션 표시가 갈린다 — 데스크톱은 가로 탭, 모바일은 햄버거 드롭다운 (`HeaderLayout.tsx`).

---

## 6. 컴포넌트 패턴

### 6.1 Navbar

`HeaderLayout.tsx` 기준.

- 배경: `bg-primary` (= `#008080` 계열, daisyUI primary).
- 좌측: 로고("경북 CoCo") — 데스크톱 `text-2xl`, 모바일 `text-lg`.
- 가운데: 탭 (`/planner/`, `/collection/`) — `md:` 이상에서만 표시. 모바일은 햄버거 드롭다운.
- 우측: ThemeController, Bell, User 드롭다운(로그인/회원가입).
- 활성 탭 표시: `NavLink` + `isActive` → `tab-active text-primary-50`.

### 6.2 검색 바 (Index 페이지)

| 모드 | 형태 |
| --- | --- |
| 데스크톱 (`lg:`) | 가로 한 줄 알약 형태 (`sm:rounded-full`), 항목 간 세로 구분선 |
| 모바일 | 세로 스택 (`rounded-2xl`), 구분선 일부 숨김 |

각 항목: 아이콘(lucide) + 라벨 + 컨트롤(input/dropdown). 드롭다운은 외부 클릭·`Escape`로 닫힘.

### 6.3 버튼

daisyUI 클래스 기반.

```
btn                       기본
btn-primary               메인 액션
btn-accent                강조 액션 (테마 토글 등)
btn-ghost btn-sm          아이콘 버튼 (네비게이션 우측)
```

원형 검색 버튼: `btn rounded-full bg-primary text-white w-12 h-12 hover:bg-primary-600`.

카카오 버튼: 브랜드 컬러 직접 지정(위 2.2 참고).

### 6.4 입력

- 텍스트 입력: 기본 `border-white bg-transparent focus:border-primary`.
- DatePicker: `react-datepicker` + `selectsRange`. 헤더 색은 `index.css`에서 `--color-primary-500` 배경 / `--color-primary-50` 텍스트로 오버라이드.
- 체크박스: daisyUI `checkbox checkbox-sm checkbox-primary`.
- 드롭다운 패널: `rounded-xl border border-gray-200 bg-white p-2 shadow-lg`.

### 6.5 Footer

`bg-base-300`(테마에 따라 변동). 카피라이트 한 줄.

### 6.6 Loading

`src/components/common/Loading.tsx`. 인디고 spin SVG + 한국어 메시지("데이터를 불러오는 중입니다…"). Suspense fallback으로 사용.

---

## 7. 테마

`themeStore.ts`에서 `light` ↔ `dark` 토글 (`ThemeController`의 swap-rotate sun/moon 아이콘).

- 적용 방식: `document.documentElement.setAttribute('data-theme', theme)`.
- 영속화: `localStorage['theme']`. 모듈 로드 시 즉시 반영해 초기 깜빡임 방지.
- 활성화된 daisyUI 테마(`light, dark, cupcake, bumblebee, emerald, corporate`)는 인덱스 css에 등록되어 있지만 store에서는 light/dark만 노출. 다른 테마를 풀어주려면 `themeStore.ts`의 `themes` 배열에 추가.

---

## 8. 아이콘

- 라이브러리: **lucide-react**.
- 기본 크기: `size={20}` (네비게이션·입력), `size={16}`(인라인), `size={24}`(드로어 토글).
- 색상: `text-gray-400`(보조) / `text-primary-50`(네비 위).

신규 아이콘 추가 시 같은 패밀리에서 고르고, 외부 SVG 임포트는 자제(브랜드 로고 예외).

---

## 9. 디자인 변경 절차

1. 색·폰트·간격 토큰 변경 → `src/index.css`의 `@theme` 또는 `@font-face` 갱신.
2. 컴포넌트 패턴 변경 → 본 문서의 해당 섹션도 함께 수정.
3. 임의값(`bg-[#...]`)을 도입했다면 *반드시* 동등한 `@theme` 토큰을 만들 수 있는지 검토. 일회성이 아니면 토큰화한다.
