# 프론트엔드 개발 진행상황 (Task 보드)

> **이 파일이 진행상황의 정본이다.** 새 세션을 시작해도 이 파일을 열면 어디까지 됐는지 알 수 있다.
> 상세 사양: [`FE_개발순서.md`](./FE_개발순서.md) · 현재 상태: [`FE_API_현황.md`](./FE_API_현황.md) · 레시피: [`FE_API_연동가이드.md`](./FE_API_연동가이드.md)
> 최종 업데이트: 2026-08-08 (A3 · 문서 드리프트 최신화 완료 — `CLAUDE.md`(디렉터리 트리 `api/`·`hooks/` "비어 있음" 정정 + 핵심 파일에 `api/client.ts`·`hooks/useAsync.ts` 추가), `PRD_FRONT.md`(§5 구현 매핑 표를 S1~S7 완료·실제 파일/스토어/훅 목록으로 갱신 + 상단·§5에 보드가 구현 현황 정본이라는 포인터), `FEATURES_FRONT.md`(상단에 인라인 구현 표기가 기준일 스냅샷임을 경고 + 보드 포인터). 소스 무변경(문서만) → lint·build 영향 없음)
> 이전 업데이트: 2026-08-08 (A1 · `/home` 더미 라우트 제거 완료 — `router.tsx`에서 `Home` lazy import·`home` 라우트 블록 삭제 + `src/pages/Home.tsx`(반응형 레이아웃 테스트용 더미) 삭제. `/home`로의 링크·네비게이션 없음 확인(다른 `Home` 참조는 lucide 아이콘으로 무관). lint·build 통과)
> 이전 업데이트: 2026-08-08 (S7 · GBC014 공유+공개뷰 완료 — `getPublicCourse`(순수 axios, 인터셉터 우회)+`shareRouter`(가드 밖 `/share/:id`)+`Share` 읽기전용 공개뷰+`useCourseShare`(카카오 공유 SDK 시도→실패 시 클립보드 폴백)+`kakaoShare`/`courseFormat` 유틸. lint·build 통과. 5173 라이브: 가드 밖·비로그인 401 미발생·에러 UI 검증. 해피패스 데이터 렌더는 백엔드 AI 생성 500 아웃티지로 보류(복구 시 재확인))

## 업데이트 방법
- 작업을 시작하면 `☐` → `◐`(진행중), 끝나면 `☑`(완료)로 바꾼다.
- 완료 시 각 Task의 **DoD**를 만족했는지 확인하고, 하단 **진행 로그**에 한 줄 남긴다.
- 상태 배지: `☐` 대기 · `◐` 진행중 · `☑` 완료 · `⏸` 백엔드 대기(스펙 `보류`/`개발중`)
- 진행률 표는 완료 개수에 맞춰 갱신한다.

---

## 진행률 요약

| 그룹 | 완료 / 전체 | 비고 |
|------|:---:|------|
| Step 0 · 기반 | 4 / 4 | ☑ 완료 — 모든 작업의 선행 |
| 메인 스파인 (코스) | 7 / 8 | S1~S7 완료. 남은 건 S8(⏸ 백엔드 대기) |
| 🏝️ 섬 M · 마이페이지 | 0 / 4 | ⏸ userId 계약 대기(백엔드 미제공) — FE 준비는 완료 |
| 🏝️ 섬 P · POI | 0 / 4 | S0 완료 → P0·P1 착수 가능. P2·P3은 ⏸ |
| 부록 A · 정리(선택) | 2 / 4 | A1·A3 완료. A2·A4 대기 |
| **합계** | **13 / 24** | |

---

## Step 0 · 기반 (먼저, 한 덩어리로)

- [x] `☑` **S0-A · 계약 확인 시도 + 추적표** — 4건 모두 스펙 가정으로 진행(비블로킹). 추적표 신설: `docs/FE_계약_추적표.md`. → 순서 §Step0 0-A
- [x] `☑` **S0-B · API 응답 타입 정의** — `api/tourCourse.ts`(스펙 200 1:1)·`api/poi.ts`(보류라 잠정+`cat↔contentTypeId` 매핑). → 가이드 §1-B
- [x] `☑` **S0-C · authStore userId 보관** — `authStore.userId`+`setAuth`(setAccessToken 확장), `auth.ts`/`client.ts`/`Login`/`Kakao` 연동, localStorage 병행 보관. → 가이드 §1-C
- [x] `☑` **S0-D · 공통 상태 컴포넌트 + 훅 패턴** — `common/EmptyState·ErrorState·Skeleton` + `hooks/useAsync`(loading/error/data/reload). → 가이드 §1-D·§4

