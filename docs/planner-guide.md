# 플래너(S2) 화면 개발 구성 가이드

> `docs/sample.html` 인터랙티브 프로토타입의 **S2 플래너 워크스페이스**를 본 저장소 구조·컨벤션에 맞춰 구현하기 위한 1차(화면 구성) 가이드.
> 이 단계의 목표는 **목업 데이터로 완전히 동작하는 플래너 화면**이며, 서버 API는 붙이지 않는다.

---

## 0. 1차 범위 합의 (확정)

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 1차 범위 | 목업 데이터로 **동작하는** 인터랙티브 화면 | 추가/삭제/순서변경/금액수정/예산 실시간계산/드로어까지 동작, API만 미연결 |
| 레이아웃 컨테이너 | 기존 **표준 `Layout`** 안에서 구현 | 전역 Header/Footer·중앙정렬 폭과 자연스럽게 어우러지게 |
| 레이아웃 변형 | **`stacked`** | 가운데 정렬 `max-w` 컨테이너 + 페이지 스크롤에 가장 잘 맞음 |
| 인증 | **게스트 허용**, 저장/공유만 게이트 | 탐색·코스작성은 로그인 없이, 저장/공유 시 로그인 모달 |
| 초기 상태 | **프로토타입 기본값 부팅** | 검색화면(S1) 부재 → 경주 2박3일·2명 + 채워진 기본 코스 |
| 지도 | **플레이스홀더 SVG 지도 포함** | 카카오맵 SDK 연결 전까지 "지도 자리"와 코스 경로만 표시 |

**범위 외 (다음 단계):** 서버 API 연동, 카카오맵 SDK, 검색 화면(S1) 연동, 공유 화면(S3), 저장 후 컬렉션 영속화.

---

## 1. 데이터 흐름 한눈에

```
plannerStore (Zustand)  ──┐
  search / course /       │  구독
  activeDay / overrides   ├──▶ ResultsPanel ──▶ POICard ──(addPoi)──┐
  drawer                  │                                          │
                          ├──▶ CoursePanel ──▶ CourseItem ──(move/remove/editCost)
                          │                                          │
utils/budget.ts ◀─────────┘  course+pax+overrides ──▶ BudgetDashboard
  computeBudget()

authStore (기존)  ──▶ 저장/공유 클릭 시 guest면 LoginGateModal
```

- **단일 진실 공급원**은 `plannerStore`. 결과·코스·예산 패널이 모두 같은 store를 구독하므로 한 곳을 바꾸면 전 패널이 즉시 갱신된다(예산 실시간 재계산 포함).
- 예산은 store에 저장하지 않는다. `course + pax + overrides`에서 **파생 계산**(`computeBudget`)한다. 상태 중복/불일치 방지.

---

## 2. 라우팅 통합

현재 `src/routes/router.tsx`에서 `plannerRouter`는 `RequireAuth` 자식으로 들어가 있다. **게스트 허용**으로 바꾸므로 `RequireAuth` 밖으로 뺀다.

```tsx
// router.tsx (변경 방향)
children: [
  { index: true, element: <Suspense …><Index /></Suspense> },
  ...plannerRouter,        // ← RequireAuth 밖으로 이동 (게스트 접근 허용)
  {
    element: <RequireAuth />,
    children: [...collectionRouter],   // 컬렉션은 그대로 보호
  },
]
```

`plannerRouter.tsx`는 현 패턴(`lazy` + `Suspense` + `RouteObject[]` default export) 유지. 경로 `planner/` 그대로. 상단 `/* eslint-disable react-refresh/only-export-components */` 유지.

> 저장/공유는 라우트 가드가 아니라 **액션 시점 게이트**(모달)로 처리한다(§7).

---

## 3. 레이아웃 — 표준 Layout 안의 `stacked`

표준 `Layout`의 `<main>`은 `lg:max-w-360 px-4 lg:px-10 py-6` + **페이지 스크롤** + 전역 Footer다. 프로토타입의 "전체높이 + 하단 고정 바"를 그대로 쓰지 않고, **카드 2개 그리드 + 그 아래 예산 섹션**으로 페이지 흐름에 녹인다.

