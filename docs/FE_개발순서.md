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
 Step 8 GBC020 코스수정 영속화 ☑

부록 A · 정리(선택): /home 제거 · About 콘텐츠 · 문서 드리프트 최신화

🧩 그룹 F · 사용자 피드백 반영(2026-08-22 접수, S1~S8·P1·P2 후 즉시 착수 가능)
 F1 코스 시각·체류시간 편집      F2 이동수단 상태화 + 예산 교통비 편집
 F3 수단별 코스 간 이동시간      F4 POI 좋아요 토글 정합성(조사)
 F5 지도 코스 전용 표시(+컬렉션 진입 버그)   F6 지도 DnD(타당성 검토 선행)
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

### Step 8 · GBC020 코스 수정 영속화 ☑ FE 완료(백엔드 배포 후 E2E)
- **의존**: Step 4 · **선행 해소**: 백엔드 payload 스키마 확정(2026-08-15 상세 명세 수령)
- **파일**: `api/tourCourse.ts`(`updateCourse`), `utils/coursePayload.ts`(신설·페이로드 조립), `hooks/useCourseUpdate.ts`(신설), `plannerStore.ts`(`baseSchedule`·`dirty`·`markPristine`), `Planner.tsx`·`BudgetDashboard.tsx`(저장 버튼)
- **내용**: 편집 UI(dnd/추가/삭제/비용)는 이미 완성 → **저장 트리거 연결**. `PATCH /tour-course/{courseId}` 에 **`schedule` 전체 교체**. 원본 응답(`baseSchedule`)에서 날짜·시각·타입·체류시간을 복원하고, 새로 담은 장소는 카탈로그 Poi 로 채운다.
- **DoD**: 코스 편집 후 저장하면 서버에 반영되고 재진입 시 유지됨.
- **검증**: ✅ 라이브 E2E 완료(코스 39: 장소 제거·dnd 재정렬·비용 편집 → 변경 저장 200 → 재진입 유지). ⚠️ 단 **비용은 백엔드가 저장하지 않는다**(표시 전용 필드 무시).
- **가이드**: §3 GBC020 · **계약**: 추적표 `GBC020` 항목.

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

### Step P2 · GBC017 큐레이션 POI 목록 ☑ 완료 (백엔드 v0.5.1에서 구현됨)
- **의존**: P0 · **파일**: `api/poi.ts`(`getPois`), `hooks/usePoiList.ts`, `ResultsPanel.tsx`, `stores/plannerStore.ts`
- **내용**: `GET /poi` 파라미터는 실측상 `sigunguCode`(**단수·필수**)/`peopleCount`(필수)/`contentTypeId`(선택). 지역 복수 선택은 병렬 호출 후 합침. `@/mocks` POI 데이터 참조 제거.
- **DoD**: 실제 지역/인원으로 필터된 POI가 렌더됨 ✅. ⚠️ **`theme` 파라미터는 백엔드에 없다** → 테마 필터는 불가(DoD 문구에서 제외). **가이드**: §3 GBC017/018 · 계약 주의: [`FE_계약_추적표.md`](./FE_계약_추적표.md)

### Step P3 · GBC018 POI 상세 통합 ⏸ 백엔드 대기 (`GET /poi/{contentId}` 미구현, v0.5.2 기준)
- **의존**: P2(완료), **백엔드 완료** · **파일**: `api/poi.ts`(`getPoi`), `PoiDrawer.tsx`
- **내용**: `GET /poi/{contentId}` → 상세 드로어. 카카오맵 데모(`PoiDrawer.tsx:140`)를 실연동으로 교체.
- **DoD**: 카드/마커 클릭 → 실제 상세 정보 표시. **가이드**: §3 GBC017/018

---

## 🧩 그룹 F · 사용자 피드백 반영 (2026-08-22 접수)

> **의존: 메인 스파인 S1~S8 + 섬 P(P1·P2) 완료** — 모두 ☑ 이므로 **즉시 착수 가능**.
> 접수 원문(사용자 실사용 피드백):
> - 플래너 › 내 코스 — ① 코스 클릭 시 상세 조회 **(OK = 이미 완료)** ② 코스별 시간 변경(+소요시간) ③ 이동수단에 따른 코스별 이동시간 표시
> - 플래너 › POI 리스트 — 좋아요가 **추가만** 되고 있음(프론트/백 확인 필요)
> - 플래너 › POI 지도 — 지도에서 드래그&드롭 / '내 코스만 보기' 토글
> - 플래너 › 예산 — 교통비 수정(도보·대중교통·자차 드롭다운 + 금액 커스텀), 수단 변경분이 저장 시 코스에 반영
> - 컬렉션 — 진입 직후 '~시로 둘러보기'를 누르기 전엔 지도가 열리지 않음. 코스만 따로, 지도를 바로 눌러도 보이게(원인 파악)
>
> **수용 범위**: ①은 S4(GBC012)로 충족되어 신규 Task 없음. 나머지는 F1~F6. 지도 DnD(F6)는 카카오맵 제약이 있어 **타당성 검토 → 승인된 안만 구현**으로 둔다.
> **권장 순서**: F1 → F2 → F3 → F4 → F5 → F6 (F3 은 F2 가 만드는 `transport` 상태를, F6 은 F5 가 만드는 지도 렌더 경로를 쓴다).