## 메인 스파인 · 코스 (순차)

- [x] `☑` **S1 · GBC010 AI 코스 생성** — `Index.handleSearch`→`createCourse`→`plannerStore.loadFromApi`(placeholder POI 합성)→`/planner`. transport 선택 UI·단일 sigunguCode(`47`+값)·한국어 theme 라벨·게스트 courseId 보관·부팅 목업 제거. DoD 코드 충족(장소명은 POI 상세=P3 후). ⚠️ 실백엔드 E2E는 dev 서버 기동 시 확인, ResultsPanel 목 브라우즈는 P2 경계. → 순서 §Step1
- [x] `☑` **S2 · GBC016 저장(소유권 이전)** — 게스트 courseId `sessionStorage` 보관→저장 클릭 시 로그인 게이트→복귀 후 자동 `assignCourse`(`PATCH .../assign`). `onSave` 목업 제거, 중복 저장 가드(`saved`/`saving`), 저장 버튼 진행/완료 UI. `useCourseSave` 훅으로 캡슐화. DoD 충족. ⚠️ 실백엔드 E2E는 dev+백엔드 기동 시 확인. → 순서 §Step2
- [x] `☑` **S3 · GBC011 내 코스 목록** — `api/tourCourse.ts` `getMyCourses`(`GET /tour-course`) + `hooks/useCourseList`(useAsync 래핑) + `Collection.tsx` 전면 구현(카드 그리드·최초로딩 스켈레톤/빈/에러 4상태). 카드=제목·기간(N박M일)·인원·이동수단·테마·생성일. ⚠️ "지역"은 목록 응답 필드에 없어 생략. 카드→`/planner/:courseId` 링크는 전방 배선(라우트는 S4). DoD 충족. → 순서 §Step3
- [x] `☑` **S4 · GBC012 코스 상세** — `api/tourCourse.ts` `getCourse`(`GET /tour-course/{id}`→`CourseDetail`) + `hooks/useCourseDetail`(useAsync 래핑, 성공 시 `loadDetail` 주입) + `plannerStore.loadDetail`(상세→스토어 매핑) + `plannerRouter` `:courseId` 세그먼트. `Planner`가 `useParams`로 진입: 스토어에 해당 코스 없으면 `<Loading>`/`<ErrorState onRetry>`, 있으면 즉시 렌더. 상세 응답 `placeName`으로 실 장소명 표시(`synthesizePoi` 폴백 유지). DoD 충족(카드→상세·URL 재진입). ⚠️ 실백엔드 E2E는 dev+백엔드+로그인 시 확인. → 순서 §Step4
- [x] `☑` **S5 · GBC013 코스 삭제** — `api/tourCourse.ts` `deleteCourse`(`DELETE /tour-course/{id}`) + 재사용 `common/ConfirmDialog`(role=dialog·aria-modal·Escape·오버레이·danger/busy) + `hooks/useCourseDelete`(요청+busy+toast 캡슐화). `Collection` 카드에 삭제 버튼(Link 형제 오버레이, 중첩 회피) → 확인 → 삭제 → `reload()`(서버 진실 재조회). 이중 발사·busy 중 취소 차단, 실패 시 다이얼로그 유지+재시도. DoD 충족. ⚠️ 실백엔드 E2E는 dev+백엔드+로그인 시 확인. → 순서 §Step5
- [x] `☑` **S6 · GBC015 코스 제목 수정** — `api/tourCourse.ts` `updateCourseTitle`(`PATCH /tour-course/{id}/title`) + `plannerStore.setTitle`(낙관적/롤백용) + `hooks/useCourseTitle`(낙관적 업데이트+실패 시 롤백+toast) + `components/planner/EditableCourseTitle`(요약 헤더 인라인 편집: 클릭→input→Enter/blur 저장·Escape 취소·maxLength 255). 편집 노출 조건=`isAuthenticated && storeCourseId!=null`(게스트·미저장은 읽기전용). DoD 충족. ⚠️ 실백엔드 E2E는 dev+백엔드+로그인 시 확인. → 순서 §Step6
- [x] `☑` **S7 · GBC014 공유 + 공개뷰** — `api/tourCourse.ts` `getPublicCourse`(`GET /tour-course/{id}/view`, **순수 axios**로 호출해 401 인터셉터·강제 로그아웃 우회) + `routes/shareRouter`(가드 밖 `/share/:courseId`, `router.tsx`에 RequireAuth 형제로 spread) + `pages/Share/Share`(읽기전용 공개뷰: 요약 헤더+일정 카드, `useAsync`로 로딩/에러) + `hooks/useCourseShare`(카카오 `Share.sendDefault` 시도→키없음/도메인미등록/로드실패 시 클립보드 복사 폴백) + `utils/kakaoShare`(SDK 온디맨드 로드+init) + `utils/courseFormat`(TRANSPORT/PLACE_TYPE 라벨·날짜·기간 헬퍼, Collection과 공유). `Planner.onShare` toast 목업→`share()`, 공유는 로그인 불필요(수신자만 비로그인 열람)로 게이트 제거. DoD 충족. ✅ 5173 라이브: 가드 밖(로그인 리다이렉트 없음)·`/view` 순수 axios 직행(reissue 루프 안 탐)·부재 코스 ErrorState(백엔드 msg 노출)·콘솔 에러 없음. ⚠️ 실데이터 해피패스 렌더·공유 버튼은 백엔드 AI 생성 500 아웃티지(코스 생성 불가·기존 코스 0개)로 라이브 보류 → 복구 시 재확인. → 순서 §Step7
- [ ] `⏸` **S8 · GBC020 코스 수정 영속화** — 의존: S4 **+ 백엔드 완료**(스펙 `개발중`). 편집 UI는 완성, 저장 트리거만. DoD: 편집→저장→재진입 유지. → 순서 §Step8