```
┌─ Header (전역) ─────────────────────────────┐
├─ main (max-w-360, px, py-6) ────────────────┤
│  ┌──────────── 코스 요약 헤더 ──────────────┐ │  ← 코스 제목 · 일정 · 인원 · 저장/공유
│  ├───────────────┬──────────────────────────┤ │
│  │ ResultsPanel  │  CoursePanel             │ │  ← lg: 1fr / 360px, 카드 내부 스크롤
│  │ (카드/지도)   │  (Day 칩 + 코스 항목)    │ │
│  ├───────────────┴──────────────────────────┤ │
│  │ BudgetDashboard (bars)                   │ │  ← 그리드 아래 일반 섹션
│  └──────────────────────────────────────────┘ │
├─ Footer (전역) ─────────────────────────────┤
└─────────────────────────────────────────────┘
```

핵심 클래스(예시, `cn()`으로 합성):

| 영역 | 클래스 의도 |
| --- | --- |
| 그리드 래퍼 | `grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:gap-5 items-start` |
| 각 패널 카드 | `card bg-white rounded-2xl shadow-lg overflow-hidden h-[60vh] lg:h-[560px] flex flex-col` |
| 패널 내부 스크롤 | 헤더 `shrink-0` + 리스트 `flex-1 min-h-0 overflow-y-auto` |
| 예산 섹션 | 그리드 아래 `mt-4 lg:mt-5`, `card … p-4 sm:p-5` |

- **하단 고정 예산 바(`BudgetBar`)는 1차에서 만들지 않는다.** stacked에서는 예산이 일반 섹션이라 페이지 스크롤로 자연 도달한다.
- 패널은 **고정 높이 + 내부 스크롤**로 두어 긴 목록에도 페이지 전체가 늘어나지 않게 한다(프로토타입 stacked의 `height:560` 대응).
- 모바일은 그리드 대신 **세그먼트 탭**으로 전환(§6).

---

## 4. 상태 설계 — `src/stores/plannerStore.ts`

프로젝트 컨벤션(Zustand, `<name>Store.ts`)에 맞춘 단일 도메인 스토어. `themeStore.ts`의 모범 패턴을 따른다.

### 4.1 스토어 상태

```ts
type PlannerState = {
  search: { dests: string[]; start: string; end: string; pax: number; themes: string[] };
  course: { title: string; days: { label: string; items: string[] }[] };  // items = poiId[]
  activeDay: number;
  overrides: Record<string, number>;     // poiId → 사용자가 수정한 금액
  drawer: { open: boolean; poiId: string | null };
};
```

### 4.2 액션 (프로토타입 `buildActions` 대응)

| 액션 | 역할 |
| --- | --- |
| `setSearch(patch)` | 검색조건 부분 갱신 |
| `setActiveDay(i)` | 활성 Day 전환 |
| `addPoi(poiId)` | 활성 Day에 POI 추가(중복 무시) + toast |
| `removePoi(dayIdx, poiId)` | 코스에서 제거 |
| `moveItem(dayIdx, idx, dir)` | 항목 위/아래 이동(±1) |
| `editCost(poiId, val)` | 금액 override 설정(`Math.max(0, val)`) |
| `resetCost(poiId)` | override 제거(되돌리기) |
| `openDrawer(poiId)` / `closeDrawer()` | POI 상세 드로어 |

### 4.3 초기값 (프로토타입 기본값 부팅)

```ts
search: { dests: ['gyeongju'], start: '2026-06-12', end: '2026-06-14', pax: 2, themes: ['history', 'food'] }
course: DEFAULT_COURSE.gyeongju  // 채워진 경주 2박3일 코스 (깊은 복사)
activeDay: 0
overrides: {}
drawer: { open: false, poiId: null }
```

### 4.4 store에 두지 않는 것 (로컬 state로)

| 상태 | 위치 | 이유 |
| --- | --- | --- |
| `viewMode` (리스트/지도) | `ResultsPanel` 로컬 | 표시 전용, 공유 불필요 |
| 카테고리 필터 칩 | `ResultsPanel` 로컬 | 〃 |
| 모바일 탭(결과/코스/예산) | `Planner` 로컬 | 〃 |
| 금액 인라인 편집 중 여부 | `CourseItem` 로컬 | 〃 |
| 로그인 게이트 모달 | `Planner` 로컬 + `authStore` | 인증은 기존 `authStore` 재사용(§7) |

---

## 5. 데이터 모델 & 목업

### 5.1 도메인 타입 — `src/types/planner.ts`

API 응답으로 대체될 때까지 쓸 **API 비의존 타입**. (`import type`로만 임포트)

