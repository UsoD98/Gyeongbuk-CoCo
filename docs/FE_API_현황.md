# 프론트엔드 API 구현 현황

> 대상: `front/` (경북 CoCo SPA)
> 기준 스펙: `openapi.yaml` — 공공데이터 공모전 API v1.0.0 (GBC001~GBC020, 20개 엔드포인트)
> 작성일: 2026-07-17
> 방법: `src/` 전 파일 정독 + 6개 에이전트 병렬 감사(도메인 5 + 완결성 검증 1)로 교차 확인

---

## 1. 한눈 요약

백엔드 스펙 20개 엔드포인트 중 **프론트엔드가 실제 백엔드와 연동된 것은 5개(25%)뿐**이다. 나머지 15개 중 4개는 UI 골격만 있고(입력폼/목데이터), 11개는 화면·API가 모두 없다.

| 판정 | 개수 | 엔드포인트 |
|------|------|-----------|
| 🟢 **wired** — 실제 API 연동 완료 | **5** | GBC001, GBC002, GBC003, GBC004, GBC005 |
| 🟡 **ui-only** — 입력 UI만 있고 API 미연결 | **1** | GBC010 |
| 🟠 **mock** — UI는 목데이터로 동작, API 미연결 | **3** | GBC017, GBC018, GBC020 |
| 🔴 **missing** — 화면·API 전무 | **11** | GBC006, GBC007, GBC008, GBC009, GBC011, GBC012, GBC013, GBC014, GBC015, GBC016, GBC019 |

**핵심 결론**
- **인증/회원가입(auth + join)은 완성**되어 있고, 그 인프라(`apiClient`, 401 재발급 인터셉터, `authStore`, 라우트 가드, 토스트)는 프로덕션 수준으로 잘 갖춰져 있다.
- **여행코스(tour-course)·POI 도메인은 전면 목업**이다. 플래너 화면은 화려하게 동작하지만 전부 `@/mocks/planner.ts`의 정적 데이터이고, 서버로 저장·조회·삭제·공유하는 실제 호출이 **하나도 없다**.
- **마이페이지가 아예 없다.** 회원 조회/닉네임/비밀번호/탈퇴(GBC006~009)를 부를 화면도, 이를 위한 `userId`를 보관하는 곳도 없다.
- `src/api/`에는 `auth.ts`, `user.ts`, `client.ts`, `types.ts` **4개 파일뿐**이며, `tour-course`·`poi`용 API 모듈은 아직 존재하지 않는다.

---

## 2. 판정 기준

| 라벨 | 의미 | 판정 근거 |
|------|------|-----------|
| **wired** | 실제 `apiClient`/`axios` 호출이 코드에 존재하고 UI와 연결됨 | `src/api/*`에 함수 존재 + 컴포넌트에서 호출 |
| **ui-only** | 사용자 입력 화면은 있으나 제출이 API로 이어지지 않음 | 폼 존재 + `console.log`/TODO 또는 미연결 |
| **mock** | UI가 완전히 동작하지만 데이터가 `@/mocks/*` 정적값 | `@/mocks/planner.ts` import + `apiClient` 미사용 |
| **missing** | 화면·핸들러·API 모두 없음 | 코드 전역 grep 무검출 |

---

## 3. 엔드포인트별 현황 매트릭스