### Step F1 · 코스 시각·체류시간 편집 ▶
- **의존**: S8(GBC020 저장 경로)
- **파일**: `components/planner/CourseItem.tsx`, `stores/plannerStore.ts`, `utils/coursePayload.ts`, `types/planner.ts`
- **내용**: 코스 카드의 시간 표시(현재 `poi.visitTime || poi.hours || '시간 미정'` 읽기 전용)를 **인라인 편집**으로 바꾼다. 방문 시각은 `HH:mm`(`<input type="time">`), 체류시간은 분 단위(30/60/90/120 프리셋 또는 숫자 입력). 편집값은 `plannerStore` 에 `placeTimes: Record<poiId, { time?: string; durationMinutes?: number }>` 로 보관하고 `setPlaceTime`/`setPlaceDuration` 액션에서 `dirty = true`(같은 값 재입력은 no-op — `editCost` 와 같은 규약). `utils/coursePayload.buildSchedulePayload` 는 **사용자 지정 시각을 원본 슬롯 배분보다 우선**하고, 지정이 없는 장소만 기존 규칙(그 날 원본 시각 슬롯 순번 배분 → 모자라면 `직전 시각 + 체류시간 + TRAVEL_BUFFER`)을 유지한다. 체류시간도 지정값 → `meta.durationMinutes` → 타입 기본값 순으로 고른다.
- **DoD**: 코스 항목의 시각·소요시간을 바꾸면 즉시 화면에 반영되고 저장 버튼이 '변경 저장'으로 활성 → 저장 후 URL 재진입 시 값이 유지된다. 같은 Day 안에서 시각이 역전되면 toast 로 알린다(자동 정렬은 하지 않는다 — 사용자가 의도한 순서를 덮어쓰지 않기 위해).
- **검증**: `/planner/:courseId` → Day1 두 번째 장소 시각 `11:00 → 13:30`, 소요 `90 → 120` → '변경 저장' → `PATCH /tour-course/{id}` 200 → 새로고침 후 값 유지. 콘솔 에러 0.
- **⚠️ 계약**: 서버는 현재 `durationMinutes` 를 **null 로 내려준다**(실측). S8 에서 `cost`·`contentName` 등이 표시 전용으로 무시된 선례가 있으므로, 저장→재조회 왕복으로 **실제 영속 여부를 반드시 확인**하고 무시된다면 백엔드 요청 대상으로 [`FE_계약_추적표.md`](./FE_계약_추적표.md) 에 등록한다(FE 는 로컬 편집까지 완료로 본다).

### Step F2 · 이동수단 상태화 + 예산 교통비 편집 ▶
- **의존**: S8
- **파일**: `stores/plannerStore.ts`, `components/planner/BudgetDashboard.tsx`, `utils/budget.ts`, `hooks/useCourseUpdate.ts`, `api/tourCourse.ts`
- **내용**: (1) **상태화** — 현재 `plannerStore.search` 에 `transport` 가 없고 `loadDetail` 도 응답의 `transport` 를 버린다. `transport: Transport` 를 보관하고 `loadFromApi`(홈 검색 값)·`loadDetail`(상세 응답 값)에서 주입 + `setTransport`(변경 시 `dirty = true`). (2) **예산 UI** — `BudgetDashboard` 교통 행을 `도보 / 대중교통 / 자차` `<select>`(라벨은 `utils/courseFormat.TRANSPORT_LABEL` 재사용) + 금액 직접 입력·'되돌리기'로 바꾼다. (3) **계산** — `utils/budget.computeBudget` 의 하드코딩 `8500 × days × ceil(n/4)` 을 수단별 계수로 분기하고(도보 0원, 대중교통·자차 각각 단가), 교통비 override(`transportOverride`)가 있으면 그 값을 쓴다. 지금 화면에 있는 "교통비는 평균 객단가 기반 추정치예요" 문구도 수단 기준으로 갱신.
- **DoD**: 수단을 바꾸면 교통비·총액이 즉시 재계산되고, 금액을 직접 고치면 그 값이 유지된다(되돌리기로 추정치 복귀). 저장 후 재진입 시 같은 수단이 표시된다.
- **⚠️ 백엔드 확인 필요**: GBC020 `PATCH /tour-course/{courseId}` 의 바디는 실측·명세상 **`{schedule}` 뿐**이라 `transport`(코스 헤더 필드)와 교통비를 보낼 자리가 없다. 착수 시 ①바디에 `transport` 를 받아줄 수 있는지 ②교통비를 저장할 필드가 있는지 확인한다. 불가하면 **FE 로컬 반영(계산·표시)까지만 완료로 보고** 영속 부분은 보드에서 ⏸ + 계약 추적표 등록. 사용자 요구("교통 바꿀 때마다 코스 트랜스포트 수정해서 저장 시 제대로 반영")의 절반은 백엔드 몫이라는 뜻이므로 결론을 명시적으로 남긴다.
- **가이드**: §3 GBC020 · 계약: [`FE_계약_추적표.md`](./FE_계약_추적표.md) #transport