```ts
export type PoiCat = 'sight' | 'food' | 'stay' | 'culture';
export type PaxBucket = 1 | 2 | '3-4';

export interface Poi {
  id: string;
  region: string;            // Region.code
  name: string;
  cat: PoiCat;
  themes: string[];
  buckets: PaxBucket[];
  price: number;             // food/sight/culture=1인 기준, stay=1박 객실 기준
  priceNote: string;
  hours: string;
  rating: number;
  reviews: number;
  x: number; y: number;      // 지도 플레이스홀더 좌표(%)
  tags: string[];
  img: string;               // 이미지 자리 라벨(실 이미지 전까지 텍스트 placeholder)
  desc: string;
}

export interface Region { code: string; name: string; ready: boolean; }
export interface Theme { id: string; name: string; icon: string; }
export interface CourseDay { label: string; items: string[]; }   // items=poiId[]
export interface Course { title: string; days: CourseDay[]; }
```

### 5.2 목업 데이터 — `src/mocks/planner.ts`

`docs/sample.html` 안 `coco/data.jsx`를 TS로 이식한다. (디코드 산출물이 1차 데이터 원천)

- `REGIONS` (경북 23개 시군구, `ready`: 경주·포항·영덕·안동만 true)
- `THEMES` (8종)
- `CATEGORIES` (sight/food/stay/culture 메타)
- `POIS` (경주 13 + 포항 3 + 영덕 3 + 안동 4 = 약 23곳)
- `DEFAULT_COURSE.gyeongju` (경주 2박3일 채워진 코스)
- 헬퍼: `poiById(id)`, `paxBucket(n)`, `nightsFromRange(start, end)`

> `src/api/`는 axios 모듈 자리이므로 목업은 `src/mocks/`로 분리한다. API 도입 시 컴포넌트는 `mocks` → `api` 임포트만 바꾸면 되도록 **타입은 `src/types`에 두고 데이터만 교체**한다.

### 5.3 포맷 유틸 — `src/utils/format.ts`

```ts
export const won = (n: number) => '₩' + Math.round(n).toLocaleString('ko-KR');
```

---

## 6. 컴포넌트 구성

도메인 컴포넌트는 `components/planner/`에 신설(기존 `auth/`, `common/`, `layout/` 패턴과 동일). 파일명 `PascalCase.tsx`, 모든 import `@/` 절대경로, 클래스 합성은 `cn()`.

```
src/
├── pages/Planner/Planner.tsx          # 진입점·레이아웃·모바일 탭 분기
├── components/planner/
│   ├── ResultsPanel.tsx               # 필터 헤더 + 리스트/지도 토글 + POI 그리드
│   ├── MapView.tsx                    # SVG 플레이스홀더 지도 + 마커 + 코스 경로선
│   ├── POICard.tsx                    # stacked/horizontal 변형
│   ├── CoursePanel.tsx                # Day 칩 + 코스 항목 목록 + EmptyState
│   ├── CourseItem.tsx                 # 순서이동·삭제·금액 인라인 수정
│   ├── BudgetDashboard.tsx            # bars 변형 (총예상/1인당 + 카테고리별)
│   ├── PoiDrawer.tsx                  # POI 상세 (데스크톱 우측 패널 / 모바일 바텀시트)
│   ├── LoginGateModal.tsx            # 저장/공유 게이트 (게스트일 때)
│   └── parts/                         # 소형 표시 컴포넌트
│       ├── CatBadge.tsx  Stars.tsx  Marker.tsx  ImgPlaceholder.tsx  EmptyState.tsx
├── stores/plannerStore.ts
├── types/planner.ts
├── mocks/planner.ts
└── utils/budget.ts  format.ts
```

### 6.1 `Planner.tsx` (진입점)

- 데스크톱(`lg:`): §3 stacked 그리드. 상단 코스 요약 헤더 → `ResultsPanel` / `CoursePanel` 그리드 → `BudgetDashboard` 섹션.
- 모바일(`< lg`): 세그먼트 탭 `[결과 / 코스 N / 예산]` 로컬 state로 전환, 본문에 해당 패널 1개. 코스 개수 배지는 `course.days` 합계.
- `PoiDrawer`, `LoginGateModal` 오버레이를 이 레벨에서 렌더.
- 공유 상태는 모두 `plannerStore`에 있으므로 데스크톱/모바일 트리가 같은 데이터를 본다.

> **반응형 구현 권장:** 단일 컴포넌트에서 Tailwind `hidden`/`lg:*`로 전환. 데스크톱 그리드와 모바일 탭이 구조적으로 달라, 패널 컴포넌트는 공통으로 두고 **배치만 분기**한다(패널 내부 로직 중복 금지).

### 6.2 `ResultsPanel.tsx`

