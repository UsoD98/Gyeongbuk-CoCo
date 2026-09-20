# v1.1 백로그 (남은 작업)

> **이 파일이 남은 작업의 정본이다.** v1.0 은 배포 완료(태그 `v1.0`)이고, 여기 남은 5건은
> 전부 **FE 구현이 끝나고 바깥 조건만 기다리는** 상태다.
> 상세 사양: [`FE_개발순서.md`](./FE_개발순서.md) §그룹 F·§그룹 R · 계약: [`FE_계약_추적표.md`](./FE_계약_추적표.md) · 설계 결정: [`DECISIONS.md`](./DECISIONS.md)
> 완료 이력(v1.0 Task 상세 · 진행 로그 · 헤더 이력): [`FE_개발_진행상황_아카이브.md`](./FE_개발_진행상황_아카이브.md) — **다음 Task 판단에는 읽지 않아도 된다.**

> 최종 업데이트: 2026-09-20 (v1.0 배포 후 문서 정리 — 보드를 v1.1 백로그로 축약, 설계 결정을 [`DECISIONS.md`](./DECISIONS.md) 로 분리, 완료 Task 상세·진행 로그·헤더 이력은 아카이브로 이관)

---

## 업데이트 방법

- 작업을 시작하면 `☐` → `◐`(진행중), 끝나면 `☑`(완료)로 바꾼다.
- 완료 시 각 Task의 **DoD**를 만족했는지 확인하고, 하단 **진행 로그**에 한 줄 남긴다.
- 상태 배지: `☐` 대기 · `◐` 진행중 · `☑` 완료 · `⏸` 백엔드 대기(스펙 `보류`/`개발중`)
- **보드를 가볍게 유지한다**: Task 가 `☑` 가 되면 착수 당시의 구현·검증 서술은 [`아카이브 §1`](./FE_개발_진행상황_아카이브.md)로 옮기고, 보드에는 한 줄 요약만 남긴다. 진행 로그가 20줄을 넘으면 오래된 회차를 [`아카이브 §2`](./FE_개발_진행상황_아카이브.md)로 옮긴다. 아카이브는 **추가만** 한다(내용 삭제·요약 금지).
- 앞으로 유효한 **구현 규약·설계 결정**이 생기면 [`DECISIONS.md`](./DECISIONS.md)에 추가한다(아카이브는 이력, DECISIONS 는 현행 규칙).

---

## v1.0 출하 현황

| 그룹 | 완료 / 전체 |
|------|:---:|
| Step 0 · 기반 | 4 / 4 ☑ |
| 메인 스파인 (코스 S1~S8) | 8 / 8 ☑ |
| 🏝️ 섬 M · 마이페이지 | 4 / 4 ☑ |
| 🏝️ 섬 P · POI | 4 / 4 ☑ |
| 🧩 그룹 F · 피드백 반영 | 5 / 9 |
| 📱 그룹 R · 모바일 UI/UX | 10 / 11 |
| 부록 A · 정리 | 4 / 4 ☑ |
| **합계** | **39 / 44** |

