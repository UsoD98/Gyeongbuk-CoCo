# 프론트엔드 개발 진행상황 (Task 보드)

> **이 파일이 진행상황의 정본이다.** 새 세션을 시작해도 이 파일을 열면 어디까지 됐는지 알 수 있다.
> 상세 사양: [`FE_개발순서.md`](./FE_개발순서.md) · 현재 상태: [`FE_API_현황.md`](./FE_API_현황.md) · 레시피: [`FE_API_연동가이드.md`](./FE_API_연동가이드.md)
> 최종 업데이트: 2026-08-08 (S5 · GBC013 코스 삭제 완료 — 카드 삭제 버튼+재사용 `ConfirmDialog`(danger/busy)→`deleteCourse`→목록 `reload`. lint·build 통과. 실백엔드 E2E는 dev+백엔드+로그인 시 확인)

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
| 메인 스파인 (코스) | 5 / 8 | S1·S2·S3·S4·S5 완료. 다음 S6(제목수정). Step 8은 ⏸ |
| 🏝️ 섬 M · 마이페이지 | 0 / 4 | ⏸ userId 계약 대기(백엔드 미제공) — FE 준비는 완료 |
| 🏝️ 섬 P · POI | 0 / 4 | S0 완료 → P0·P1 착수 가능. P2·P3은 ⏸ |
| 부록 A · 정리(선택) | 0 / 4 | API와 독립 |
| **합계** | **9 / 24** | |

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
- [ ] `☐` **S6 · GBC015 코스 제목 수정** ▶ — 의존: S4. 인라인 편집+`updateCourseTitle`. DoD: 변경 후 새로고침 유지. → 순서 §Step6  ← **다음 착수 후보**
- [ ] `☐` **S7 · GBC014 공유 + 공개뷰** ▶ — 의존: S2, S4. `shareRouter`(가드 밖)+`getPublicCourse`+카카오 공유. DoD: 비로그인 링크로 코스 표시. → 순서 §Step7
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
- 2026-07-17 · 백엔드 소스(`../back`) 실측 검증 · 계약 4건 대조 → transport/sigunguCode/theme 타입 일치 확정, **userId 백엔드 미제공 확인(섬 M 보류)**, sigungu(법정동47)·theme(라벨) 값주의. 타입 보정 2건(`CoursePlace.type` 주석, `TogglePoiLikeResponse.likes`) + 추적표 실측 갱신.
- 2026-07-17 · S1 완료 · GBC010 생성 파이프라인(홈 검색→`createCourse`→`loadFromApi`→`/planner`) + 이동수단 선택 UI + placeholder POI 렌더(Option A: 생성 응답에 장소명 없어 `장소 #contentId`로 표시, 실데이터는 P3 후). 계약값 적용: transport 대문자 enum·sigunguCode `47`+값 단일·theme 한국어 라벨·게스트 courseId 스토어 보관·부팅 목업/`console.log` 제거. 4렌즈 적대적 검증(15에이전트) → 확정 3종 반영: ①`search.dests`(시군구 코드)를 sigunguStore 라벨로 해석(Planner/ResultsPanel 지역명), ②빈 코스 유령 요약/예산 가드, ③하루 내 `contentId` dedup. lint·build 통과. ⚠️ 실백엔드 E2E는 dev 서버 기동 시 확인 필요, ResultsPanel 목 브라우즈는 P2에서 실 POI로 대체.
- 2026-08-08 · S1 정정 · `sigunguCodes` 계약 드리프트 수정 — FE가 단수 `sigunguCode`(접두 47, 예 `47130`)를 보내 백엔드 `sigunguCodes`(복수, bare 3자리 `lDongSignguCd`, 예 `130`)와 불일치 → 지역 필터가 조용히 무시되던 문제. `CreateCourseRequest.sigunguCodes?: string[]`로 변경, `Index`가 선택 지역 전부(bare value)를 전송(`47` 접두 제거). 라이브 실측: `47130`→"지역 데이터 없음"400 / `130`→지역 통과. 계약 추적표 #2 ☑ 확정으로 갱신. lint·build 통과. (별건: 지역 지정 시 백엔드 AI가 간헐적으로 "존재하지 않는 장소 ID" 400 — 백엔드 이슈. POI `getPois`의 단수 `sigunguCode`는 P2 착수 시 재확인.)
- 2026-08-08 · S3 브라우저 E2E 검증 · 실백엔드(`localhost:8080`) 대상 라이브 확인. ✓가드 리다이렉트(무세션 `/collection/`→`/auth/login`), ✓세션 복원(`POST /auth/reissue` 200)→가드 통과, ✓`GET /tour-course` 200→빈 상태(EmptyState), ✓데이터 상태(코스 생성→목록 카드 렌더: 기간·N박M일·인원·이동수단·테마 배지·생성일 정확, 카드→`/planner/13` 링크 확인). **발견·수정**: AI 생성 코스는 title 빈 값 저장(제목 지정=S6 이후)이라 카드 제목 헤딩이 공백 → `course.title?.trim() || 'AI 추천 코스'` 폴백 추가(커밋 2087c4a). **백엔드 이슈**: 인증 상태 생성 시 백엔드가 생성 시점에 소유권 부여 → 명시적 `PATCH .../assign`은 중복이라 **500** 반환(스펙상 "이미 소유자" 403이어야 함, 백엔드 불일치). FE는 500을 에러 토스트로 정상 처리. (에러 상태 렌더는 라이브 미검증 — 백엔드 강제 실패 경로 필요, 코드/빌드로 커버.)
- 2026-08-08 · S3 완료 · GBC011 내 코스 목록. `api/tourCourse.ts` `getMyCourses()`(`GET /tour-course` → `CourseSummary[]`) + `hooks/useCourseList.ts`(useAsync 래핑, fetcher `useCallback` 안정 참조) 신설. `Collection.tsx`(5줄 스텁 → 전면 구현): 카드 그리드(1/2/3열 반응형), 4상태(최초로딩=스켈레톤 6장·`error`(`!!error`로 좁힘)+데이터 없음=재시도 ErrorState·빈=코스 만들기 CTA EmptyState·데이터=CourseCard). 카드 필드: 제목·기간(`startDate~endDate` + `N박 M일`)·인원·이동수단(enum→한국어)·테마 배지·생성일. 시맨틱 토큰만(base-*·badge-ghost·btn-primary), a11y(skeleton `aria-hidden`·Link `focus-visible`). **주의: GBC011 응답에 지역 필드 없음** → 카드에서 "지역" 생략(DoD 문구와 차이, 스펙상 불가). 카드→`/planner/:courseId` 링크는 전방 배선(동적 라우트는 S4에서 추가, 현재 클릭 시 NotFound). lint·build 통과. ⚠️ 실백엔드 E2E는 dev+백엔드 기동+로그인 시 확인.
- 2026-08-08 · S4 브라우저 E2E 검증 · 실백엔드(`localhost:8080`) 대상 라이브 확인. ✓세션 복원(`POST /auth/reissue` 200)→가드 통과→컬렉션 카드 1개("AI 추천 코스", 2박3일·1명·자동차·문화/음식), ✓카드 클릭→`/planner/13` 이동→`GET /tour-course/13` 200→상세 렌더(요약=경상북도·2박3일·1명, 좌측 코스 패널 Day1/2/3 각 6곳, **실 장소명** `placeName` 표시: 경주 석빙고(관광지 09:00)·고려분식(음식점 12:00)·구미시문화예술회관(문화시설 13:30)·경주 첨성대…), ✓**새로고침 URL 재진입**(`/planner/13` 리로드→`reissue` 200→`getCourse` 200→동일 렌더). (요청 2회는 dev StrictMode 이중 호출, 멱등 확인.) **에러 경로**: 존재하지 않는 id(`/planner/999999`)→백엔드가 **401** 반환(404/403 아님)→axios 인터셉터가 401 처리(reissue 재시도 후 401→auth clear→`/auth/login` 리다이렉트). 즉 401은 페이지 `ErrorState`가 아니라 인터셉터가 처리(가이드 명시대로). ⚠️ **관찰된 부작용**: 로그인 상태에서 잘못된/삭제된 코스 링크 클릭 시 단순 에러가 아니라 **로그아웃**된다(인터셉터 기존 동작, S4 결함 아님 — 401을 토큰만료로 간주해 reissue→실패 시 로그인 유도). 향후 백엔드가 비소유/부재 코스에 403/404를 주면 인앱 에러 상태로 개선 가능.
- 2026-08-08 · S4 완료 · GBC012 코스 상세. `api/tourCourse.ts` `getCourse(courseId)`(`GET /tour-course/{id}` → `CourseDetail`, 봉투 벗김) + `hooks/useCourseDetail.ts`(URL param 받아 유효성 검사 후 fetch, 성공 시 `loadDetail` 주입; param 없으면 fetch 없이 idle) + `plannerStore.loadDetail`(상세 응답을 스토어에 매핑, `search.dests=[]`—상세엔 지역 필드 없음→'경상북도' 폴백) + `plannerRouter` `:courseId` 자식 라우트. `Planner.tsx`: `useParams`로 진입, **판정 기준=스토어가 해당 코스를 들고 있는가**(로딩 플래그 아님 → URL 전환 시 이전 코스 stale 렌더 차단). 스토어에 없으면 `<Loading>`(에러 시 `<ErrorState onRetry={reloadDetail}>`), 있으면 즉시 렌더 후 상세는 백그라운드 갱신(게스트 생성 직후 placeholder→실명 progressive enhancement). `synthesizePoi`에 `place.placeName?.trim() || '장소 #id'` 폴백 추가 → 상세(placeName 있음)는 실 장소명, 생성(없음)은 종전대로. `/planner/*`는 게스트 허용이나 상세는 소유자 인증 필요(정상 흐름=컬렉션 경유 또는 로그인 상태 새로고침이라 인증 상태). Planner 단일 lazy 청크 유지(index·:courseId 공유). lint·build 통과. ⚠️ 실백엔드 E2E는 dev+백엔드+로그인 시 확인.
- 2026-08-08 · S5 완료 · GBC013 코스 삭제. `api/tourCourse.ts` `deleteCourse(courseId)`(`DELETE /tour-course/{id}`, 봉투 벗김 void) + 재사용 `components/common/ConfirmDialog.tsx`(LoginGateModal a11y 패턴 계승 — `role=dialog`·`aria-modal`·Escape 닫기·오버레이 클릭 닫기, `danger`(error색 강조)·`busy`(스피너+버튼/Escape/오버레이 잠금) prop) + `hooks/useCourseDelete.ts`(서버 요청+진행상태+성공/실패 toast 캡슐화, `deleting` 가드로 이중 발사 방지; useCourseSave 결과 동일). `Collection.tsx`: 카드 우상단 삭제 버튼을 **Link 의 형제**로 배치(앵커 안 버튼 중첩 회피, z-10 오버레이)·제목 `pr-9`로 겹침 방지·생성일은 하단 푸터로 이동. 삭제 확인 대상(`pendingDelete`)은 UI 상태라 페이지 보유, 확인 시 `remove(courseId, ()=>{닫기+reload()})` → 성공 시 목록 서버 재조회(reload는 stale-while-revalidate라 스켈레톤 플래시 없음). 실패 시 다이얼로그 유지+재시도 가능. ⚠️ 코스 **전체** 삭제(플래너 POI 단위 `removePoi`와 무관). lint·build 통과. 실백엔드 E2E(실제 삭제는 파괴적)는 dev+백엔드+로그인 시 확인.
- 2026-08-08 · S2 완료 · GBC016 코스 소유권 이전(="저장"). `api/tourCourse.ts` `assignCourse(courseId)`(`PATCH /tour-course/{id}/assign`) + `hooks/useCourseSave.ts`(저장 흐름 캡슐화) 신설. 흐름: 게스트 저장 클릭→`courseId`를 `sessionStorage`에 stash + 로그인 게이트→로그인 성공(클라 내비게이션, zustand 싱글턴이라 스토어 유지)→복귀 시 effect가 대기 저장 감지→`assignCourse` 자동 실행. `Planner.onSave` toast-only 목업 제거, 저장 버튼 진행(spinner)/완료("저장됨") 반영(요약+`BudgetDashboard`). 중복 저장 가드: 백엔드가 이미 소유자 있는 코스에 403 반환→`saved`/`saving` 가드 + `runAssign` 시작 시 `clearPending()`(StrictMode 이중발사 차단). 대기값이 현재 `courseId`와 다르면 폐기(오래된 값). 백엔드 실측 대조(`TourCourseController`·`TourCourseServiceImpl`) 완료. lint·build 통과. ⚠️ 실백엔드 E2E는 dev+백엔드 기동 시 확인.
