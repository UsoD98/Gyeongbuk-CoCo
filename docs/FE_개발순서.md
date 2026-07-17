# 프론트엔드 개발 순서 (구현 배정용)

> 짝 문서: [`FE_API_현황.md`](./FE_API_현황.md) (현재 상태) · [`FE_API_연동가이드.md`](./FE_API_연동가이드.md) (구현 레시피)
> 기준 스펙: `openapi.yaml` (GBC001~020) · 대상: `front/src`
> 이 문서의 목적: **이 순서대로 구현을 배정**한다. 각 Step은 그 자체로 하나의 배정 단위(≈ PR 1개)다.

---

## 이 문서 읽는 법

**실행 모델** — 한 명(또는 한 에이전트)이 **메인 스파인을 위→아래 순차**로 진행한다. 단, 아래 두 **독립 섬**은 Step 0만 끝나면 코스 파이프라인과 **병렬로 당겨서** 할 수 있다.
- 🏝️ **섬 M** — 마이페이지 (GBC006~009)
- 🏝️ **섬 P** — POI (GBC017~019)

**각 Step 표기 규약**
- **의존**: 먼저 끝나 있어야 하는 Step
- **파일**: 새로 만들거나 고칠 주요 파일
- **DoD**(Definition of Done): 이걸 만족해야 완료
- **검증**: `npm run dev`로 사람이 직접 확인하는 시나리오
- **가이드**: 구현 상세가 있는 `FE_API_연동가이드.md` 섹션
- **상태 배지**: `▶ 즉시` 가능 / `⏸ 백엔드 대기`(스펙 `보류`/`개발중`)

**공통 완료 규약**(모든 Step 적용) — `npm run lint` 통과 · `npm run build`(TS 타입검사) 통과 · 모바일/데스크톱 폭 확인 · 목데이터 참조 제거(해당 시) · 에러는 `getApiErrorMessage()` + `toast` 처리.

---

## 전체 순서 한눈에

```
┌─ Step 0 · 기반 (모든 것의 선행) ─────────────────────────┐
│  0-A 계약 확인 시도 + 추적표   0-B API 타입              │
│  0-C authStore userId 보관     0-D 공통 상태 컴포넌트/훅 │
└──────────────────────────────┬───────────────────────────┘
                               │
   ┌───────────────────────────┼───────────────────────────┐
   ▼ (메인 스파인)             ▼ 🏝️섬 M            ▼ 🏝️섬 P
 Step 1 GBC010 생성          Step M1 006 조회    Step P0 목→API 준비
 Step 2 GBC016 저장(=귀속)   Step M2 007 닉네임  Step P1 019 좋아요 ▶
 Step 3 GBC011 목록          Step M3 008 비번    Step P2 017 목록 ⏸
 Step 4 GBC012 상세          Step M4 009 탈퇴    Step P3 018 상세 ⏸
 Step 5 GBC013 삭제
 Step 6 GBC015 제목수정
 Step 7 GBC014 공유+공개뷰
 Step 8 GBC020 코스수정 영속화 ⏸

부록 A · 정리(선택): /home 제거 · About 콘텐츠 · 문서 드리프트 최신화
```

**핵심 의존 사슬(반드시 이 순서)**: 생성(1) → 저장/귀속(2) → 목록(3) → 상세(4). "코스를 만들어 저장하고 다시 본다"는 서비스 핵심 루프이며, 이게 서면 5~8은 그 위에 얹힌다.

---

## Step 0 · 기반 (Foundation)

> 1~8 모든 Step의 선행. **하나의 배정 단위로 묶어 가장 먼저** 끝낸다. 여기가 서면 코스/마이페이지/POI가 동시에 열린다.

### 0-A. 계약 확인 시도 + 추적표 (비블로킹)

착수 시 백엔드에 아래 4건을 확인 요청한다. **답이 오면 반영, 안 오면 "스펙 가정"으로 진행하고 이 표를 코드 주석·PR에 남긴다.** 나중에 400이 나면 이 표부터 본다.