### Step F3 · 이동수단별 코스 간 이동시간 표시 ▶
- **의존**: F2(수단 상태), P2(좌표 — 큐레이션 응답의 `mapx`/`mapy`)
- **파일**: `utils/travelTime.ts`(신설), `components/planner/CoursePanel.tsx`
- **내용**: 두 장소의 `lat`/`lng` 로 haversine 직선거리를 구하고 수단별 평균 속도(도보 4km/h, 대중교통 20km/h, 자차 40km/h)로 분을 환산한다(하한 5분, 5분 단위 라운딩, 도시 내 우회 보정 계수 1.3 정도). 활성 Day 의 코스 항목 **사이 커넥터**에 `🚶 12분` / `🚌 20분` / `🚗 15분` 형태로 표시한다. 좌표가 없는 장소(코스 응답만 있고 카탈로그 미조회)는 표기를 생략한다 — "0분"으로 오해되게 두지 않는다.
- **DoD**: 활성 Day 항목 사이에 이동시간이 보이고, 예산 탭에서 수단을 바꾸면(F2) 즉시 갱신된다. 좌표 미확보 구간은 표기 없음.
- **⚠️ 범위**: 카카오 길찾기/내비 API 같은 **실 경로 API 는 범위 외**(키·쿼터·유료 이슈). 화면에 "직선거리 기반 추정"임을 한 줄로 명시한다.

### Step F4 · POI 좋아요 토글 정합성 조사·수정 ▶
- **의존**: P1(구현 완료), P2
- **파일**: `hooks/usePoiLike.ts`, `stores/poiLikeStore.ts`, `api/poi.ts`(필요 시)
- **증상**: 사용자 보고 — "좋아요가 **추가만** 되고 있음". FE 는 이미 낙관적 토글 후 응답 `liked` 로 확정하는 구조라 코드만 보면 토글이 맞다 → **원인 후보 2개**:
  - (a) 백엔드가 insert-only(이미 좋아요면 삭제하지 않고 `liked: true` 를 그대로 반환) → 화면이 계속 '찜' 상태.
  - (b) **초기 찜 상태 복원 경로가 없다** — `poiLikeStore` 는 메모리 전용이고 "내 찜 목록" 엔드포인트가 `openapi.yaml` 에 없다(`/poi`, `/poi/{contentId}`, `/poi/{contentId}/like` 뿐). 새로고침하면 전부 미찜으로 보이고, 누르면 다시 '추가'만 되는 것처럼 보인다.
- **내용**: 같은 POI 로 토글을 2회 호출해 응답(`liked`, `likes`)을 실측하고 (a)/(b) 중 무엇인지 확정한다. FE 결함이면 수정, 백엔드 결함이면 계약 추적표에 등록하고 UI 는 **서버 응답 기준**으로만 표시한다(응답이 항상 true 면 하트를 임의로 끄지 않는다). (b) 는 조회 API 신설(예: `GET /poi/likes`)이 필요하므로 백엔드 요청 항목으로 남긴다 — `localStorage` 로 찜 상태를 흉내내는 건 서버 진실과 어긋나므로 채택하지 않는다.
- **DoD**: 원인이 문서화되고(보드 로그 + 계약 추적표), FE 몫이 있으면 수정 완료. 최소한 "두 번째 클릭에서 무엇이 오는지"가 실측으로 기록된다.
- **⚠️ 검증 제약**: 좋아요는 로그인 필수인데 **조직 지침상 에이전트는 비밀번호를 입력할 수 없다** → 브라우저 실측은 사용자가 로그인한 세션에서 대행하거나, 사용자가 네트워크 응답을 공유해 주는 방식으로 진행한다.