- 헤더: 지역명 + `n곳` 배지 + **리스트/지도 토글**(`viewMode` 로컬) + 카테고리 칩(`전체/관광지/음식점/숙박/문화`, `cat` 로컬).
- `ready=false` 지역 → `EmptyState`("데이터 준비 중인 지역") + "경주로 둘러보기" 액션.
- 리스트: `POICard` 그리드 — 데스크톱 `repeat(auto-fill, minmax(220px,1fr))`, 모바일 `1fr`(horizontal 카드).
- 지도: `MapView`.
- POI 필터링 로직(`filterPois`)은 `search.dests` + `paxBucket(pax)` + 테마 정렬. `utils`나 패널 내부 헬퍼로.

### 6.3 `POICard.tsx`

- variant: **데스크톱 `stacked`(세로), 모바일 `horizontal`(가로)**. `overlay`는 1차 생략 가능.
- 표시: 이미지 placeholder, `CatBadge`, `Stars`, 이름, 설명, 가격(`무료`/`/박`/`/인`), **코스 추가 버튼**(추가됨 상태 `btn-soft` + check).
- 카드 클릭 → `openDrawer(poi.id)`. 추가 버튼은 `stopPropagation` 후 `addPoi`.

### 6.4 `CoursePanel.tsx` + `CourseItem.tsx`

- 헤더: "내 코스" + 코스 제목 + **Day 칩**(라벨 + 항목수, 활성 강조). "새 코스" 버튼은 toast만(1차).
- 빈 Day → `EmptyState`("코스가 비어 있어요").
- `CourseItem`: 순번 배지, 위/아래 이동 버튼(`moveItem`, 양끝 disabled), 이미지, 이름, `CatBadge`, 운영시간, **금액(클릭 시 인라인 number input → `editCost`)**, override 시 "수정됨" 태그 + "되돌리기"(`resetCost`).

### 6.5 `BudgetDashboard.tsx`

- variant **`bars`**(기본). 총 예상 예산 + 1인당(`pax`명) 헤더, 카테고리별 막대(`숙박/식비/입장·관람/교통`) + 행별 금액.
- 데스크톱 헤더 우측에 **저장/공유** 버튼(§7 게이트).
- 입력은 `computeBudget(course, pax, overrides, nights+1)` 결과만. 모바일 `compact` 플래그로 폰트 축소 + "교통비는 추정치" 안내.

### 6.6 `PoiDrawer.tsx`

- `drawer.open && drawer.poiId`일 때만 렌더. **데스크톱 우측 420px 패널 / 모바일 바텀시트**, 공통 backdrop(`fixed inset-0`).
- 이미지, 이름, `Stars`, 태그, 설명, 정보 카드(운영시간/요금/적합인원), "카카오맵에서 보기"(1차 toast), 하단 "닫기" + "활성 Day에 추가".
- 표준 Layout 위에 떠야 하므로 `fixed` + 높은 `z-index`(기존 `Toaster`보다 아래/위 관계 정리). daisyUI `drawer`/`modal` 또는 커스텀 `fixed`.

---

## 7. 인증 게이트 (저장/공유)

라우트는 게스트 허용. **저장/공유 클릭 시점**에만 인증 확인.

```
저장/공유 클릭
  └─ authStore.status === 'authenticated' ?
       ├─ yes → (1차) mock toast "컬렉션에 저장했어요" / "공유 링크가 생성됐어요"
       └─ no  → LoginGateModal 열기
                  └─ "카카오로 시작" / "로그인하러 가기"
                       → navigate('/auth/login', { state: { from: <현재 위치> } })
```

- 기존 `authStore`(`status`, `setAccessToken`)와 `Login.tsx`의 `from` 복귀 패턴을 그대로 활용.
- 프로토타입의 "pending 액션 자동 재개"는 **1차 범위 외**(로그인 후 수동으로 다시 저장). API 저장이 없으므로 충분.
- 모달 카피는 프로토타입 문구 재사용: "저장하려면 로그인 / 탐색과 코스 짜기는 로그인 없이도 가능해요."

---

## 8. 예산 계산 엔진 — `src/utils/budget.ts`

순수 함수로 분리(테스트·재사용·API 전환 용이). 프로토타입 `coco/budget.jsx` 이식.

```ts
export const BCATS = [ /* stay, food, entry, transport — label·color·icon */ ];

export const catOf = (poiCat: PoiCat) =>
  poiCat === 'stay' ? 'stay' : poiCat === 'food' ? 'food' : 'entry';

// override 없을 때 기본 비용: stay=객실 총액, 그 외=1인단가×인원
export function defaultCost(poi: Poi, n: number): number;

// course+pax+overrides+days → { items, byCat, total, perPerson, n }
export function computeBudget(course, n, overrides, days): Budget;
```