## 🏝️ 섬 M · 마이페이지 (S0-C 후 병렬 가능)

> ⛔ **착수 보류(백엔드 대기)**: 백엔드가 로그인/재발급 응답·JWT·`/user/me` 어디에도 `userId`를 제공하지 않아, `/user/{userId}` 계열(GBC006~009)을 부를 자기 id를 FE가 얻을 수 없다. 백엔드에 userId 제공(응답 포함 or `/user/me`) 확정 후 착수. FE 측 준비(S0-C)는 완료. 상세: [`FE_계약_추적표.md`](./FE_계약_추적표.md) #4.

- [ ] `☐` **M1 · GBC006 회원정보 조회** ▶ — 의존: S0-C. `userRouter`+`MyPage`+`getUser`+헤더 진입. DoD: 마이페이지에서 내 정보 표시. → 순서 §섬M M1
- [ ] `☐` **M2 · GBC007 닉네임 수정** ▶ — 의존: M1. `updateNickname`. DoD: 편집 후 유지.
- [ ] `☐` **M3 · GBC008 비밀번호 변경** ▶ — 의존: M1. `updatePassword`(현재/신규). DoD: 변경 후 새 비번 재로그인.
- [ ] `☐` **M4 · GBC009 회원 탈퇴** ▶ — 의존: M1. `deleteUser`→`authStore.clear()`. DoD: 탈퇴 후 로그아웃·재로그인 불가.

## 🏝️ 섬 P · POI (S0 후 병렬 가능)

- [ ] `☐` **P0 · 목→API 교체 준비** ▶ — `api/poi.ts` 골격, `cat↔contentTypeId` 매핑, `usePoiList`/`usePoi` 훅. DoD: POI가 훅 경유(현재 목). → 순서 §섬P P0
- [ ] `☐` **P1 · GBC019 POI 좋아요 토글** ▶ — `togglePoiLike`+하트 UI(POICard/PoiDrawer). ⚠️ UI/함수 먼저, **실동작 검증은 실 contentId(P2/P3) 이후**. → 순서 §섬P P1
- [ ] `⏸` **P2 · GBC017 큐레이션 POI 목록** — 의존: P0 **+ 백엔드 완료**(스펙 `보류`). `getPois`+`ResultsPanel` 목 제거. → 순서 §섬P P2
- [ ] `⏸` **P3 · GBC018 POI 상세 통합** — 의존: P2 **+ 백엔드 완료**(스펙 `보류`). `getPoi`+`PoiDrawer`+카카오맵 실연동. → 순서 §섬P P3