| 항목 | 스펙 가정(답 없을 때 이대로) | 확인 필요 | 상태 |
|------|------------------------------|-----------|:---:|
| `transport` | 대문자 `CAR`/`PUBLIC_TRANSPORT`/`WALK` | enum 값 확정 | ☐ |
| `sigunguCode` | 단일 string, `35130`(TourAPI 35 접두) 체계 | 단일값 여부 + `35`냐 `47`이냐 | ☐ |
| `theme` | 문자열 배열(예 `자연`,`맛집`) | 코드(`001`) vs 라벨(`자연`) | ☐ |
| `userId` | 로그인/재발급 응답 `data.userId` 포함 | 포함 여부, 아니면 `/user/me` 제공 여부 | ☐ |

- **파일**: (착수 문서/PR 설명에 표 유지)
- **DoD**: 4건 각각 "확정" 또는 "스펙 가정 + TODO" 상태가 명시됨.

### 0-B. API 응답 타입 정의
- **파일**: `api/tourCourse.ts`, `api/poi.ts` (타입 선언부만 먼저)
- **내용**: 가이드 §1-B의 `CourseSummary`/`CourseDetail`/`CoursePlace`/`CreateCourseRequest`/`CreateCourseResponse` 등. 백엔드 `ApiResponse<T>` 봉투 기준.
- **DoD**: 코스/POI 응답 타입이 스펙 200 예시와 1:1로 정의되고 컴파일됨.
- **가이드**: §1-B

### 0-C. `authStore`에 `userId` 보관
- **파일**: `stores/authStore.ts`, `api/auth.ts`(`LoginResponse`), `pages/Auth/Login.tsx`, `components/auth/KakoLoginComponent.tsx`
- **내용**: `userId` 필드 추가 + 로그인/카카오/재발급 성공 시 세팅. (0-A의 userId 계약 결과 반영)
- **DoD**: 로그인 후 `useAuthStore.getState().userId`로 내 id를 읽을 수 있음. → 섬 M의 선행.
- **가이드**: §1-C

### 0-D. 공통 상태 컴포넌트 + 데이터 훅 패턴
- **파일**: `components/common/EmptyState.tsx`·`ErrorState.tsx`·`Skeleton.tsx`, `hooks/`(패턴 확립)
- **내용**: 목록/상세 공용 로딩·빈·에러 3종. 도메인 훅(`useCourseList` 등)의 캡슐화 컨벤션.
- **DoD**: Step 3에서 바로 소비 가능한 재사용 컴포넌트가 존재.
- **가이드**: §1-D, §4

---

## 메인 스파인

### Step 1 · GBC010 AI 코스 생성 ▶
- **의존**: 0-A, 0-B
- **파일**: `api/tourCourse.ts`(`createCourse`), `pages/Index.tsx`(`handleSearch`), `stores/plannerStore.ts`(`loadFromApi` 신설)
- **내용**: 검색폼 제출 → `POST /tour-course` → 응답을 `plannerStore`에 주입 → `/planner/`로 이동. `transport` 선택 UI 추가(현재 `'walk'` 하드코딩 제거). 비로그인 생성 시 반환된 `courseId`를 보관(Step 2에서 사용).
- **DoD**: 홈에서 조건 입력 후 검색 → 실제 생성된 코스가 플래너에 표시됨. `console.log`·`DEFAULT_COURSE` 부팅 로직 제거.
- **검증**: dev서버 → 홈에서 목적지/일정/인원/테마/이동수단 입력 → 검색 → 플래너에 생성 결과 렌더.
- **가이드**: §3 GBC010

