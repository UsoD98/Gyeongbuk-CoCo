# 프론트엔드 개발 진행상황 (Task 보드)

> **이 파일이 진행상황의 정본이다.** 새 세션을 시작해도 이 파일을 열면 어디까지 됐는지 알 수 있다.
> 상세 사양: [`FE_개발순서.md`](./FE_개발순서.md) · 현재 상태: [`FE_API_현황.md`](./FE_API_현황.md) · 레시피: [`FE_API_연동가이드.md`](./FE_API_연동가이드.md)
> 최종 업데이트: 2026-07-17 (Step 0 · 기반 완료 — S0-A~D)

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
| 메인 스파인 (코스) | 0 / 8 | S1 착수 가능(S0-A·B 완료). Step 8은 ⏸ |
| 🏝️ 섬 M · 마이페이지 | 0 / 4 | S0-C 완료 → 병렬 착수 가능 |
| 🏝️ 섬 P · POI | 0 / 4 | S0 완료 → P0·P1 착수 가능. P2·P3은 ⏸ |
| 부록 A · 정리(선택) | 0 / 4 | API와 독립 |
| **합계** | **4 / 24** | |

---

## Step 0 · 기반 (먼저, 한 덩어리로)

- [x] `☑` **S0-A · 계약 확인 시도 + 추적표** — 4건 모두 스펙 가정으로 진행(비블로킹). 추적표 신설: `docs/FE_계약_추적표.md`. → 순서 §Step0 0-A
- [x] `☑` **S0-B · API 응답 타입 정의** — `api/tourCourse.ts`(스펙 200 1:1)·`api/poi.ts`(보류라 잠정+`cat↔contentTypeId` 매핑). → 가이드 §1-B
- [x] `☑` **S0-C · authStore userId 보관** — `authStore.userId`+`setAuth`(setAccessToken 확장), `auth.ts`/`client.ts`/`Login`/`Kakao` 연동, localStorage 병행 보관. → 가이드 §1-C
- [x] `☑` **S0-D · 공통 상태 컴포넌트 + 훅 패턴** — `common/EmptyState·ErrorState·Skeleton` + `hooks/useAsync`(loading/error/data/reload). → 가이드 §1-D·§4

## 메인 스파인 · 코스 (순차)

- [ ] `☐` **S1 · GBC010 AI 코스 생성** ▶ — 의존: S0-A, S0-B. `Index.handleSearch`→`createCourse`→`plannerStore.loadFromApi`→`/planner`. DoD: 검색→실제 코스 표시. → 순서 §Step1
- [ ] `☐` **S2 · GBC016 저장(소유권 이전)** ▶ — 의존: S1. 게스트 courseId 보관→로그인→`assign`. DoD: 저장 후 내 계정 귀속. → 순서 §Step2
- [ ] `☐` **S3 · GBC011 내 코스 목록** ▶ — 의존: S2, S0-D. `Collection.tsx` 구현+`getMyCourses`. DoD: 저장 코스 카드 렌더+빈/로딩/에러. → 순서 §Step3
- [ ] `☐` **S4 · GBC012 코스 상세** ▶ — 의존: S3. `plannerRouter :courseId`+`getCourse`. DoD: 카드→상세 일정 렌더, URL 재진입. → 순서 §Step4
- [ ] `☐` **S5 · GBC013 코스 삭제** ▶ — 의존: S3(/S4). `deleteCourse`+확인 다이얼로그. DoD: 삭제 후 목록에서 사라짐. → 순서 §Step5
- [ ] `☐` **S6 · GBC015 코스 제목 수정** ▶ — 의존: S4. 인라인 편집+`updateCourseTitle`. DoD: 변경 후 새로고침 유지. → 순서 §Step6
- [ ] `☐` **S7 · GBC014 공유 + 공개뷰** ▶ — 의존: S2, S4. `shareRouter`(가드 밖)+`getPublicCourse`+카카오 공유. DoD: 비로그인 링크로 코스 표시. → 순서 §Step7
- [ ] `⏸` **S8 · GBC020 코스 수정 영속화** — 의존: S4 **+ 백엔드 완료**(스펙 `개발중`). 편집 UI는 완성, 저장 트리거만. DoD: 편집→저장→재진입 유지. → 순서 §Step8

## 🏝️ 섬 M · 마이페이지 (S0-C 후 병렬 가능)

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

- [ ] `☐` **A1 · `/home` 더미 라우트 제거** — `router.tsx`, `Home.tsx`
- [ ] `☐` **A2 · About 콘텐츠 작성** — `pages/About.tsx`(현재 스텁)
- [ ] `☐` **A3 · 문서 드리프트 최신화** — `FEATURES_FRONT.md`·`PRD_FRONT.md`·`CLAUDE.md`
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