### Step F5 · 지도 코스 전용 표시 + 컬렉션 진입 시 지도 미표시 수정 ▶
- **의존**: S4, P2
- **파일**: `components/planner/ResultsPanel.tsx`, `components/planner/MapView.tsx`, (필요 시) `stores/plannerStore.ts`
- **원인(코드 확인 완료)**: `plannerStore.loadDetail` 은 상세 응답에 시군구 코드가 없어 `search.dests` 를 **빈 배열**로 둔다. `ResultsPanel` 은 `if (!search.dests.length)` 에서 "둘러볼 지역을 선택해 주세요" EmptyState 로 **early return** 하므로, 헤더의 리스트/지도 토글을 눌러도 지도 본문(`MapView`)에 도달하지 못한다. '경주시로 둘러보기'(`FALLBACK_DEST='130'`)를 누르면 `dests` 가 채워져 그때서야 지도가 열린다 — 사용자가 본 증상이 정확히 이것이다.
- **내용**: (1) `viewMode === 'map'` 이면 `dests` 가 비어 있어도 지도를 렌더한다(코스 마커·경로만 = 이미 `MapView` 가 활성 Day 코스를 그린다). 지역 미선택 안내는 리스트 모드에만 남긴다. (2) 지도 헤더에 **'내 코스만 보기'** 토글을 추가하고 `MapView` 에 `courseOnly` prop 을 넘겨 결과 목록 마커를 제외한다(기본값: `dests` 가 비어 있으면 on). (3) POI 데이터가 없어도 지도가 비지 않게 코스가 0곳일 때의 안내를 지도 위 오버레이로 둔다.
- **DoD**: 컬렉션 → 코스 카드 클릭 → 플래너에서 '지도' 클릭 시 **즉시** 코스 경로 지도가 보인다('둘러보기' 선행 클릭 불필요). '내 코스만 보기' 토글로 POI 마커가 on/off 되고, 코스 마커는 순번 배지·경로선을 유지한다.
- **검증**: `/planner/:courseId` 직접 진입 → 지도 → 코스 마커/경로 확인 → 토글 off 시 POI 마커 등장(지역 선택 후) → 리스트 모드는 기존 안내 유지. 모바일 폭에서도 확인.

### Step F6 · 지도에서 드래그&드롭 코스 편집 ▶ (타당성 검토 선행)
- **의존**: F5
- **파일**: `components/planner/parts/KakaoMap.tsx`, `components/planner/MapView.tsx`, `components/planner/PlannerDndProvider.tsx`, `components/planner/dnd.ts`
- **내용**: 카카오맵 마커는 지도 위 커스텀 오버레이라 **지도 자체의 pan/zoom 과 포인터 이벤트가 겹친다** → dnd-kit 센서와 충돌(드래그하면 지도가 따라 움직이거나 드래그가 시작되지 않음). 그래서 **1단계는 타당성 검토**로 두고 선택지를 비교한 뒤 승인된 안만 구현한다:
  - (a) **마커 클릭 → '코스에 추가/제거'** — 가장 안전. DnD 감각은 없지만 지도에서 코스 편집이라는 목적은 달성.
  - (b) **롱프레스 후 코스 패널로 드래그** — dnd-kit 커스텀 센서 + 드래그 중 `map.setDraggable(false)`. 구현 난도·모바일 리스크 높음.
  - (c) **순번 배지 드래그로 순서만 교체** — 지도 안에서만 재정렬(`reorder`), 추가/삭제는 제외.
- **DoD**: 선택지 비교와 결정 근거가 보드에 기록되고, 채택안이 동작한다 — 편집 결과가 `plannerStore`(`addPoi`/`removePoi`/`reorder`)에 반영되고 `dirty` → '변경 저장'으로 영속. **모바일 터치에서 지도 pan 과 충돌하지 않는다.**
- **검증**: 데스크톱·모바일 폭 각각에서 지도 편집 → 코스 패널 즉시 갱신 → 저장 → 재진입 유지.