### Step 2 · GBC016 코스 소유권 이전 (= "저장") ▶
- **의존**: Step 1 (생성된 `courseId` 필요)
- **파일**: `api/tourCourse.ts`(`assignCourse`), `pages/Planner/Planner.tsx`(`onSave`), `components/planner/LoginGateModal.tsx`
- **내용**: 게스트가 만든 `courseId` 보관(로그인 왕복 동안 `sessionStorage`) → 저장 클릭 → 로그인 게이트 → 로그인 성공 후 `PATCH .../assign` → 내 코스로 귀속.
- **DoD**: 비로그인 상태로 만든 코스를 "저장" 누르고 로그인하면 내 계정에 귀속된다. `onSave`의 toast-only 목업 제거.
- **검증**: 로그아웃 상태 코스 생성 → 저장 → 로그인 → (Step 3 완료 후) 목록에 뜨는지까지 확인.
- **가이드**: §3 GBC016

### Step 3 · GBC011 내 코스 목록 ▶
- **의존**: Step 2 (저장된 코스가 있어야 목록이 의미), 0-D
- **파일**: `api/tourCourse.ts`(`getMyCourses`), `pages/Collection/Collection.tsx`(스텁 → 전면 구현)
- **내용**: `GET /tour-course` → 코스 카드 리스트(제목·지역·기간·인원·테마·생성일). 빈/로딩/에러 상태. 카드 클릭 시 상세 이동(Step 4).
- **DoD**: 로그인 후 컬렉션에서 저장한 코스가 카드로 보이고, 빈/로딩/에러가 각각 처리됨.
- **검증**: 로그인 → `/collection/` → 목록 렌더 확인. 코스 0개일 때 EmptyState 확인.
- **가이드**: §3 GBC011

### Step 4 · GBC012 코스 상세 ▶
- **의존**: Step 3 (목록→상세 진입)
- **파일**: `api/tourCourse.ts`(`getCourse`), `routes/plannerRouter.tsx`(`:courseId` 세그먼트), `stores/plannerStore.ts`(상세 주입 매핑)
- **내용**: `GET /tour-course/{courseId}` → 플래너에 해당 코스 로드. 소유자 인증(401은 인터셉터 처리).
- **DoD**: 목록 카드 클릭 → `/planner/{courseId}`에서 그 코스의 일정이 정확히 렌더됨.
- **검증**: 목록 → 카드 클릭 → 상세 일정 표시. 새로고침해도 URL로 재진입됨.
- **가이드**: §3 GBC012

### Step 5 · GBC013 코스 삭제 ▶
- **의존**: Step 3(또는 4) — 삭제 버튼 붙일 목록/상세 UI
- **파일**: `api/tourCourse.ts`(`deleteCourse`), `Collection.tsx`/상세
- **내용**: 삭제 버튼 + 확인 다이얼로그 → `DELETE /tour-course/{courseId}` → 목록 갱신. ⚠️ 코스 **전체** 삭제(POI 단위 `removePoi`와 혼동 금지).
- **DoD**: 목록/상세에서 코스를 삭제하면 서버에서 지워지고 목록에서 사라짐.
- **검증**: 코스 삭제 → 목록 새로고침 후에도 없음.
- **가이드**: §3 GBC013

### Step 6 · GBC015 코스 제목 수정 ▶
- **의존**: Step 4
- **파일**: `api/tourCourse.ts`(`updateCourseTitle`), `Planner.tsx`/`CoursePanel.tsx`, `plannerStore.ts`(`setTitle`)
- **내용**: 제목 인라인 편집(클릭→input→onBlur) → `PATCH .../title`. 낙관적 업데이트 후 실패 시 롤백.
- **DoD**: 제목을 고치면 서버에 반영되고 새로고침 후에도 유지됨.
- **검증**: 제목 편집 → 새로고침 → 변경 유지.
- **가이드**: §3 GBC015