| GBC | 메서드 · 경로 | 기능 | 스펙 `x-status` | **FE 상태** | 근거 위치 |
|-----|--------------|------|:---:|:---:|-----------|
| **001** | `POST /auth/login` | 로그인 | 완료 | 🟢 wired | `api/auth.ts:21` → `pages/Auth/Login.tsx:77` |
| **002** | `POST /auth/logout` | 로그아웃 | 완료 | 🟢 wired | `api/auth.ts:30` → `layout/HeaderLayout.tsx:27` |
| **003** | `POST /auth/reissue` | 토큰 재발급 | 완료 | 🟢 wired | `api/client.ts:44` → `App.tsx:18` + 401 인터셉터 `client.ts:72` |
| **004** | `POST /auth/oauth/kakao/callback` | 카카오 로그인 | 완료 | 🟢 wired | `api/auth.ts:35` → `auth/KakoLoginComponent.tsx:42` |
| **005** | `POST /user/join` | 회원가입 | 완료 | 🟢 wired | `api/user.ts:20` → `pages/Auth/Register.tsx:67` |
| **006** | `GET /user/{userId}` | 회원정보 조회 | 완료 | 🔴 missing | 대응 함수·마이페이지 없음. `userId` 사용처 0건 |
| **007** | `PATCH /user/{userId}/nickname` | 닉네임 수정 | 완료 | 🔴 missing | 편집 UI·API 없음(닉네임 입력은 가입폼에만) |
| **008** | `PATCH /user/{userId}/password` | 비밀번호 변경 | 완료 | 🔴 missing | 설정 화면·API 없음 |
| **009** | `DELETE /user/{userId}` | 회원탈퇴 | 완료 | 🔴 missing | '회원탈퇴' 텍스트·API 전역 0건 |
| **010** | `POST /tour-course` | AI 코스 생성 | 완료 | 🟡 ui-only | 입력폼 완비(`pages/Index.tsx`)이나 `handleSearch:142`가 `console.log`만 |
| **011** | `GET /tour-course` | 내 코스 목록 | 완료 | 🔴 missing | `Collection.tsx`는 `<>Collection</>` 스텁 |
| **012** | `GET /tour-course/{courseId}` | 코스 상세 | 완료 | 🔴 missing | `plannerRouter`에 `:courseId` 세그먼트 없음 |
| **013** | `DELETE /tour-course/{courseId}` | 코스 삭제 | 완료 | 🔴 missing | '새 코스'는 toast만, X버튼은 POI 단위 |
| **014** | `GET /tour-course/{courseId}/view` | 공개 코스 뷰 | 완료 | 🔴 missing | `onShare`가 toast만, 공개뷰 라우트 없음 |
| **015** | `PATCH /tour-course/{courseId}/title` | 코스 제목 수정 | 완료 | 🔴 missing | 제목은 읽기전용 표시, 편집 UI 없음 |
| **016** | `PATCH /tour-course/{courseId}/assign` | 코스 소유권 이전 | 완료 | 🔴 missing | 로그인 게이트만, assign 호출 없음 |
| **017** | `GET /poi` | 큐레이션 POI 목록 | **보류** | 🟠 mock | `ResultsPanel.tsx`가 `@/mocks/planner.ts`의 `POIS` 필터 |
| **018** | `GET /poi/{contentId}` | POI 상세 통합 | **보류** | 🟠 mock | `PoiDrawer.tsx:44`가 `poiById(mock)` 조회 |
| **019** | `POST /poi/{contentId}/like` | POI 좋아요 토글 | 완료 | 🔴 missing | 하트/찜 UI·API 전무 |
| **020** | `PATCH /tour-course/{courseId}` | 코스 수정 | **개발중** | 🟠 mock | dnd 편집 완비하나 `plannerStore` 인메모리만, 영속화 없음 |

> ⚠️ 스펙 상 GBC020은 `tags`가 `poi`로 잘못 분류되어 있으나 실제 경로는 `PATCH /tour-course/{courseId}`(tour-course 도메인)다.

---

## 4. 도메인별 상세

### 4.1 인증(auth) — GBC001~004 · 🟢 전부 완료

가장 완성도가 높은 영역. 목데이터 의존이 전혀 없다.