- 교통비(`transport`)는 프로토타입과 동일하게 좌표 기반 추정 자리: `8500 * max(1,days) * ceil(n/4)`. UI에 "자동 추정" 태그.
- `days` 인자는 `nightsFromRange(start,end)+1`.

---

## 9. 스타일 매핑 (프로토타입 인라인 → 본 저장소 토큰)

프로토타입은 인라인 스타일 + CSS 변수(`--primary`, `--surface`…)다. 본 저장소는 **Tailwind v4 + daisyUI + `@theme` 토큰**(`DESIGN.md`)으로 치환한다.

| 프로토타입 | 본 저장소 |
| --- | --- |
| `var(--primary)` | `bg-primary` / `text-primary` (= teal 500) |
| `var(--accent)` (카카오 옐로) | `secondary` 토큰 또는 카카오 브랜드 컬러 직접 |
| `var(--surface)` 카드 | `bg-white` |
| `var(--bg)` 페이지 | 표준 Layout의 `bg-[#F8F9FF]` 그대로 |
| `.card` | `card bg-white rounded-2xl shadow-lg` |
| `.chip`/`.chip.on` | daisyUI `badge`/`btn-sm` + 활성 시 `bg-primary text-primary-50` |
| `.seg` 토글 | daisyUI `tabs`/`join` + 활성 강조 |
| 인라인 아이콘 SVG | **lucide-react**(`compass, route, wallet, plus, x, map, clock, edit, bookmark, share, users …`) |
| `won()` | `utils/format.ts` |

규칙 준수: 별도 `.css` 추가 금지(전역은 `index.css`만), 임의값 도입 시 `@theme` 토큰화 검토, `tailwind.config.*` 생성 금지.

---

## 10. 구현 순서 (체크리스트)

1. **데이터/타입 기반**
   - [ ] `src/types/planner.ts` 도메인 타입
   - [ ] `src/mocks/planner.ts` (data.jsx 이식)
   - [ ] `src/utils/format.ts`(`won`), `src/utils/budget.ts`(`computeBudget`/`defaultCost`/`BCATS`)
2. **상태**
   - [ ] `src/stores/plannerStore.ts` (상태 + 액션 + 프로토타입 기본값 초기화)
3. **표시 조각**
   - [ ] `parts/`: `CatBadge`, `Stars`, `ImgPlaceholder`, `EmptyState`, `Marker`
4. **패널**
   - [ ] `POICard` → `ResultsPanel`(+`MapView`)
   - [ ] `CourseItem` → `CoursePanel`
   - [ ] `BudgetDashboard`
5. **조립**
   - [ ] `pages/Planner/Planner.tsx` (stacked 데스크톱 + 모바일 탭)
   - [ ] `PoiDrawer`, `LoginGateModal` 오버레이
6. **라우팅**
   - [ ] `router.tsx`에서 `plannerRouter`를 `RequireAuth` 밖으로 이동
7. **검증**
   - [ ] `npm run lint` / `npm run build` 통과
   - [ ] `npm run dev`로 모바일·데스크톱 폭 모두 확인 (추가/삭제/순서/금액수정/예산 갱신/드로어/게이트)

---

## 11. 부록 — 프로토타입 출처 매핑

본 가이드의 근거가 된 `docs/sample.html` 디코드 모듈:

| 모듈 | 본 가이드 대응 |
| --- | --- |
| `coco/planner-screen.jsx` | §3 레이아웃, §6.1 `Planner` |
| `coco/planner-parts.jsx` | §6.2~6.4 결과/지도/코스 패널 |
| `coco/budget.jsx` | §6.5 `BudgetDashboard`, §8 예산 엔진 |
| `coco/overlays.jsx` | §6.6 `PoiDrawer`, §7 로그인 게이트 |
| `coco/data.jsx` | §5 타입·목업 |
| `coco/app.jsx` | 헤더/푸터/라우터(기존 저장소 컴포넌트로 이미 존재) |

> 레이아웃/예산/카드 변형(`split3`·`mapfocus` / `donut`·`split` / `overlay`)은 프로토타입에 모두 존재하나 1차에서는 **stacked / bars / (stacked·horizontal)** 만 구현한다. 나머지는 컴포넌트 `variant` prop으로 추후 확장 가능하게 설계.