### Step 7 · GBC014 공유 + 공개뷰 ▶
- **의존**: Step 2(저장된 코스), Step 4(상세 렌더 재사용)
- **파일**: `api/tourCourse.ts`(`getPublicCourse`), `routes/shareRouter.tsx`(신설, **가드 밖**), `pages/Share/Share.tsx`(신설), `Planner.tsx`(`onShare`)
- **내용**: 공유 링크 생성 + 카카오 공유 SDK. 수신자는 비로그인으로 `GET /tour-course/{courseId}/view` 조회(`/share/:id`).
- **DoD**: 공유 버튼 → 링크 생성. 로그아웃 상태에서 그 링크로 코스가 보임(401 안 남).
- **검증**: 공유 → 시크릿 창(비로그인)에서 링크 열기 → 코스 표시.
- **가이드**: §3 GBC014

### Step 8 · GBC020 코스 수정 영속화 ⏸ 백엔드 대기
- **의존**: Step 4, **백엔드 완료**(스펙 `개발중`)
- **파일**: `api/tourCourse.ts`(`updateCourse`), `plannerStore.ts`(저장 트리거)
- **내용**: 편집 UI(dnd/추가/삭제/비용)는 이미 완성 → **저장 트리거만** 연결. `PATCH /tour-course/{courseId}`. payload 형태(전체 schedule 교체 vs diff)는 백엔드와 협의.
- **DoD**: 코스 편집 후 저장하면 서버에 반영되고 재진입 시 유지됨.
- **검증**: 편집 → 저장 → 상세 재진입 → 변경 유지.
- **가이드**: §3 GBC020 · **선행**: 백엔드 payload 스키마 확정.

---

## 🏝️ 섬 M · 마이페이지 (GBC006~009)

> **의존: Step 0-C(userId 보관)만.** 코스 파이프라인과 병렬 진행 가능. 내부는 M1→M2~M4 순.

### Step M1 · GBC006 회원정보 조회 ▶
- **파일**: `api/user.ts`(`getUser`), `routes/userRouter.tsx`(신설), `pages/User/MyPage.tsx`(신설), `HeaderLayout.tsx`(프로필 드롭다운 진입 메뉴)
- **내용**: `GET /user/{userId}` → 프로필 표시. `RequireAuth` 하위 배치.
- **DoD**: 헤더에서 마이페이지 진입 → 내 이메일/닉네임 표시.
- **검증**: 로그인 → 마이페이지 → 정보 렌더.
- **가이드**: §3 GBC006~009

### Step M2 · GBC007 닉네임 수정 ▶
- **의존**: M1 · **파일**: `api/user.ts`(`updateNickname`), MyPage
- **DoD**: 닉네임 인라인 편집 → `PATCH .../nickname` → 반영·유지. **검증**: 편집 후 새로고침 유지.

### Step M3 · GBC008 비밀번호 변경 ▶
- **의존**: M1 · **파일**: `api/user.ts`(`updatePassword`), MyPage/Settings
- **내용**: 현재/신규 비밀번호 폼(`Register.tsx`의 `validate` 재사용) → `PATCH .../password`.
- **DoD**: 현재 비번 틀리면 에러 toast, 맞으면 변경 성공. **검증**: 변경 후 새 비번으로 재로그인.

### Step M4 · GBC009 회원 탈퇴 ▶
- **의존**: M1 · **파일**: `api/user.ts`(`deleteUser`), MyPage
- **내용**: 탈퇴 버튼 + 확인 다이얼로그 → `DELETE /user/{userId}` → `authStore.clear()` + 홈 이동.
- **DoD**: 탈퇴 시 로그아웃되고 홈으로. **검증**: 탈퇴 → 재로그인 불가 확인.

---

## 🏝️ 섬 P · POI (GBC017~019)

> **의존: Step 0만.** 코스 파이프라인과 병렬 가능.

### Step P0 · 목→API 교체 준비 ▶ (선착수 가능)
- **파일**: `api/poi.ts`(골격), POI `cat`(sight/food/stay/culture) ↔ 스펙 `contentTypeId`(12/14/32/39) 매핑 테이블
- **내용**: UI는 목데이터로 두되, 교체 지점을 훅으로 캡슐화(`usePoiList`/`usePoi`)해 P2/P3에서 데이터 소스만 바꾸도록 준비.
- **DoD**: `ResultsPanel`/`PoiDrawer`가 훅 경유로 데이터를 받고(현재는 목), 매핑 테이블 존재.
- **가이드**: §3 GBC017/018