> 완료 39건의 한 줄 요약은 아래 [v1.0 완료 Task](#v10-완료-task-39건), 착수 당시 상세는 [`아카이브 §1`](./FE_개발_진행상황_아카이브.md).

---

# 남은 작업 5건 — 전부 `◐` (바깥 조건 대기)

> `☐`(즉시 착수 가능) Task 는 **0개**다. 5건 모두 FE 구현은 끝났고 각각 아래를 기다린다.

| Task | 막고 있는 것 | 풀리는 조건 |
|------|------|------|
| **F1** 코스 시각·체류시간 편집 | 브라우저 저장 왕복 재확인 | **로그인 필요 → 사용자 대행** (조직 지침상 에이전트가 비밀번호 입력 불가) |
| **F6** 지도에서 코스 편집 | 저장 후 재진입 유지 | **로그인 필요 → 사용자 대행** |
| **F2** 이동수단 + 교통비 영속 | `PATCH /tour-course/{id}` 바디가 `{schedule}` 뿐 | **백엔드가 `transport`·교통비 필드를 열어 줘야 함** ([요청서 부록 B](./BE_계약_요청서.md)) |
| **F8 ㉡** 밀집 코스 마커 겹침 | "위치 왜곡 < 겹침" 설계 결정 | **사용자 설계 판단** — 근거는 [DECISIONS §2-2](./DECISIONS.md) |
| **R8** 마커 토글 44px | 배지·토글 중심 거리 12.7px (기하 한계) | **사용자 설계 판단** — 근거는 [DECISIONS §2-3](./DECISIONS.md) |

> → 백엔드에 넘길 요청서: **[`BE_계약_요청서.md`](./BE_계약_요청서.md)** (R1 `userId` · ~~R2 코스 장소 좌표~~ 수용됨 · ~~R3 찜 상태 조회~~ 수용됨 · 부록 B `transport` 영속). 회신이 오면 [`FE_계약_추적표.md`](./FE_계약_추적표.md)를 갱신하고 해당 Task 를 착수한다.
> → 검증 환경의 제약(Java 부재 · 실제 손가락 터치 불가 · 390px iframe 하니스)은 [DECISIONS §3](./DECISIONS.md) 참조.

## 📱 그룹 R

> 사양·근거: [`FE_개발순서.md`](./FE_개발순서.md) §그룹 R. R1~R7·R9·R10·R11 은 완료됐고, 그때 확립된 **구현 규약은 [DECISIONS §1](./DECISIONS.md)** 로 옮겼다(새 UI 를 넣기 전에 읽는다).


- [ ] `◐` **R8 · 터치 타깃 44px 미만 정비** 🟠 중요 ▶ — **6곳 중 5곳 DoD 충족 / 마커 토글 1곳만 미달**(2026-09-06). 의존: 없음.
  **한 일**: ①`index.css:21` 의 `.btn-circle{width:24px}` **전역 override 제거** — 근거 없는 규칙이 daisyUI 원형 버튼 전체를 줄여 찜 하트를 **24×32 로 찌그러뜨리고** 있었다(실 CSS 위 A/B 로 재현: override 有 `24×32` → 제거 후 `32×32`). 이 클래스를 쓰는 곳은 `LikeButton` 하나뿐이라 회귀 없음. ②`.tap-44` 유틸리티 신설(`index.css`) — `::before` 로 `max(100%,44px)` 투명 히트박스를 중앙에 깐다. 하트·홈 인원 `−`/`+`·컬렉션 삭제에 적용. ③코스 카드의 시각·금액 인라인 트리거는 **실제 높이 `min-h-11`** 로 줬다 — 투명 확장으로는 위(삭제 `X`)·아래(금액 줄)의 탭 대상을 덮어 도달성이 오히려 나빠진다(카드 98→**142px**, 320px 에서 164px). ④컬렉션 카드 제목 `pr-9`→`pr-12`(넓어진 삭제 히트박스와 글자가 안 겹치게 — Range 로 실측 확인). ⑤`POICard` stacked 하트 `right-2 top-2`→`right-3 top-3` — 카드가 `rounded-2xl`+`overflow-hidden` 이라 8px 자리에서는 44px 상자의 **오른쪽 위 모서리가 둥근 모서리에 잘려** 판정에 걸렸다(실측 후 발견).
  **실측(390×731 iframe 하니스, `getBoundingClientRect` + `elementFromPoint` 중심 스캔)**: 하트 `btn-xs` 원형 24×24→**44×44** ✅ · 하트 `btn-sm` 원형(stacked) 24×32→32×32 CSS/**44×44** ✅ · 하트 드로어(개수형) 70×32→**71×44** ✅ · 홈 인원 −/+ 24×24→**44×45** ✅(확장 모서리에서 눌러도 증감 동작, 가운데 입력칸은 36px 유지) · 컬렉션 삭제 32×32→**45×44** ✅ · 코스 시각 16→**44** ✅ · 코스 금액 24→**44** ✅.
  ⛔ **남은 것 — 마커 토글은 44px 이 기하학적으로 불가능**: 배지(28px)와 토글(22px)의 **중심 거리가 12.7px** 뿐이라 44px 상자는 배지를 거의 다 덮어 **마커 탭(드로어 열기)을 통째로 먹는다**. 배지 반대편(오른쪽 아래)으로만 넓혀 22→**32px** 로 올렸다. 이 작업 중 **실제 회귀를 하나 만들었다가 잡았다** — 처음의 *사각형* 확장은 원형 배지의 중심을 가로채 **마커를 누르면 코스에서 빠지는** 동작이 됐고(하니스 재현), `before:rounded-full` 로 바꾸자 배지 중심 소유가 되돌아왔다(`elementFromPoint(배지 중심) === 배지`, 배지 히트 17×17 로 R8 이전과 동일). F7/F8 의 **'마커 간 40px 이면 도달 보장'** 결론도 다시 계산했다 — 가려짐이 가능한 최대 앵커 거리 **36.80 → 37.26px(＜40)** 로 유지(같은 모델이 R8 이전 값 36.80 을 정확히 재현해 모델 자체를 검증했다). 확장 영역에서의 담기/빼기도 E2E 로 확인(22px 버튼 밖 지점 탭 → 확인 대화상자 → '빼기' → 코스에서 제거). **44px 을 채우려면 마커 디자인 자체를 바꿔야 한다**(토글을 배지에서 떼거나, 선택된 마커에서만 크게 노출) → **F8 ㉡ 과 같은 성격의 설계 판단이라 사용자 결정 대기**.
  📌 **범위 밖으로 남긴 것(사양의 6곳이 아니지만 실측에서 함께 드러난 44px 미만)**: 코스 카드의 장소 삭제 `X`(`btn-xs` 24×24, **파괴적**이라 히트박스를 키우면 오탭 삭제가 늘고 위·아래 줄의 탭 대상과 충돌) · `POICard` 의 '코스 추가' 정사각 버튼(32×32, 양성 동작이라 확장 여지 있음) · 편집 패널의 '완료'/'되돌리기'. **다음 Task 나 별도 지시로 다룰지 판단 필요.** → 순서 §그룹R R8


## 🧩 그룹 F

> 완료분(F3·F4·F5·F7·F9) 상세는 [`아카이브 §1`](./FE_개발_진행상황_아카이브.md) · 아래 4건의 구현 서술은 [`아카이브 §4`](./FE_개발_진행상황_아카이브.md).


- [ ] `◐` **F1 · 코스 시각·체류시간 편집** — FE 완료. 남은 것: **브라우저 저장 왕복 재확인(로그인 필요 → 사용자 대행)**. 서버가 `durationMinutes`·`cost` 를 저장하는 것은 백엔드 소스 실측으로 확인됨(추적표 #5), API 레벨 PATCH→재조회 왕복도 확인됨. → 순서 §그룹F F1 · 상세 [아카이브 §4](./FE_개발_진행상황_아카이브.md)
- [ ] `◐` **F2 · 이동수단 상태화 + 예산 교통비 편집** — FE 완료 / **영속은 백엔드 미지원(`⏸`)**. `PATCH /tour-course/{id}` 바디가 `{schedule}` 뿐이라 `transport`·교통비를 보낼 자리가 없다. 남은 것: 백엔드가 필드를 열어 주면 영속 연결(요청서 부록 B). → 순서 §그룹F F2 · 상세 [아카이브 §4](./FE_개발_진행상황_아카이브.md)
- [ ] `◐` **F6 · 지도에서 코스 편집 — (a)안(마커 토글) 구현 완료** — 드래그 3안은 기각(근거는 아카이브). 남은 것: **저장 후 재진입 유지(DoD 의 영속 절반)가 로그인 필요 → 사용자 대행**. → 순서 §그룹F F6 · 상세 [아카이브 §4](./FE_개발_진행상황_아카이브.md)
- [ ] `◐` **F8 · 남은 도달 불가 2건** — **㉠(지도 컨트롤 겹침) 완료 / ㉡(밀집 코스 마커) 미착수**. ㉡ 은 "위치 왜곡 < 겹침" 설계 결정을 뒤집을지 사용자 판단이 필요하다. 그 외: 합성 드래그 상태에서 관찰된 컨트롤 겹침 1건을 **실제 손 제스처로 재확인** 필요. **로그인·백엔드 없이 착수 가능**. → 순서 §그룹F F8 · 상세 [아카이브 §4](./FE_개발_진행상황_아카이브.md)

---

# v1.0 완료 Task (`☑` 39건)

> 한 줄 요약만 둔다. **착수 당시의 구현·검증 상세는 [`아카이브 §1`](./FE_개발_진행상황_아카이브.md)** 에 원문 그대로 있다.

| Task | 한 줄 요약 |
|------|------|
| `☑` **S0-A** 계약 확인 + 추적표 | 계약 4건 스펙 가정으로 진행(비블로킹). `FE_계약_추적표.md` 신설 |
| `☑` **S0-B** API 응답 타입 정의 | `api/tourCourse.ts`(스펙 1:1)·`api/poi.ts`(잠정 + `cat↔contentTypeId` 매핑) |
| `☑` **S0-C** authStore userId 보관 | `authStore.userId`+`setAuth`, 로그인/카카오/재발급 연동 + localStorage 병행 |
| `☑` **S0-D** 공통 상태 컴포넌트 + 훅 | `common/EmptyState·ErrorState·Skeleton` + `hooks/useAsync` |
| `☑` **S1** GBC010 AI 코스 생성 | 홈 검색 → `createCourse` → `loadFromApi` → `/planner`. transport·sigunguCodes·한국어 theme |
| `☑` **S2** GBC016 저장(소유권 이전) | 게스트 courseId sessionStorage → 로그인 게이트 → 복귀 후 자동 `assignCourse` |
| `☑` **S3** GBC011 내 코스 목록 | `getMyCourses` + `useCourseList` + `Collection.tsx` 카드 그리드(4상태) |
| `☑` **S4** GBC012 코스 상세 | `getCourse` + `useCourseDetail` + `plannerStore.loadDetail` + `/planner/:courseId` |
| `☑` **S5** GBC013 코스 삭제 | `deleteCourse` + 재사용 `ConfirmDialog` + `useCourseDelete` |
| `☑` **S6** GBC015 코스 제목 수정 | `updateCourseTitle` + `useCourseTitle`(낙관적·롤백) + `EditableCourseTitle` |
| `☑` **S7** GBC014 공유 + 공개뷰 | `getPublicCourse`(순수 axios로 401 인터셉터 우회) + 가드 밖 `/share/:id` + 카카오 공유/클립보드 폴백 |
| `☑` **S8** GBC020 코스 수정 영속화 | `updateCourse` + `buildSchedulePayload`(schedule 전체 교체) + `useCourseUpdate`. 라이브 E2E 통과 |
| `☑` **M1** GBC006 회원정보 조회 | `utils/jwt.ts`(토큰 클레임에서 userId) + `getUser`/`useUser` + `pages/User/MyPage` + `userRouter`(`/mypage`) + 헤더 계정 메뉴 진입. **조회 결과는 카드로 노출하지 않고**(사용자 요청) 닉네임 프리필·탈퇴 확인 문구에만 쓴다 |
| `☑` **M2** GBC007 닉네임 수정 | `updateNickname` + `useNicknameUpdate` + `NicknameForm`(2~100자 검증 · 저장 후 재조회 · key 리셋) |
| `☑` **M3** GBC008 비밀번호 변경 | `updatePassword` + `usePasswordUpdate` + `PasswordForm`(현재/신규/확인 3필드) → 성공 시 로그아웃 후 재로그인 유도 |
| `☑` **M4** GBC009 회원 탈퇴 | `deleteUser` + `useAccountDelete` + `DangerZone`(`ConfirmDialog` danger) → `authStore.clear()` → `RequireAuth` 가 로그인 화면으로 |
| `☑` **P0** 목→API 교체 준비 | `usePoiList`(P2 교체점)·`usePoi`(P3 교체점) 신설, 소비처를 훅 경유로 |
| `☑` **P1** GBC019 POI 좋아요 토글 | `togglePoiLike` + `poiLikeStore` + `loginGateStore`(게이트 전역화) + `usePoiLike` + `LikeButton` |
| `☑` **P2** GBC017 큐레이션 POI 목록 | `getPois` 실측 타입 1:1 + `usePoiList` 목→API(시군구 병렬 조회·in-flight dedup) |
| `☑` **P3** GBC018 POI 상세 통합 | `getPoi` + `usePoi` 실조회(캐시·dedup·stale 차단) + `utils/poiDetail`(상세는 빈 칸만 채움) |
| `☑` **F3** 수단별 코스 간 이동시간 | `utils/travelTime.ts`(haversine × 우회 1.3 × 수단별 실효속도) + `TravelConnector` |
| `☑` **F4** 좋아요 토글 정합성 조사 | 원인 확정(백엔드는 진짜 토글, 증상은 기수정된 저장 유실 버그) + FE 결함 2건 수정 |
| `☑` **F5** 지도 코스 전용 표시 | 지도 모드를 지역 미선택 early return **앞으로** + `내 코스만 보기` 토글. 컬렉션 진입 지도 미표시 해소 |
| `☑` **F7** 지도 마커 겹침 도달 불가 | `mapCluster.ts` 신설(`clusterMarkers`·`spreadOverlaps`). 실 백엔드 경주 316곳 라이브 실측 통과 |
| `☑` **F9** `liked`·`totalLiked`·`stars` 연동 | 타입 3종 실측 1:1 + `poiLikeStore` 2맵·비덮어쓰기 hydrate + 세션 키 dedup. 로그인 E2E 통과 |
| `☑` **R1** 코스 카드 모바일 스크롤 | `touch-none` 을 카드 루트 → 사진 드래그 핸들로 이동. 리스트 스크롤 가능 면적 40% → 90.8% |
| `☑` **R2** 트리 동시 마운트 제거 | `useMediaQuery`(`useSyncExternalStore`) 신설 + 한쪽 트리만 마운트. KakaoMap 2개 → 1개, `GET /poi` 1회 |
| `☑` **R3** 모바일 탭 상태 유지 | 세 패널 상시 마운트 + `hidden` 전환, `KakaoMap` 0×0 복귀 `relayout()`. 뷰모드·칩·더보기·스크롤·지도 뷰포트 유지 |
| `☑` **R4** 320px 가로 스크롤 제거 | `Layout` 의 `min-w-90` 제거 + `CatBadge`·`CourseItem`·`Collection` 잘림 3건 정리. 320px 10개 화면 가로 스크롤 0 |
| `☑` **R5** 오버레이 스크롤 락·안전영역 | `useBodyScrollLock`(body fixed + 카운팅) 신설 → 오버레이 4종 적용 + `overscroll-contain`·grabber·`viewport-fit=cover`·`env(safe-area-*)` 3곳 |
| `☑` **R6** 지도 페이지 스크롤 삼킴 해소 | 모바일 지도 기본 잠금(`setDraggable`/`setZoomable` + `.map-locked` 로 SDK 인라인 `touch-action:none` 무력화) + '지도 조작' 토글. 마커 탭·토글 무회귀 |
| `☑` **R7** 헤더 팝오버 z 계층 정리 | `.navbar` 를 `z-30` 스택 컨텍스트로 + 모바일 메뉴 `z-20`·계정 드롭다운 `z-30`. z 사다리를 `index.css` 주석으로 문서화. 6화면 전수 통과 |
| `☑` **R9** 토스트 위치 반응형 | `toast-center toast-bottom` + `sm:toast-end sm:toast-top` — 모바일 하단 중앙 / 640px↑ 종전 우상단. `env(safe-area-inset-bottom)` + 렌더 3개 상한. 폭 6종 실측 |
| `☑` **R10** 홈 검색바 시각 단서 + DatePicker | 모바일만 `FIELD_SHELL`(테두리·48px)로 5개 칸을 입력 컨트롤로 보이게 + 트리거에 `tap-44` · DatePicker `withPortal`(셀 44px 피치·스크롤 잠금·z 60). 데스크톱 무회귀 실측 |
| `☑` **R11** 폰트 700 · hover · 메타 태그 | Pretendard dynamic-subset 교체(웨이트 1종→5종, 전송량 -56%) + 카드 `active:` 눌림 피드백(hover 고착은 Tailwind v4 가 이미 처리) + `theme-color`·`description`·OG 6종. 덤: 카카오 공유 썸네일 `favicon.svg`→`gbcoco-icon.jpg` |
| `☑` **A1** `/home` 더미 라우트 제거 | `router.tsx` 라우트 블록 + `pages/Home.tsx` 삭제 |
| `☑` **A2** About 콘텐츠 작성 | 서비스 소개 페이지(히어로·핵심기능·이용방법·CTA) + 푸터 링크·저작권 정정 |
| `☑` **A3** 문서 드리프트 최신화 | `CLAUDE.md`·`PRD_FRONT.md`·`FEATURES_FRONT.md` 를 실코드에 맞춤 + 보드 포인터 |
| `☑` **A4** RootLayout 정리 판단 | CLAUDE.md 규칙상 존치 결정. 의도된 플레이스홀더임을 주석으로 문서화 |


---

## 진행 로그

> 완료할 때마다 `- YYYY-MM-DD · <TaskID> 완료 · <한 줄 메모>` 형식으로 추가.
> **2026-09-06 이전 전량은 [`아카이브 §2`](./FE_개발_진행상황_아카이브.md) 로 옮겼다.** 20줄을 넘기면 오래된 회차부터 계속 옮긴다.

- 2026-09-20 · **v1.0 문서 정리** · 배포 완료 시점에 `v1.0` 태그를 찍고 docs 를 정리했다. 삭제 6건(`FE_API_현황.md`·`FE_API_연동가이드.md`·`planner-guide.md`·`git-workflow.md`·`PRD_BACK.md`·`FEATURES_BACK.md`), 기획 산출물 3건은 `docs/archive/` 로 보존 이동, 보드는 v1.1 백로그로 축약, 살아 있는 구현 규약·설계 결정은 `DECISIONS.md` 로 분리. README 를 v1.0 기준으로 재작성(깨진 `PRD_OLD.md` 링크·"개발 중" 표기·누락 환경변수 2종 수정). 소스 무변경.