- **결정(2026-08-22, 사용자 승인)**: **(a) 마커 클릭 → 코스 추가/제거** 채택. (b)·(c) 기각.
  - (b) 기각 근거: `Planner.tsx` 모바일 레이아웃은 **탭 전환식**이라 지도와 코스 패널이 동시에 보이지 않고, `ResultsPanel mobile` 은 `PlannerDndProvider` 밖에 있다 → 지도→코스 드래그가 모바일에서 성립하지 않아 이 Step 의 DoD("모바일 터치에서 충돌하지 않는다")를 만족할 수 없다. 데스크톱 전용으로 두면 UX 가 이원화된다.
  - (c) 기각 근거: 저줌에서 마커가 겹쳐 드롭 타깃이 모호하고, `hasLatLng` 로 **좌표 없는 코스 장소는 마커 자체가 없어** 지도에서 본 순서가 실제 코스 순서와 다르다 → 재정렬 결과가 예측 불가(그대로 저장되면 위험).
  - 공통 제약: 카카오맵 마커는 `CustomOverlay` content 로 **React 밖에서 만든 DOM** 이라 dnd-kit 을 붙이려면 오버레이마다 `createPortal` 이 필요하고(결과 실측 411곳), 지도 pan 과 포인터가 경쟁해 `setDraggable(false)` 토글이 필수다.
  - 채택안 구현: 마커 배지 오른쪽 아래에 22px 토글(`absolute` 로 겹쳐 오버레이 앵커 유지) — 활성 Day 에 있으면 `−`(제거), 없으면 `+`(추가). `MapView.toggleInCourse` → `addPoi`/`removePoi` → `dirty` → '변경 저장'. 카카오맵·폴백 지도가 같은 규약(`markerStyle.markerToggleClass`)을 쓴다. 마커 본체 클릭은 기존대로 상세 드로어.

### Step F7 · 지도 마커 겹침으로 담기/빼기 토글이 도달 불가 ▶ (F6 검증에서 발견)
- **의존**: F6
- **파일**: `components/planner/parts/KakaoMap.tsx`, `components/planner/parts/markerStyle.ts`, `components/planner/parts/PlaceholderMap.tsx`, `components/planner/MapView.tsx`
- **증상(2026-08-22 모바일 폭 390px 실측)**: 지도가 좁아 마커가 겹치면 **가려진 마커의 토글이 자기 중심점에서도 눌리지 않는다.** `elementFromPoint(토글 중심)` 이 **옆 마커 본체**를 되돌려 주고, 그 자리를 누르면 담기 대신 **엉뚱한 POI 의 상세 드로어가 열린다**(재현됨). 실측 표본은 코스 3곳 + POI 4곳 = 토글 6개 중 **1개**(대릉원 — 교리김밥과 CSS 9px 간격, 실거리 약 0.7km)였다.
- **원인**: 마커는 카카오 `CustomOverlay` 로 각각 독립된 DOM 이고, 겹칠 때 **어느 쪽을 위로 올릴지에 대한 규칙이 없다**(z-index 미지정 → DOM 순서 = 우연). 클러스터링도 없어 저줌·좁은 폭에서 겹침이 그대로 노출된다. F6 의 토글은 배지 오른쪽 아래 22px 로 **배지 바깥**에 걸치므로 겹침에 특히 취약하다.
- **후보안**(하나를 고르거나 조합):
  - ㉮ **z-order 규칙** — 활성 Day 의 코스 마커 > 최근 조작 마커 > POI 마커 순으로 `zIndex` 를 주고, 포인터가 올라간 마커를 최상단으로. 가장 좁은 수정이지만 **완전히 겹친 경우**는 여전히 아래쪽에 손이 닿지 않는다.
  - ㉯ **클러스터링** — 저줌에서 인접 마커를 묶어 개수 배지로 보여 주고 확대하면 풀린다. 겹침을 근본에서 없애지만 코스 순번 배지·경로선 표현과의 조화가 과제.
  - ㉰ **토글을 선택된 마커에만 노출** — 마커 본체를 한 번 누르면 그 마커만 토글을 띄운다. 겹침에 면역이지만 담기가 2단 인터랙션으로 돌아가 F6 의 "1클릭" 이점을 잃는다.
- **DoD**: 마커가 겹친 상황에서도 각 마커의 담기/빼기 토글을 누를 수 있고, 오조작으로 다른 POI 의 상세 드로어가 열리지 않는다. **모바일 폭(390px) 실측 포함.**
- **검증**: 서로 1km 이내인 POI 를 포함한 지역에서 지도를 열어 토글 전수를 `elementFromPoint(토글 중심)` 로 판정 — 모든 토글이 자기 자신을 되돌려 줘야 한다. 데스크톱·모바일 폭 각각.

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
5. **그룹 F**(사용자 피드백)는 S1~S8·P1·P2 가 끝난 뒤 F1→F2→F3→F4→F5→F6 순으로 진행한다. F1·F2 는 GBC020 영속 범위(백엔드 `{schedule}` 바디) 확인이, F4 는 로그인 세션 실측(사용자 대행)이 선행 조건이다.