### Step P1 · GBC019 POI 좋아요 토글 ▶
- **파일**: `api/poi.ts`(`togglePoiLike`), `components/planner/POICard.tsx`·`PoiDrawer.tsx`(하트 버튼 신규)
- **내용**: 하트 UI + 낙관적 업데이트 → `POST /poi/{contentId}/like`. 로그인 필수(비로그인 시 게이트).
- **DoD**: 하트 클릭 시 즉시 토글, 실패 시 롤백.
- **⚠️ 의존 주의**: UI·함수는 지금 구현 가능하나, **실제 동작은 실 `contentId`가 있어야 완결**(현재 목 POI는 문자열 id). 실데이터는 P2/P3(백엔드) 이후 연결됨. → **UI/함수 먼저, 실동작 검증은 POI 실데이터 후**.
- **검증**: (P2 이후) 로그인 → POI 좋아요 → 재조회 시 상태 유지.
- **가이드**: §3 GBC019

### Step P2 · GBC017 큐레이션 POI 목록 ⏸ 백엔드 대기 (스펙 `보류`)
- **의존**: P0, **백엔드 완료** · **파일**: `api/poi.ts`(`getPois`), `ResultsPanel.tsx`
- **내용**: `GET /poi` 파라미터(`sigunguCode`/`peopleCount`/`theme`/`contentTypeId`)로 목록. `@/mocks` import 제거.
- **DoD**: 실제 지역/인원/테마로 필터된 POI가 렌더됨. **가이드**: §3 GBC017/018

### Step P3 · GBC018 POI 상세 통합 ⏸ 백엔드 대기 (스펙 `보류`)
- **의존**: P2, **백엔드 완료** · **파일**: `api/poi.ts`(`getPoi`), `PoiDrawer.tsx`
- **내용**: `GET /poi/{contentId}` → 상세 드로어. 카카오맵 데모(`PoiDrawer.tsx:140`)를 실연동으로 교체.
- **DoD**: 카드/마커 클릭 → 실제 상세 정보 표시. **가이드**: §3 GBC017/018

---

## 부록 A · 정리 (선택 — 메인 스파인과 무관, 아무 때나)

> API 연동과 독립. 여유 있을 때 또는 관련 화면 손볼 때 함께.

| 항목 | 파일 | 내용 |
|------|------|------|
| `/home` 더미 라우트 제거 | `routes/router.tsx`, `pages/Home.tsx` | 레이아웃 테스트용 더미(현황 §7). 메인과 중복 |
| `About` 콘텐츠 작성 | `pages/About.tsx` | 현재 `<>About</>` 스텁 |
| 문서 드리프트 최신화 | `FEATURES_FRONT.md`, `PRD_FRONT.md`, `CLAUDE.md` | "api/ 비어있음·authStore 미작성" 등 실코드와 불일치(현황 §8) |
| `RootLayout` 정리 판단 | `components/layout/RootLayout.tsx` | 라우터 미연결 사문화(CLAUDE.md는 삭제금지 명시) — 유지 여부 재확인 |

---

## 배정 요약 (한 줄)

1. **먼저 Step 0**(기반)을 한 덩어리로 끝낸다 → 코스·마이페이지·POI가 동시에 열린다.
2. **메인 담당**은 Step 1→2→3→4(핵심 루프)를 순서대로, 이어서 5→6→7.
3. **여력이 있으면** 섬 M(마이페이지)·섬 P(P0·P1)를 병렬로 당긴다.
4. **⏸ 배지**(Step 8, P2, P3)는 백엔드 완료를 기다린다. Step 0-A 계약 4건은 착수 시 확인 요청하되 막히면 스펙 가정으로 진행하고 추적표를 남긴다.