- **로그인/로그아웃/카카오**: `api/auth.ts`의 `login`/`logout`/`kakaoCallback`이 모두 `apiClient.post`로 실제 호출. 각각 `Login.tsx`, `HeaderLayout.tsx`, `KakoLoginComponent.tsx`에서 사용.
- **토큰 재발급**: `api/client.ts:44` `reissueAccessToken`이 인터셉터 루프를 피하려 별도 `axios`로 `/auth/reissue` 호출. **두 곳에서 재사용** — ① 앱 부팅 시 세션 복원(`App.tsx`), ② 401 응답 인터셉터(`client.ts:69~97`, `refreshPromise`로 동시요청 1회 합류 + `_retried`로 재시도 1회 제한 + `isAuthRetryPath`로 무한루프 방지).
- **카카오 방식 유의**: 스펙 경로명은 `.../callback`이나, FE는 표준 OAuth 리다이렉트가 아니라 `react-kakao-login`으로 클라이언트에서 카카오 `access_token`을 받아 백엔드에 교환하는 방식(`kakaoAccessToken` 전달). 백엔드 계약과 방식이 일치하는지 재확인 권장.

### 4.2 회원(user) — GBC005 완료, GBC006~009 전무

- **회원가입(GBC005)만 wired.** `Register.tsx`가 이메일/닉네임/비밀번호/비밀번호확인 검증 후 `join()` 호출, 성공 시 `/auth/login`으로 이동. `confirmPassword`는 프론트 전용 검증이라 요청에서 제외.
- **GBC006~009은 화면 자체가 없다.** `src/pages`에는 마이페이지/프로필/설정이 없고, `src/routes`에 `userRouter`도 없다. 더 근본적으로 **`authStore`가 `accessToken`만 보관하고 `userId`를 저장하지 않아**, `{userId}` path 파라미터가 필요한 이 4개 엔드포인트는 현재 구조로는 **호출 자체가 불가능**하다.

### 4.3 여행코스(tour-course) — GBC010~016, 020 · 전면 목업

플래너는 UI 완성도가 매우 높지만 **서버 연동은 0건**이다.

- **GBC010 (AI 코스 생성) 🟡**: 입력폼은 **홈(`Index.tsx`)에 완비** — 목적지(시군구 복수선택), 일정(range 캘린더), 인원(카운터), 테마(복수선택), 검색 버튼. 그러나 `handleSearch`(`Index.tsx:131~143`)는 스펙과 유사한 요청 바디를 구성한 뒤 **`console.log`만 하고 끝난다**(`// TODO: 검색 API 연동 시 교체`). 검색 후 플래너로 넘어가는 흐름도 없다. 정작 플래너는 부팅 시 `plannerStore`가 로드하는 **고정 목업 코스**(`DEFAULT_COURSE.gyeongju`)를 보여줄 뿐이다.
- **GBC020 (코스 수정) 🟠**: 가장 완성도 높은 UI. dnd-kit 드래그로 결과→코스 삽입, 코스 내 재정렬, 코스 밖 드래그/X버튼 제거, POI별 비용 인라인 편집, Day 탭 전환이 실시간 반영된다. 단 모든 변경이 `plannerStore`의 **인메모리 조작**(`addPoi`/`removePoi`/`reorder`/`editCost`)일 뿐 서버 영속화가 없다. (스펙도 '개발중')
- **GBC011~016 🔴**: 목록(`Collection.tsx` 스텁)·상세(`:courseId` 라우트 없음)·삭제·공유/공개뷰·제목수정·소유권이전 모두 미구현. 저장(`onSave`)·공유(`onShare`)는 로그인 게이트 통과 후 `toast.success`만 띄우는 목업이라, 이 위에 얹혀야 할 목록/상세/삭제가 전부 막혀 있다.

### 4.4 POI / 컬렉션 — GBC017~019, 011 · 목업 또는 전무