## 부록 A · 정리 (선택, API와 독립)

- [x] `☑` **A1 · `/home` 더미 라우트 제거** — `router.tsx`에서 `Home` lazy import·`home` 라우트 블록 삭제 + `src/pages/Home.tsx` 삭제. 링크·네비게이션 없음 확인, lint·build 통과.
- [ ] `☐` **A2 · About 콘텐츠 작성** — `pages/About.tsx`(현재 스텁)
- [x] `☑` **A3 · 문서 드리프트 최신화** — `CLAUDE.md`(디렉터리 트리 정정+핵심 파일 보강)·`PRD_FRONT.md`(§5 구현 매핑 갱신+보드 포인터)·`FEATURES_FRONT.md`(구현 표기 스냅샷 경고+보드 포인터). 보드를 구현 현황 정본으로 명시.
- [ ] `☐` **A4 · RootLayout 정리 판단** — `RootLayout.tsx`(라우터 미연결)

---

## 진행 로그
> 완료할 때마다 `- YYYY-MM-DD · <TaskID> 완료 · <한 줄 메모>` 형식으로 추가.

- 2026-07-17 · 보드 초기 등록 (24개 Task). 착수 전 상태.
- 2026-07-17 · S0-A 완료 · 계약 4건 스펙 가정으로 진행, `docs/FE_계약_추적표.md` 신설(비블로킹).
- 2026-07-17 · S0-B 완료 · `api/tourCourse.ts`·`api/poi.ts` 타입 정의(코스=스펙 1:1, POI=잠정). lint·build 통과.
- 2026-07-17 · S0-C 완료 · `authStore` `userId`+`setAuth` 확장, 로그인/카카오/재발급 연동 + localStorage 보관.
- 2026-07-17 · S0-D 완료 · 공용 `EmptyState`/`ErrorState`/`Skeleton` + `hooks/useAsync` 패턴 확립.
- 2026-07-17 · S0 검증 · 4렌즈 적대적 검증 워크플로 → 확정 2건 반영(useAsync 실패 시 data 보존, ErrorState `aria-hidden`). lint·build 재통과.
- 2026-07-17 · 백엔드 소스(`../back`) 실측 검증 · 계약 4건 대조 → transport/sigunguCode/theme 타입 일치 확정, **userId 백엔드 미제공 확인(섬 M 보류)**, sigungu(법정동47)·theme(라벨) 값주의. 타입 보정 2건(`CoursePlace.type` 주석, `TogglePoiLikeResponse.likes`) + 추적표 실측 갱신.
- 2026-07-17 · S1 완료 · GBC010 생성 파이프라인(홈 검색→`createCourse`→`loadFromApi`→`/planner`) + 이동수단 선택 UI + placeholder POI 렌더(Option A: 생성 응답에 장소명 없어 `장소 #contentId`로 표시, 실데이터는 P3 후). 계약값 적용: transport 대문자 enum·sigunguCode `47`+값 단일·theme 한국어 라벨·게스트 courseId 스토어 보관·부팅 목업/`console.log` 제거. 4렌즈 적대적 검증(15에이전트) → 확정 3종 반영: ①`search.dests`(시군구 코드)를 sigunguStore 라벨로 해석(Planner/ResultsPanel 지역명), ②빈 코스 유령 요약/예산 가드, ③하루 내 `contentId` dedup. lint·build 통과. ⚠️ 실백엔드 E2E는 dev 서버 기동 시 확인 필요, ResultsPanel 목 브라우즈는 P2에서 실 POI로 대체.
- 2026-08-08 · S1 정정 · `sigunguCodes` 계약 드리프트 수정 — FE가 단수 `sigunguCode`(접두 47, 예 `47130`)를 보내 백엔드 `sigunguCodes`(복수, bare 3자리 `lDongSignguCd`, 예 `130`)와 불일치 → 지역 필터가 조용히 무시되던 문제. `CreateCourseRequest.sigunguCodes?: string[]`로 변경, `Index`가 선택 지역 전부(bare value)를 전송(`47` 접두 제거). 라이브 실측: `47130`→"지역 데이터 없음"400 / `130`→지역 통과. 계약 추적표 #2 ☑ 확정으로 갱신. lint·build 통과. (별건: 지역 지정 시 백엔드 AI가 간헐적으로 "존재하지 않는 장소 ID" 400 — 백엔드 이슈. POI `getPois`의 단수 `sigunguCode`는 P2 착수 시 재확인.)
- 2026-08-08 · S3 브라우저 E2E 검증 · 실백엔드(`localhost:8080`) 대상 라이브 확인. ✓가드 리다이렉트(무세션 `/collection/`→`/auth/login`), ✓세션 복원(`POST /auth/reissue` 200)→가드 통과, ✓`GET /tour-course` 200→빈 상태(EmptyState), ✓데이터 상태(코스 생성→목록 카드 렌더: 기간·N박M일·인원·이동수단·테마 배지·생성일 정확, 카드→`/planner/13` 링크 확인). **발견·수정**: AI 생성 코스는 title 빈 값 저장(제목 지정=S6 이후)이라 카드 제목 헤딩이 공백 → `course.title?.trim() || 'AI 추천 코스'` 폴백 추가(커밋 2087c4a). **백엔드 이슈**: 인증 상태 생성 시 백엔드가 생성 시점에 소유권 부여 → 명시적 `PATCH .../assign`은 중복이라 **500** 반환(스펙상 "이미 소유자" 403이어야 함, 백엔드 불일치). FE는 500을 에러 토스트로 정상 처리. (에러 상태 렌더는 라이브 미검증 — 백엔드 강제 실패 경로 필요, 코드/빌드로 커버.)
- 2026-08-08 · S3 완료 · GBC011 내 코스 목록. `api/tourCourse.ts` `getMyCourses()`(`GET /tour-course` → `CourseSummary[]`) + `hooks/useCourseList.ts`(useAsync 래핑, fetcher `useCallback` 안정 참조) 신설. `Collection.tsx`(5줄 스텁 → 전면 구현): 카드 그리드(1/2/3열 반응형), 4상태(최초로딩=스켈레톤 6장·`error`(`!!error`로 좁힘)+데이터 없음=재시도 ErrorState·빈=코스 만들기 CTA EmptyState·데이터=CourseCard). 카드 필드: 제목·기간(`startDate~endDate` + `N박 M일`)·인원·이동수단(enum→한국어)·테마 배지·생성일. 시맨틱 토큰만(base-*·badge-ghost·btn-primary), a11y(skeleton `aria-hidden`·Link `focus-visible`). **주의: GBC011 응답에 지역 필드 없음** → 카드에서 "지역" 생략(DoD 문구와 차이, 스펙상 불가). 카드→`/planner/:courseId` 링크는 전방 배선(동적 라우트는 S4에서 추가, 현재 클릭 시 NotFound). lint·build 통과. ⚠️ 실백엔드 E2E는 dev+백엔드 기동+로그인 시 확인.
- 2026-08-08 · S4 브라우저 E2E 검증 · 실백엔드(`localhost:8080`) 대상 라이브 확인. ✓세션 복원(`POST /auth/reissue` 200)→가드 통과→컬렉션 카드 1개("AI 추천 코스", 2박3일·1명·자동차·문화/음식), ✓카드 클릭→`/planner/13` 이동→`GET /tour-course/13` 200→상세 렌더(요약=경상북도·2박3일·1명, 좌측 코스 패널 Day1/2/3 각 6곳, **실 장소명** `placeName` 표시: 경주 석빙고(관광지 09:00)·고려분식(음식점 12:00)·구미시문화예술회관(문화시설 13:30)·경주 첨성대…), ✓**새로고침 URL 재진입**(`/planner/13` 리로드→`reissue` 200→`getCourse` 200→동일 렌더). (요청 2회는 dev StrictMode 이중 호출, 멱등 확인.) **에러 경로**: 존재하지 않는 id(`/planner/999999`)→백엔드가 **401** 반환(404/403 아님)→axios 인터셉터가 401 처리(reissue 재시도 후 401→auth clear→`/auth/login` 리다이렉트). 즉 401은 페이지 `ErrorState`가 아니라 인터셉터가 처리(가이드 명시대로). ⚠️ **관찰된 부작용**: 로그인 상태에서 잘못된/삭제된 코스 링크 클릭 시 단순 에러가 아니라 **로그아웃**된다(인터셉터 기존 동작, S4 결함 아님 — 401을 토큰만료로 간주해 reissue→실패 시 로그인 유도). 향후 백엔드가 비소유/부재 코스에 403/404를 주면 인앱 에러 상태로 개선 가능.
- 2026-08-08 · S4 완료 · GBC012 코스 상세. `api/tourCourse.ts` `getCourse(courseId)`(`GET /tour-course/{id}` → `CourseDetail`, 봉투 벗김) + `hooks/useCourseDetail.ts`(URL param 받아 유효성 검사 후 fetch, 성공 시 `loadDetail` 주입; param 없으면 fetch 없이 idle) + `plannerStore.loadDetail`(상세 응답을 스토어에 매핑, `search.dests=[]`—상세엔 지역 필드 없음→'경상북도' 폴백) + `plannerRouter` `:courseId` 자식 라우트. `Planner.tsx`: `useParams`로 진입, **판정 기준=스토어가 해당 코스를 들고 있는가**(로딩 플래그 아님 → URL 전환 시 이전 코스 stale 렌더 차단). 스토어에 없으면 `<Loading>`(에러 시 `<ErrorState onRetry={reloadDetail}>`), 있으면 즉시 렌더 후 상세는 백그라운드 갱신(게스트 생성 직후 placeholder→실명 progressive enhancement). `synthesizePoi`에 `place.placeName?.trim() || '장소 #id'` 폴백 추가 → 상세(placeName 있음)는 실 장소명, 생성(없음)은 종전대로. `/planner/*`는 게스트 허용이나 상세는 소유자 인증 필요(정상 흐름=컬렉션 경유 또는 로그인 상태 새로고침이라 인증 상태). Planner 단일 lazy 청크 유지(index·:courseId 공유). lint·build 통과. ⚠️ 실백엔드 E2E는 dev+백엔드+로그인 시 확인.
- 2026-08-08 · S5 브라우저 E2E 검증 · 실백엔드(`localhost:8080`) 대상 라이브 확인(로그인 세션). ✓카드 우상단 삭제 버튼 렌더(aria-label "AI 추천 코스 삭제"), ✓클릭→`ConfirmDialog` 렌더(danger 아이콘·error색·설명에 코스명 보간 "'AI 추천 코스' 코스가 삭제되며…"·취소/삭제 버튼), ✓삭제 확인→`DELETE /api/v1/tour-course/13` **200**→후속 `GET /tour-course` 200(reload)→카드 제거·헤더 카운트 사라짐·EmptyState("저장한 코스가 없어요"+CTA) 렌더, ✓**새로고침 URL 재진입**(`/collection` 리로드→세션 복원→`GET /tour-course` 200 빈 목록→EmptyState 유지 = 서버 삭제 영속, DoD 충족). (GET 2회는 dev StrictMode 이중 호출.) 제품 버그 없음(첫 좌표 클릭 빗나감은 MCP 창 리사이즈 탓, 요소 ref 클릭으로 재수행 — 제품 무관).
- 2026-08-08 · S5 완료 · GBC013 코스 삭제. `api/tourCourse.ts` `deleteCourse(courseId)`(`DELETE /tour-course/{id}`, 봉투 벗김 void) + 재사용 `components/common/ConfirmDialog.tsx`(LoginGateModal a11y 패턴 계승 — `role=dialog`·`aria-modal`·Escape 닫기·오버레이 클릭 닫기, `danger`(error색 강조)·`busy`(스피너+버튼/Escape/오버레이 잠금) prop) + `hooks/useCourseDelete.ts`(서버 요청+진행상태+성공/실패 toast 캡슐화, `deleting` 가드로 이중 발사 방지; useCourseSave 결과 동일). `Collection.tsx`: 카드 우상단 삭제 버튼을 **Link 의 형제**로 배치(앵커 안 버튼 중첩 회피, z-10 오버레이)·제목 `pr-9`로 겹침 방지·생성일은 하단 푸터로 이동. 삭제 확인 대상(`pendingDelete`)은 UI 상태라 페이지 보유, 확인 시 `remove(courseId, ()=>{닫기+reload()})` → 성공 시 목록 서버 재조회(reload는 stale-while-revalidate라 스켈레톤 플래시 없음). 실패 시 다이얼로그 유지+재시도 가능. ⚠️ 코스 **전체** 삭제(플래너 POI 단위 `removePoi`와 무관). lint·build 통과. 실백엔드 E2E(실제 삭제는 파괴적)는 dev+백엔드+로그인 시 확인.
- 2026-08-08 · S6 완료 · GBC015 코스 제목 수정. `api/tourCourse.ts` `updateCourseTitle(courseId, title)`(`PATCH /tour-course/{id}/title`, body `{title}`(255자 이하), 봉투 벗김 void) + `plannerStore.setTitle`(낙관적 업데이트·롤백용 동기 세터) + `hooks/useCourseTitle`(요청 직전 `getState().course.title`로 이전값 캡처→낙관적 `setTitle`→실패 시 롤백+toast, 공백·미변경은 no-op) + `components/planner/EditableCourseTitle`(요약 헤더 제목: `editable=false`면 읽기전용 `<h1>`, `true`면 클릭→autofocus+전체선택 input→**Enter/blur 단일 커밋**·Escape는 `cancelRef`로 blur 커밋 차단해 취소, 저장 중 스피너). `Planner.tsx` 요약 헤더의 읽기전용 `<h1>{course.title}` → `EditableCourseTitle`로 교체, 편집 노출 조건 `isAuthenticated && storeCourseId!=null`(게스트·미저장 코스는 편집 UI 미노출). CoursePanel의 제목 표시(:98)는 스토어 title 반영이라 무변경(낙관적 편집 시 자동 갱신). ⚠️ 비소유 코스 편집 시 백엔드 401→인터셉터 로그아웃(S4 기록 기존 동작, 정상 흐름=컬렉션 경유 소유 코스에선 미발생). lint·build 통과. 실백엔드 E2E(제목 영속·새로고침 유지)는 dev+백엔드+로그인 시 확인.
- 2026-08-08 · S7 완료 · GBC014 공유 + 공개뷰. `api/tourCourse.ts` `getPublicCourse(courseId)`(`GET /tour-course/{id}/view`, **`apiClient` 대신 순수 axios**로 호출 — 공개뷰는 토큰 없이 200이어야 하는데 인터셉터를 타면 비로그인 수신자에게 재발급 실패→강제 로그인 리다이렉트가 걸려 공유 UX가 깨지므로 원천 차단). `routes/shareRouter.tsx`(가드 밖 `/share/:courseId`, `router.tsx`에서 Layout 하위·RequireAuth 형제로 spread) + `pages/Share/Share.tsx`(읽기전용: "공유받은 코스" 배너+요약 헤더(제목·경상북도·기간·인원·이동수단·테마)+Day별 일정 카드(시간·장소명·타입 라벨)+"코스 만들기" CTA, `useAsync`로 로딩/에러) + `hooks/useCourseShare.ts`(공유 흐름 캡슐화: `shareViaKakao`→false면 `copyToClipboard` 폴백, courseId 없으면 no-op, 로그인 불필요) + `utils/kakaoShare.ts`(Kakao JS SDK 온디맨드 `<script>` 주입+`init`, `Share.sendDefault` 피드 템플릿; 키없음·도메인미등록·로드실패 등 모든 실패를 삼켜 false 반환 → 클립보드 폴백이 DoD "링크 생성"을 항상 보장) + `utils/courseFormat.ts`(`TRANSPORT_LABEL`·`PLACE_TYPE_LABEL`·`formatDate`·`formatTime`·`tripDuration` 추출, Collection이 로컬 정의 대신 재사용). `Planner.tsx` `onShare` toast 목업 제거→`share()`, 공유 게이트(requireAuth) 제거(수신자만 비로그인). `client.ts`는 `API_BASE_URL` export(공개 요청 재사용). lint·build 통과.
- 2026-08-08 · S7 브라우저 E2E 검증(5173, 실백엔드) · ✓`/share/999` 진입 시 URL 유지(=**가드 밖**, `/auth/login` 리다이렉트 없음), ✓`GET /tour-course/999/view` **순수 axios 직행→404**(reissue 인터셉터·강제 로그아웃 루프 안 탐; 보인 `auth/reissue` 200 2건은 App 부팅 세션복원으로 `/view`와 무관), ✓부재 코스→`ErrorState`("코스를 찾을 수 없어요"+백엔드 msg "존재하지 않는 코스입니다"(`getApiErrorMessage`)+다시 시도), ✓StrictMode 이중 호출 멱등(2×404 동일), ✓콘솔 에러 없음. App.tsx 부팅 로직 대조: 세션복원 실패 시 `clear()`(게스트)만·리다이렉트 없음 → 로그아웃 수신자도 리다이렉트 없이 공개뷰 열람(DoD 메커니즘 충족). ⚠️ **백엔드 아웃티지**: `POST /tour-course`(AI 생성)가 모든 파라미터 조합에서 즉시 **500**(지역 지정/미지정·테마 무관), 기존 코스 0개(id 1~40 `/view` 스캔 전부 부재) → 실데이터 해피패스 렌더·공유 버튼(카카오/클립보드)은 라이브 미검증(코드·build·lint로 커버, 백엔드 AI 복구 시 재확인). 이 500은 S1 로그의 AI 간헐 오류와 동일 계열의 백엔드 이슈.
- 2026-08-08 · A3 완료 · 문서 드리프트 최신화. **드리프트 원인**: `PRD_FRONT.md`·`FEATURES_FRONT.md`는 기준일 2026-06-06 상위 기획 문서로 "셸 수준·대부분 미구현" 상태를 서술 → 실제 코드는 S1~S7(코스 도메인 API 연동)까지 진척. **정정**: ①`CLAUDE.md` 디렉터리 트리의 `api/`·`hooks/` "(현재 비어 있음)" → 실제 모듈 목록으로 교체 + 핵심 파일에 `api/client.ts`(인터셉터)·`hooks/useAsync.ts` 추가(표준 패턴 노출). ②`PRD_FRONT.md` §5 구현 매핑 표를 실제 파일/라우트/스토어/훅·완료(GBC010~016)·백엔드 대기(섬 P/M) 반영으로 재작성, 상단·§5에 "구현 현황 정본=보드" 포인터 추가, `/home` 제거 완료 반영. ③`FEATURES_FRONT.md` 상단에 인라인 구현 표기가 기준일 스냅샷임을 경고하고 보드로 위임(40여 블록 개별 정정 대신 정본 위임 — 저효율 회피). **소스 무변경(문서만)** → lint·build 영향 없음(A1 통과 상태 유효). 계약 추적표 무관.
- 2026-08-08 · A1 완료 · `/home` 더미 라우트 제거. `router.tsx`에서 `Home` lazy import(구 :14)와 `home` 라우트 블록(구 :32~39) 삭제 + `src/pages/Home.tsx`(반응형 Layout 테스트용 더미 페이지) 삭제. `/home`로의 `Link`/`navigate` 없음 확인(코드베이스 grep — 다른 `Home` 참조는 `NotFoundLayout`/`BudgetDashboard`의 lucide 아이콘으로 무관). lint·build 통과(빌드 산출물에서 Home 청크 사라짐). 파괴적 영향 없음(더미 페이지, 외부 진입점 아님).
- 2026-08-08 · S2 완료 · GBC016 코스 소유권 이전(="저장"). `api/tourCourse.ts` `assignCourse(courseId)`(`PATCH /tour-course/{id}/assign`) + `hooks/useCourseSave.ts`(저장 흐름 캡슐화) 신설. 흐름: 게스트 저장 클릭→`courseId`를 `sessionStorage`에 stash + 로그인 게이트→로그인 성공(클라 내비게이션, zustand 싱글턴이라 스토어 유지)→복귀 시 effect가 대기 저장 감지→`assignCourse` 자동 실행. `Planner.onSave` toast-only 목업 제거, 저장 버튼 진행(spinner)/완료("저장됨") 반영(요약+`BudgetDashboard`). 중복 저장 가드: 백엔드가 이미 소유자 있는 코스에 403 반환→`saved`/`saving` 가드 + `runAssign` 시작 시 `clearPending()`(StrictMode 이중발사 차단). 대기값이 현재 `courseId`와 다르면 폐기(오래된 값). 백엔드 실측 대조(`TourCourseController`·`TourCourseServiceImpl`) 완료. lint·build 통과. ⚠️ 실백엔드 E2E는 dev+백엔드 기동 시 확인.