- **GBC017 (목록) 🟠 / GBC018 (상세) 🟠**: POI 목록·상세·지도 UI는 **플래너 컴포넌트로만** 존재(`ResultsPanel`, `POICard`, `PoiDrawer`, `MapView`). 전용 POI 페이지/라우트는 없다. 데이터는 전부 `@/mocks/planner.ts`의 정적 배열(경주·포항·영덕·안동 POI). 카카오맵 연결도 `toast.info('카카오맵으로 연결 (데모)')` 데모.
- **GBC019 (좋아요) 🔴**: 하트 아이콘·찜 카운트·토글 어느 것도 없다. (`'찜'` grep 매치는 `mocks`의 지명 '찜닭'뿐)
- **GBC011 (내 코스 목록) 🔴**: 컬렉션 라우트/헤더 링크는 있으나 `Collection.tsx`는 텍스트만 렌더하는 5줄 스텁.

---

## 5. 이미 갖춰진 인프라 (재사용 자산)

미구현 API를 붙일 토대는 잘 마련되어 있다. 신규 연동은 대부분 "패턴 복제"로 가능하다.

| 자산 | 위치 | 상태 |
|------|------|------|
| axios 공용 인스턴스 | `api/client.ts:24` | `baseURL = ${VITE_API_BASE_URL}/api/v1`, `withCredentials`, Bearer 자동 첨부 |
| 401 재발급 인터셉터 | `api/client.ts:56~101` | 동시요청 합류·재시도 1회·세션만료 하드 리다이렉트까지 완비 |
| 공통 응답 봉투 | `api/types.ts` | `ApiResponse<T> = {code, msg, data}` + `getApiErrorMessage()` |
| 인증 상태 스토어 | `stores/authStore.ts` | `accessToken`(메모리) + `status`(idle/loading/authenticated/guest) + 세션 힌트 |
| 라우트 가드 | `auth/RequireAuth.tsx`, `auth/GuestOnly.tsx` | 로그인 필수 / 비로그인 전용 |
| 토스트 | `stores/toastStore.ts` + `common/Toaster.tsx` | 컴포넌트 밖 호출용 `toast.*` 헬퍼, Layout 1회 마운트 |
| 전역 셸 | `layout/Layout.tsx`, `HeaderLayout.tsx` | 반응형 헤더/네비/프로필 드롭다운/테마 토글 |
| 플래너 스캐폴딩 | `types/planner.ts`, `mocks/planner.ts`, `utils/budget.ts`, `stores/plannerStore.ts` | 목→API 전환 전제로 설계됨 |

**참조 표준 패턴**: `api/auth.ts` / `api/user.ts` — 요청/응답 타입을 백엔드 DTO와 1:1로 두고, `ApiResponse` 봉투를 벗겨 `data`만 반환하는 구조. 신규 `api/tourCourse.ts`, `api/poi.ts`는 이 패턴을 그대로 복제하면 된다.

---

## 6. 스펙 ↔ 코드 정합성 리스크 (연동 전 반드시 확정)

플래너를 실제 API로 연동할 때 그대로는 실패할 수 있는 계약 불일치들:

1. **`transport` 값 불일치** — `Index.tsx:136`에서 `'walk'`(소문자)로 **하드코딩**. 스펙 enum은 `CAR`/`PUBLIC_TRANSPORT`/`WALK`(대문자). 이동수단 선택 UI도 없음. → 대문자 값 + 선택 UI 필요.
2. **`sigunguCode` 타입 불일치** — 스펙은 단일 `string`(예 `'35130'`)이나, FE는 `sigunguCode: selectedDestinations`로 **배열** 전송(다중선택 드롭다운). → 단일 선택으로 바꾸거나 백엔드와 다중선택 계약 협의.
3. **시군구 코드 체계 불일치** — `sigunguStore`는 접두 `'47'`(법정동)에 3자리 값(`경주='130'`)을 쓰지만, 스펙 예시는 `'35130'`(관광공사 TourAPI 접두 `35`). POI가 TourAPI 기반(스펙의 `contentTypeId 12/14/32/39`)이라면 **`35` 체계로 통일** 필요.
4. **테마 어휘 3중 불일치** — ① `travelThemeStore`(코드 `001~004`: 어드벤처/휴식/문화/음식), ② `mocks/planner.ts`의 `THEMES`(8종 id: history/healing/food/…), ③ 스펙 예시(자유 문자열 `자연`,`맛집`). 검색폼은 ①의 코드를 보내지만 스펙 예시는 ③. → 백엔드가 기대하는 테마 표현 확정 필요.
5. **`userId` 미보관** — GBC006~009는 `{userId}`가 필수인데 `authStore`에 저장이 없다. → 로그인/재발급 응답에 `userId`를 포함시켜 스토어에 보관하거나, 백엔드가 토큰 기반 `/user/me`를 제공하도록 협의.
6. **응답 타입 부재** — 현재 코스/POI 타입은 목업 전용(`types/planner.ts`)이다. 백엔드 스키마(`courseId`, `schedule[].places[].contentId`, `seq`, `time`, `type` 등)에 맞춘 **API 응답 타입 + 목↔서버 매핑 계층**이 필요하다.

---

## 7. 라우팅 현황

실제 존재하는 경로는 8개다(`routes/router.tsx`).

| 경로 | 페이지 | 가드 | 비고 |
|------|--------|------|------|
| `/auth` → `/auth/login` | (redirect) | GuestOnly | |
| `/auth/login` | `Login.tsx` | GuestOnly | 🟢 완성 |
| `/auth/register` | `Register.tsx` | GuestOnly | 🟢 완성 |
| `/` | `Index.tsx` | — | 검색폼(코스 생성 입력) 완성, 제출 미연결 |
| `/home` | `Home.tsx` | — | ⚠️ 레이아웃 테스트용 더미(PRD상 제거 대상) |
| `/about` | `About.tsx` | — | 스텁(`<>About</>`) |
| `/planner/` | `Planner.tsx` | 게스트 허용 | 목업 동작 |
| `/collection/` | `Collection.tsx` | RequireAuth | 스텁(`<>Collection</>`) |

**부재 라우트**: 공유 공개뷰(`/share/:id` 또는 `/tour-course/:id/view`, GBC014), 코스 상세(`:courseId`, GBC012), 마이페이지(`userRouter`, GBC006~009).

---

## 8. 문서 ↔ 코드 드리프트 (참고)

기존 문서 일부가 현재 코드와 어긋난다(코드가 문서보다 앞서 있음).

- `docs/FEATURES_FRONT.md`, `docs/PRD_FRONT.md`: "`api/` 비어 있음", "`authStore` 미작성", "토스트 신규"로 서술 → 실제로는 `api/` 4파일·`authStore`·`toastStore` 모두 구현 완료.
- `CLAUDE.md`: 디렉터리 설명에 "`api/` (현재 비어 있음)"으로 기재 + `.env` 설명에 `VITE_API_BASE_URL` 누락(실제 존재).
- `RootLayout.tsx`: 어떤 RouteObject에도 연결되지 않은 사문화 상태(단 CLAUDE.md가 삭제 금지로 명시).

> 이 문서들의 최신화가 필요하다. 신규 작업 시 **코드를 진실의 원천(source of truth)** 으로 삼을 것.

---

## 9. 종합 진척도

```
전체 20개 엔드포인트
🟢 wired    ███████████████                     5개 (25%)  ← auth 4 + join 1
🟡 ui-only  ███                                 1개  (5%)  ← GBC010 검색폼
🟠 mock     █████████                           3개 (15%)  ← POI 목록/상세, 코스편집
🔴 missing  █████████████████████████████████  11개 (55%)
```

- **실사용 가능**(로그인해서 서비스를 쓸 수 있는 범위): 인증 + 회원가입까지.
- **데모 가능**(목업으로 시연): 플래너 탐색/코스 편집/예산.
- **미착수**: 코스 저장·목록·상세·삭제·공유, POI 좋아요, 마이페이지 전반.

다음 단계 실무 가이드는 [`FE_API_연동가이드.md`](./FE_API_연동가이드.md) 참조.
