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
 F7 마커 겹침 도달 불가          F8 지도 크롬 겹침 · 밀집 코스 마커
 F9 liked/totalLiked/stars 연동

📱 그룹 R · 모바일 UI/UX 개선(2026-08-29 점검, 백엔드·로그인 불필요 — 지금 착수 가능)
 R1 코스 카드 touch-none 스크롤 불가 🔴   R2 데스크톱·모바일 동시 마운트 🔴
 R3 탭 전환 시 탐색 상태 전멸 🔴          R4 320px 가로 스크롤 🟠
 R5 오버레이 스크롤 체이닝·안전영역 🟠    R6 지도가 페이지 스크롤 삼킴 🟠
 R7 헤더 모바일 메뉴 z-index 🟠           R8 터치 타깃 44px 미만 🟠
 R9 토스트 위치 🟡  R10 홈 검색바 시각 단서 🟡  R11 폰트·hover·메타 🟡
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
- **결정(2026-08-22, 사용자 승인)**: **㉯ POI 클러스터링 + 코스 마커 예외**를 채택. ㉮ z-order 단독안은 기각 — 이미 `zIndexOf`(활성 30/코스 20/일반 10)가 있고 문제의 두 마커는 둘 다 일반 POI(z 10) 라 DOM 순서로 갈리며, 기하상 **가려진 쪽은 배지 중심까지 덮여** 순서를 어떻게 바꿔도 손이 닿지 않는다. ㉰(선택 마커에만 토글)는 F6 의 1클릭 이점을 잃어 보류.
- **구현(2026-08-22, `◐`)**: `components/planner/mapCluster.ts` 신설 — `clusterMarkers`(코스·활성 마커 제외, 40px 안쪽 POI 를 접고 그룹 중심끼리 겹치면 반복 병합, 배율 무효 시 전부 개별) + `spreadOverlaps`(잔여 겹침을 **빈 자리 찾기**로 해소, 위에 그려지는 항목은 제자리, 캡 `minSep×1.2`, 자리 없으면 이동 포기). `KakaoMap` 은 배율을 `getBounds()`+컨테이너 크기로 **`idle` 에서만** 읽고(애니메이션 중간값 회피), 그룹 배지 클릭으로 `setLevel(-2, animate:false)` 확대, **경로선에도 같은 변위**를 적용한다.
- **검증 완료(2026-08-29)**: 사용자가 띄운 실 백엔드(경주 316곳)로 **그룹을 펼친 뒤 상태까지** 실측해 DoD 를 충족했다. 390px iframe 하니스에서 코스를 3회 새로 만들고(#70·#74·#75) **초기 뷰 → 가장 큰 그룹 클릭 → 그룹 소진**까지 매 단계 지도 컨테이너 안 전 항목의 배지·토글 중심에서 `elementFromPoint` 를 찍었다 — **14/14 → 19/19 → 20/20 → 10/10**, 재현 **16/16 → 21/21 → 22/22 → 13/13**, 가려짐 0. 지난 세션의 "펼친 뒤 마커가 빈다"는 관찰은 **하니스 탓으로 확정**(DoD 흐름 밖인 `축소` 연타 상태에서만 재현 — 그때 카카오 오버레이 레이어가 `display:none`). 보강으로 `mapCluster` 를 node 로 돌려 **실제 DOM 기하·z 규칙을 옮긴 도달 가능성 시뮬레이터**를 만들고 앱의 줌 흐름을 6개 데이터셋 × 5시드 × 모바일·데스크톱 **392상태** 판정 — 현실형 데이터셋 전 단계 통과. 부수 확인: 이 기하에서 **점 간격 40px 이면 도달 가능이 보장**된다(최악 조합 36.8px).
- **잔여**: 검증 중 발견한 도달 불가 2건은 원인이 달라 **F8** 로 분리했다(지도 컨트롤 겹침 · 밀집 코스 마커).

---
### Step F8 · 남은 도달 불가 2건 — 지도 컨트롤 겹침 · 밀집 코스 마커 ▶ (F7 검증에서 발견)
- **의존**: F7
- **파일**: `components/planner/parts/KakaoMap.tsx`, `components/planner/mapCluster.ts`, `components/planner/parts/PlaceholderMap.tsx`
- **증상 ㉠ — 지도 컨트롤이 마커를 덮는다**(2026-08-29 데스크톱 1280px 실측): 확대·축소·현위치 버튼 묶음은 `absolute bottom-3 right-3 z-[3]` 의 **32×108px** 이고, 카카오 `CustomOverlay` 는 그보다 아래 레이어다. 지도 오른쪽 아래 구석에 놓인 마커는 배지·토글 중심이 컨트롤에 덮여 **담기 대신 지도가 확대된다**. 재현: `경주 장항리 서 오층석탑` 의 배지와 토글 **둘 다** `elementFromPoint` 가 `확대` 버튼을 되돌려 줬다. 폭과 무관한 구조적 원인이라 모바일에서도 같은 자리면 재현된다.
- **증상 ㉡ — 밀집 코스 마커**: 코스 마커는 접지 않으므로(F5 DoD) 한 Day 의 코스가 **5곳 이상 반경 300m 안**에 몰리면 `spreadOverlaps` 의 고리 탐색(반지름 `minSep`~`minSep×1.2`, 12슬롯 = 중심 포함 약 7자리)이 포화돼 빈 자리를 못 찾고 **겹침을 남긴다**(설계상 "위치 왜곡 < 겹침"). 시뮬레이터가 잰 경계: 코스 **5~6곳**이면 **그룹 배지**가 가려져 펼칠 수 없고, **7곳 이상**이면 **코스 마커의 토글 자체**가 가려진다. 라이브 3회(경주 실코스 Day1 5~8곳)에서는 코스가 시내 전역에 흩어져 재현되지 않았다 — 황리단길처럼 도보 반경에 몰린 하루 일정에서 드러나는 조건이다.
- **후보안**:
  - ㉠ 컨트롤 rect 를 `getBounds()`+컨테이너 크기로 좌표로 환산해 **금지 구역(가상 항목)** 으로 `spreadOverlaps` 에 넣는다(겹침 해소 경로를 그대로 재사용). / 컨트롤을 지도 밖(패널 헤더)으로 옮긴다(가장 단순하지만 지도 UI 관례에서 벗어난다).
  - ㉡ 고리를 필요한 만큼 넓히되 상한을 둔다(도달 가능성↑, 위치 왜곡↑ — 지금 설계 결정을 뒤집는 것이라 사용자 판단 필요). / 코스 마커도 **접되 순번을 유지하는 전용 그룹 배지**(예 `1·2·3`)로 보여 준다.
- **DoD**: 위 두 상황에서 각 마커의 담기/빼기 토글이 눌리고 오조작이 없다 — 모바일·데스크톱 폭 라이브 실측 + 결정적 시뮬레이터에서 해당 데이터셋 통과.
- **검증**: ㉠ 마커를 컨트롤 자리로 오게 만든 뒤(지도 pan) 배지·토글 중심 `elementFromPoint` 가 자기 자신인지. ㉡ 코스 5·7·10곳을 반경 60~300m 에 몰아 넣고 초기 뷰부터 전 확대 단계 판정.
- **㉠ 구현(2026-08-29, `◐`)**: `mapCluster` 에 `ForbiddenBox`·`anchorKeepOut(rect)`(크롬 사각형 → **클릭 대상 중심 기준**으로 부풀린 앵커 금지 영역: `left−9 · right · top+5 · bottom+16`) 를 더하고 `spreadOverlaps(items, scale, forbidden)` 의 후보 판정에 `canPlace = isFree && !isBlocked` 를 끼웠다 — 겹침 회피와 **같은 탐색 경로**라 규칙이 하나로 유지된다. 항목이 하나여도 금지 구역이 있으면 비킨다(조기 반환 조건 수정). `KakaoMap` 은 `readView` 로 `getBounds()` 한 번에 배율+금지 구역을 함께 읽고 `idle` 마다 갱신한다(금지 구역은 **이동만으로도 바뀐다**). `chromeRects` 는 **우리 컨트롤 + SDK 가 컨테이너에 직접 붙이는 축척·로고**를 함께 잡는다 — 검증 중 축척(좌하단 135×19)도 마커를 가리는 것이 실측으로 드러났다.
- **㉠ 검증 결과**: node 14케이스 통과 · 라이브 재현 형상에서 금지 구역 **1218자리 전수 해소** · 앱 줌 흐름 82상태에서 **컨트롤 가려짐 14 → 0**, **그 외 겹침 108 → 108**(㉡ 을 악화시키지 않음) · 라이브(실 백엔드 경주)에서 축척에 가려졌던 `경주 재매정` 이 **43px 비켜나** 도달 가능으로 전환.
- **남은 것**: ㉡ 미착수(“위치 왜곡 < 겹침” 설계 결정을 뒤집을지 판단 필요) · 합성 드래그로 만든 상태에서 컨트롤 겹침 1건이 관찰돼 **실제 제스처로 재확인** 필요 · 폴백 지도(`PlaceholderMap`)는 겹침 해소 경로 자체가 없어 이번 수정 범위 밖이다(SDK 실패 시에만 뜨는 화면).

---
### Step F9 · 찜 상태(`liked`)·좋아요 수(`totalLiked`)·별점(`stars`) 연동 ☑ 완료 (2026-08-29 사용자 요청 · 로그인 E2E 통과)
- **의존**: P1(GBC019 토글)·P2(GBC017 목록)·P3(GBC018 상세) — 전부 완료 상태에서 착수.
- **파일**: `api/poi.ts`, `stores/poiLikeStore.ts`, `stores/authStore.ts`, `hooks/usePoiList.ts`, `hooks/usePoi.ts`, `hooks/usePoiLike.ts`, `utils/poiDetail.ts`, `types/planner.ts`, `components/planner/LikeButton.tsx`, `components/planner/parts/Stars.tsx`, `components/planner/PoiDrawer.tsx`
- **접수 원문**: ①"GBC019 - 프론트 좋아요 수정 시, 반환값 contentId 정보에 반영 (좋아요, 좋아요 개수)" ②"GBC017, GBC018 liked, totalLiked, stars(별점) 데이터 필드 프론트 구현"
- **백엔드 계약(소스 실측 `a856895`/0.6.8)**: 목록 `PoiCurationItemDto` = `liked`·`stars`(총개수 **없음**) · 상세 `PoiDetailResponseDto` = `liked`·`totalLiked`·`stars` · 토글 `PoiLikeResponseDto` = `{liked, totalLiked}`(**0.6.5 에서 `likes` 개명**). 조회 2종은 `permitAll` → 비로그인·탈퇴는 `liked:false`, 평점 행 없으면 `stars:null`·`totalLiked:0`. 추적표 #9.
- **착수 시 발견한 실결함**: FE 가 개명을 따라가지 못해 `usePoiLike` 가 없는 필드(`res.likes`)를 읽고 있었다 → 토글 후 **좋아요 수가 `undefined`** 로 유실.
- **구현**: ①타입 3종 실측 1:1 갱신. ②`poiLikeStore` = `{liked, totalLiked}` 2맵 + `hydrate()` — **이미 아는 값은 덮지 않는다**(필드 단위). 목록·상세 응답은 오래 머무는 캐시라, 덮어쓰면 방금 토글한 결과가 낡은 값으로 되돌아간다. ③`usePoiList`·`usePoi` 가 응답을 hydrate 하고 **세션 키를 조회 dedup 키·상세 캐시 키에 포함**(`authSessionKey()` 를 `authStore` 로 승격) — `liked` 는 사용자별 값이라 로그인 전후 응답을 공유·재사용하면 하트가 거짓이 되고, 세션이 바뀌면 자동 재조회된다. ④`usePoiLike` 는 토글 응답을 그대로 확정(재조회 없음 — 백엔드가 필드명을 통일한 이유). ⑤`stars` → `Poi.rating`(`withDetail` 은 빈 칸만 채움), **`Stars` 는 0이면 렌더하지 않는다**(실 POI 카드의 `★ 0` 제거). ⑥`LikeButton showCount` 는 **드로어에서만** — 목록 응답에 총개수가 없어 카드에 붙이면 값이 들쭉날쭉해진다.
- **DoD**: 로그인 상태에서 ⓐ목록·상세 진입 시 이미 찜한 POI 의 하트가 채워져 보임 ⓑ토글 즉시 하트·개수 갱신 ⓒ드로어 재오픈(캐시)에도 유지 ⓓ새로고침 후 목록·상세 조회로 서버 상태 복구 ⓔ별점 있는 POI 만 `★` 표시.
- **검증**: `npm run lint`·`npm run build` 통과 + node 19케이스(별점 병합 7 · 스토어 12 — hydrate 우선순위·토글 확정·낙관/롤백·참조 안정성·세션 전환). ✅ **라이브 실측(실 백엔드 :8080 · dev 5173, 비로그인 범위)**: `GET /poi?sigunguCode=130` 316곳 응답에 `liked`·`stars` 실림(`stars` 는 JSON number, 316곳 중 108곳만 값 있음)·`GET /poi/128677` 에 `liked`·`totalLiked`·`stars` 실림 → **결과 카드의 별점이 API `stars` 와 전건 일치**(별점 없는 POI 는 `★` 자체를 그리지 않음, `★ 0` 0건), 드로어는 `♡ 0`(총개수, `aria-label="찜하기 (좋아요 0개)"`)와 `★ 4.0` 렌더, 목록 hydrate 로 `poiLikeStore.liked` 316키 주입, 비로그인 하트 클릭 → **`찜하려면 로그인` 게이트 · `/like` 요청 0건**, 콘솔 에러 0. ✅ **로그인 E2E 완료(2026-08-29, 사용자가 로그인 대행 · 실 백엔드 :8080 · dev 5173)**: ①로그인 목록 조회가 `liked` 316키 hydrate ②드로어 하트 클릭 → `POST /poi/128677/like` **200 `{liked:true,totalLiked:1}`** → 하트 채워짐·`찜 취소 (좋아요 1개)`·**결과 카드 하트도 동시 반영**(스토어 공유) ③**새로고침 후에도 하트 유지**(재조회 `liked:true` → 추적표 #9 의 목표 달성) ④드로어를 닫았다 다시 열면 **네트워크 요청 0건**(캐시 히트)이고 캐시에 든 낡은 상세(`liked:false`)가 **토글 결과를 되돌리지 않음**(hydrate 비덮어쓰기 규칙 실동작) ⑤해제 → **200 `{liked:false,totalLiked:0}`** → 카드·드로어 동시 해제 ⑥세션 전환: 로그아웃 시 하트 제거(게스트 재조회 `liked:false`) → 재로그인 시 **자동 재조회로 하트 복구** ⑦콘솔 에러 0. 검증 후 서버 상태는 원래대로 되돌려 뒀다(`totalLiked:0`).

---
## 📱 그룹 R · 모바일 UI/UX 개선 (2026-08-29 점검)

> **의존: 없음 — 백엔드도 로그인도 필요 없다.** 전부 FE 단독으로 착수·검증 가능하다.
> **접수 경위**: 사용자 요청("데스크탑/모바일 2가지 반응형으로 구현되어 있는데 모바일 측면에서 UI/UX 개선할 부분이 있을까?")으로 모바일 관점 전수 점검을 수행했다.
> **점검 방법**: 레이아웃·플래너·오버레이 컴포넌트 정독 + 리스크 패턴 grep(`touch-none` · `vh`/`dvh` · `env(safe-area-*)` · 브레이크포인트 사용 분포 `lg:40 md:15 sm:18 xl:1`) + 마운트 구조 추적.
> **결론**: 반응형 자체는 mobile-first 로 견고하다(2026-08-08 반응형 전면 점검의 판단은 지금도 유효). 다만 **그 점검 이후 들어온 기능**(지도·DnD·바텀시트·모바일 탭)에서 **모바일에서만 발생하는 결함 15건**이 생겼다. 심각도 3단계로 나눠 11개 Task 로 분해한다.
> **심각도**: 🔴 심각 = 실제 조작이 막히거나 상태가 유실됨 · 🟠 중요 = 자주 부딪힘 · 🟡 개선 = 폴리시.
> **권장 순서**: R1 → R2 → R3 → R4 → R5 → R6 → R7 → R8 → R9 → R10 → R11 (심각도 순. R3 은 R2 가 도입하는 `useMediaQuery` 위에, R6 은 R3 이 정리한 탭 렌더 구조 위에 얹힌다).
> **공통 검증 하니스**: 브라우저 창 리사이즈가 이 환경에서 무효이므로(`innerWidth` 1440 고정), F5·F7 에서 확립한 **동일 출처 iframe 390×731** 하니스로 모바일 폭을 실측한다.

### Step R1 · 코스 카드 `touch-none` 으로 모바일 코스 탭 스크롤 불가 🔴 심각 ▶
- **의존**: 없음
- **파일**: `components/planner/CourseItem.tsx`
- **증상**: `CourseItem.tsx:87` 이 카드 **루트 div** 에 `touch-none` 을 걸어 `touch-action: none` 이 카드 전체에 적용된다. 드래그 핸들은 사진 영역(`setNodeRef` + `listeners`/`attributes` 가 붙은 div)뿐인데도, 모바일 코스 탭에서 카드 위를 세로로 쓸면 브라우저 스크롤이 시작되지 않는다. 카드 사이 `gap-2.5`(10px) 틈으로만 스크롤이 먹으므로 항목이 5~6개면 사실상 스크롤 불가.
- **내용**: `touch-none` 을 **드래그 핸들 div 로만** 옮긴다(dnd-kit 권장 형태 — `touch-action` 은 포인터를 가로챌 요소에만 건다). `select-none` 은 텍스트 선택 방지 목적이라 루트에 남겨도 무방하지만, 인라인 편집(`input`) 영역에 영향이 없는지 함께 확인한다. `PointerSensor` 의 `activationConstraint: { distance: 6 }` 은 그대로 둔다.
- **DoD**: 390px 폭 코스 탭에서 **카드 위를 쓸어올려 리스트가 스크롤**되고, 사진 영역을 눌러 끄는 재정렬(같은 Day 안 순서 변경)은 종전대로 동작한다. 데스크톱 코스 패널의 DnD 회귀 없음.
- **검증**: iframe 390px → 코스 탭 → 항목 6개 이상인 Day 선택 → 카드 중앙에서 세로 스와이프 → `scrollTop` 증가 확인. 이어서 사진 영역 드래그로 1↔3 순서 교체 후 순번 배지 갱신 확인.

### Step R2 · 데스크톱·모바일 트리 동시 마운트 제거 🔴 심각 ▶
- **의존**: 없음
- **파일**: `pages/Planner/Planner.tsx`, `hooks/useMediaQuery.ts`(신설), `hooks/usePoiList.ts`
- **증상**: `Planner.tsx:186`(`hidden flex-col gap-5 lg:flex`)과 `:210`(`flex flex-col gap-4 lg:hidden`)이 **둘 다 렌더된다**. CSS 로만 숨기므로 모바일에서도 데스크톱 쪽 `ResultsPanel`·`MapView`·`CoursePanel`·`BudgetDashboard`·`PlannerDndProvider` 가 살아서 동작한다 → **KakaoMap 인스턴스 2개**(하나는 크기 0 컨테이너에서 초기화 → 잘못된 뷰포트·불필요한 relayout), **POI 중복 조회**, 저사양 안드로이드에서 초기 렌더·메모리 부담. `usePoiList.ts:57` 의 in-flight dedup 주석이 *"Planner 는 데스크톱·모바일 ResultsPanel 을 동시에 마운트하고…"* 라고 **이미 이 사실을 인정하고 증상만** 막고 있다.
- **내용**: `hooks/useMediaQuery.ts` 신설(`matchMedia` 구독 + `useSyncExternalStore`, SSR 이 없으므로 초기값은 즉시 평가). `Planner` 가 `const isDesktop = useMediaQuery('(min-width: 1024px)')` 로 **한쪽 트리만 마운트**한다. 브레이크포인트 값은 Tailwind `lg`(1024px)와 반드시 일치시키고 상수로 뽑아 한 곳에서 관리한다.
- **DoD**: 모바일 폭에서 KakaoMap 인스턴스가 **1개**, `GET /poi` 가 **1회**. 폭을 넘나들며 리사이즈해도 지도·패널이 정상 전환되고 콘솔 에러 0. `usePoiList` 의 in-flight dedup 은 **StrictMode 이중 effect 대비로 여전히 유효**하므로 존치하되, 주석의 "동시 마운트" 근거는 갱신한다.
- **검증**: iframe 390px 진입 → 네트워크 패널로 `GET /poi` 1회·KakaoMap 초기화 1회 확인. 이어 1280px 로 전환 → 데스크톱 3분할 정상 렌더.
- **⚠️ 주의**: 트리 교체는 컴포넌트 로컬 state 초기화를 동반한다. R3 과 함께 설계해 폭 전환 시에도 **스토어 상태**(`plannerStore` 의 활성 Day·드로어 등)는 유지되도록 하고, 로컬 state 만 사라진다는 점을 명시한다.

### Step R3 · 모바일 탭 전환 시 탐색 상태 전멸 🔴 심각 ▶
- **의존**: R2
- **파일**: `pages/Planner/Planner.tsx`, `components/planner/ResultsPanel.tsx`
- **증상**: `Planner.tsx:232-241` 이 `{tab === 'results' && <ResultsPanel mobile />}` 형태의 **조건부 렌더**라 탭을 떠나는 순간 언마운트된다. `ResultsPanel` 의 로컬 state 가 전부 초기화된다 — `viewMode`→`'map'` · `courseOnly`→`true` · `cat`→`'all'` · `limit`→`60` · 스크롤 위치 · 지도 줌/팬. 리스트로 바꿔 '더 보기'를 3번 눌러 180개를 본 뒤 코스 탭에 갔다 오면 **다시 지도·60개·맨 위**다. 모바일은 탭 왕복이 잦아 체감이 크다.
- **내용**: 세 패널을 **모두 마운트**하고 `hidden`(또는 `el.hidden`)으로 전환한다. 지도 컨테이너가 `display:none` 이었다가 보일 때 카카오맵은 크기를 다시 읽어야 하므로, 탭 복귀 시 `map.relayout()` 을 호출한다(`KakaoMap` 에 노출 시점 훅 또는 `ResizeObserver`). 대안으로 해당 state 를 `plannerStore` 로 승격해도 되지만, 스크롤·지도 뷰포트까지 살리려면 **마운트 유지 쪽이 단순**하다.
- **DoD**: 결과↔코스↔예산을 왕복해도 ①뷰모드 ②카테고리 칩 ③'더 보기' 누적 개수 ④리스트 스크롤 위치 ⑤지도 줌·중심이 유지된다. 탭 복귀 시 지도가 잘리거나 회색으로 남지 않는다.
- **검증**: iframe 390px → 결과 탭에서 리스트 전환 + `음식점` 칩 + '더 보기' 2회 + 중간까지 스크롤 → 코스 탭 → 예산 탭 → 결과 탭 복귀 → 5개 항목 전부 유지 확인. 지도 모드에서도 줌 3단계 확대 후 왕복 → 같은 뷰포트.

### Step R4 · 320px 기기 가로 스크롤(`min-w-90`) 🟠 중요 ▶
- **의존**: 없음
- **파일**: `components/layout/Layout.tsx`, (넘침이 드러나는 곳) `components/planner/BudgetDashboard.tsx` 등
- **증상**: `Layout.tsx:25` 의 `min-w-90`(=22.5rem=360px)이 `px-4` 와 함께 걸려 있어 뷰포트가 360px 미만이면 **페이지 전체가 가로로 밀린다**. iPhone SE 1세대·갤럭시 폴드 접힘 상태(320px)에서 재현. 주석은 "모바일에서도 레이아웃이 깨지지 않도록"이라 되어 있으나, 실제로는 깨짐을 막는 대신 **가로 스크롤로 바꿔 놓은** 것이다.
- **내용**: `min-w-90`/`lg:min-w-90` 을 제거하고, 좁은 폭에서 실제로 넘치는 요소를 개별 처리한다 — flex 자식에 `min-w-0`, 예산 교통 행(수단 select + 배지 + 금액 + 되돌리기)은 이미 `flex-wrap` 이 있으니 확인만, 긴 텍스트는 `truncate`/`break-words`.
- **DoD**: 320px 폭에서 `document.documentElement.scrollWidth <= clientWidth`(가로 스크롤 0)이고, 주요 화면(홈·플래너 3탭·컬렉션·공유·로그인)에서 겹침·잘림이 없다.
- **검증**: iframe 320×640 하니스로 각 화면 진입 → `scrollWidth`/`clientWidth` 비교 + 스크린샷 육안 확인.

### Step R5 · 오버레이 스크롤 체이닝 + 하단 안전영역 🟠 중요 ▶
- **의존**: 없음
- **파일**: `components/planner/PoiDrawer.tsx`, `components/common/ConfirmDialog.tsx`, `components/planner/LoginGateModal.tsx`, `hooks/useBodyScrollLock.ts`(신설), `index.html`, `src/index.css`
- **증상**: ①세 오버레이 모두 **body 스크롤 락이 없고** 스크롤 컨테이너에 `overscroll-behavior: contain` 이 없다 → 바텀시트 내용을 끝까지 스크롤하면 뒤 페이지가 따라 움직이고, 닫으면 엉뚱한 위치에 있다(iOS 에서 특히 두드러짐). ②프로젝트 전체에 `env(safe-area-inset-*)` 사용이 **0건** → `PoiDrawer` 하단 액션 바(`닫기` / `Day N에 추가`)가 iOS 홈 인디케이터에 물린다. ③바텀시트에 grabber(핸들 바)도 스와이프 다운 닫기도 없어, 사진 위 X 버튼이 유일한 닫기 수단이다.
- **내용**: `useBodyScrollLock(open)` 훅 신설(열릴 때 `body` 스크롤 잠금 + 닫힘/언마운트 시 복원, 중첩 오버레이 카운팅). 드로어 본문 스크롤 컨테이너에 `overscroll-contain`. `index.html` viewport 에 `viewport-fit=cover` 추가 후 하단 액션 바에 `pb-[max(1rem,env(safe-area-inset-bottom))]`. 바텀시트 상단에 4px 회색 grabber 추가(장식이 아니라 "여기가 시트 상단"이라는 단서). 스와이프 다운 닫기는 **선택 범위** — 구현 난도 대비 효용을 착수 시 판단해 기록한다.
- **DoD**: 오버레이가 열린 동안 배경이 스크롤되지 않고 닫으면 원래 스크롤 위치로 돌아온다. 하단 액션 바가 홈 인디케이터에 가리지 않는다. 바텀시트에 grabber 가 보인다. 세 오버레이 모두 기존 a11y(role/aria-modal/Escape/오버레이 클릭)는 유지.
- **검증**: iframe 390px → POI 드로어 열고 본문 끝까지 스크롤 → 배경 `window.scrollY` 불변 확인 → 닫은 뒤 원위치. `ConfirmDialog`(코스 삭제)·`LoginGateModal`(비로그인 저장)도 같은 확인.

### Step R6 · 지도가 페이지 스크롤을 삼킴 🟠 중요 ▶
- **의존**: R3
- **파일**: `components/planner/ResultsPanel.tsx`, `components/planner/parts/KakaoMap.tsx`
- **증상**: 모바일 결과 탭 기본값이 지도(`ResultsPanel.tsx:79 viewMode='map'`)이고 `Planner.tsx:231` 의 `h-[70vh]` 카드가 화면 대부분을 차지한다. 지도 위 세로 스와이프가 전부 kakao 의 pan 으로 먹혀 **아래 예산 탭·푸터로 내려갈 수 없다**.
- **내용**: 모바일에서 지도를 기본 비드래그로 두고(`map.setDraggable(false)`), "지도 조작" 오버레이를 한 번 탭하면 활성화하는 방식(구글맵 임베드 관례)이 1안. 2안은 모바일 기본 뷰모드를 `'list'` 로 바꾸는 것 — 다만 F5 에서 *"코스를 만들고 들어오면 가장 먼저 보고 싶은 것은 내 일정이 어떻게 이어지는가"* 라는 근거로 지도를 기본으로 정했으므로 **그 결정을 뒤집는 것은 사용자 판단 사항**이다. 착수 시 1안을 우선 제안한다.
- **DoD**: 390px 폭에서 지도 영역 위 세로 스와이프로 **페이지를 푸터까지 내릴 수 있고**, 의도적으로 지도를 조작하는 경로가 남아 있으며, 마커 탭(상세 열기)·토글(담기/빼기)은 활성화 전에도 종전대로 동작한다(F6·F7·F8 회귀 없음).
- **검증**: iframe 390px → 결과 탭(지도) → 지도 중앙에서 위로 스와이프 → `window.scrollY` 증가 확인. 오버레이 탭 후 pan·줌 동작 확인. 마커 토글 도달 가능성은 F7/F8 하니스 재실행으로 회귀 확인.

### Step R7 · 헤더 모바일 메뉴 z-index 누락 🟠 중요 ▶
- **의존**: 없음
- **파일**: `components/layout/HeaderLayout.tsx`, `src/index.css`
- **증상**: `HeaderLayout.tsx:148` 의 모바일 드롭다운이 `absolute top-full left-0 right-0` 인데 **z-index 가 없다**. `index.css:24` 의 `.navbar { position: relative }` 에도 z 가 없어 스택 컨텍스트 우위가 없다 → `main` 안의 positioned 요소(홈 검색바 드롭다운 `z-10`, POI 카드 `relative` 배지 등)가 메뉴 위로 올라온다.
- **내용**: `.navbar` 에 `z-30`(또는 헤더 래퍼에 Tailwind 클래스), 모바일 메뉴에 `z-20`. 프로젝트에 이미 쓰이는 z 계층(드로어 `40/50` · 다이얼로그 `60/70` · 토스트 `50`)과 충돌하지 않게 **헤더는 오버레이보다 아래**로 둔다. 겸사겸사 z 계층을 `index.css` 주석 한 줄로 문서화한다.
- **DoD**: 홈·플래너(3탭 각각)·컬렉션·공유 화면에서 버거 메뉴를 열면 메뉴가 항상 최상단에 온전히 보이고, 열린 상태에서 오버레이(드로어·모달·토스트)를 띄우면 오버레이가 메뉴 위에 온다.
- **검증**: iframe 390px → 각 화면에서 메뉴 열고 `elementFromPoint(메뉴 항목 중심)` 이 그 항목인지 확인.

### Step R8 · 터치 타깃 44px 미만 정비 🟠 중요 ▶
- **의존**: 없음
- **파일**: `src/index.css`, `components/planner/LikeButton.tsx`, `pages/Index.tsx`, `pages/Collection/Collection.tsx`, `components/planner/parts/markerStyle.ts`, `components/planner/CourseItem.tsx`
- **증상**(6곳):
  1. **`index.css:21` `.btn-circle { width: 24px; }` 전역 override** — daisyUI 원형 버튼 전체를 24px 로 줄인다. 여기에 찜 하트(`LikeButton` 의 `btn-circle`)가 걸려 **24×32 로 찌그러진** 채 렌더되고 오탭을 유발한다. 이 규칙이 왜 생겼는지 근거가 없으므로 **제거 우선, 회귀 발견 시 범위 축소**.
  2. 홈 인원 조절 `−`/`+` (`rounded p-1` + 16px 아이콘 ≈ 24px)
  3. 컬렉션 카드 삭제 버튼 (`btn-sm btn-square` 32px, **탭 가능한 카드 위에 겹쳐** 있어 오탭 시 삭제 확인 다이얼로그)
  4. 지도 마커 토글 22px (`markerStyle.ts:39` — 주석은 "터치 목표 확보"라 하지만 22px 는 기준 미달)
  5. 코스 카드 시각 편집 트리거 (`text-xs` 한 줄, 높이 ≈16px)
  6. 코스 카드 금액 편집 트리거 (동일)
- **내용**: 각각 `min-h-11 min-w-11`(44px) 확보. 시각적 크기를 키우기 곤란한 곳(마커 토글·인라인 편집 칩)은 **투명 히트박스 확장**(`relative` + `before:absolute before:-inset-2`)으로 처리해 디자인을 유지한다. 마커 토글은 히트박스를 키우면 겹침 판정(`mapCluster` 의 `minSeparationPx`)에 영향을 주므로 **F7/F8 시뮬레이터를 재실행해 회귀를 확인**한다.
- **DoD**: 위 6곳의 실측 히트박스가 44×44px 이상. `.btn-circle` 전역 override 제거(또는 근거와 함께 범위 축소). F7/F8 의 도달 가능성 검증 통과 유지.
- **검증**: iframe 390px 에서 각 요소의 `getBoundingClientRect()`(+ 가상 요소 히트박스는 `elementFromPoint` 로 모서리 4점 판정). 마커 토글 변경 시 `mapCluster` node 테스트 + 앱 줌 흐름 스윕 재실행.

### Step R9 · 토스트 위치 🟡 개선 ▶
- **의존**: 없음
- **파일**: `components/common/Toaster.tsx`
- **증상**: `Toaster.tsx:16` 이 `toast toast-top toast-end` 고정이라 모바일에서 헤더 우측(계정 메뉴·테마 토글) 위를 덮고, 엄지에서 가장 먼 자리다. 토스트가 **클릭으로 닫히는** 구조(`<button>`)라 도달성이 특히 중요하다.
- **내용**: `toast-bottom toast-center sm:toast-top sm:toast-end` 로 폭에 따라 분기. 하단이면 안전영역도 함께(`pb-[env(safe-area-inset-bottom)]` — R5 와 규칙 공유).
- **DoD**: 390px 에서 토스트가 하단 중앙에 뜨고 헤더를 가리지 않으며, 640px 이상에서는 종전대로 우상단. 여러 개가 쌓여도 하단 버튼(예: 드로어 액션 바)을 영구히 가리지 않는다.
- **검증**: iframe 390px → 코스 저장/삭제 등으로 success·error·info 각각 띄워 위치·중첩 확인.

### Step R10 · 홈 검색바 모바일 시각 단서 + DatePicker 🟡 개선 ▶
- **의존**: 없음
- **파일**: `pages/Index.tsx`, `src/index.css`
- **증상**: ①`Index.tsx` 의 목적지·일정·이동수단·테마 트리거가 `border-base-100 bg-base-100`(테두리·배경이 카드와 동일)에 `text-xs` 다. 데스크톱은 `w-px` 구분선이 칸을 나눠 주지만 그 구분선이 **`hidden lg:block` 이라 모바일에서만 사라진다** → 5개 필드가 "눌러야 할 곳"이라는 단서 없이 텍스트 목록처럼 세로로 붙어 보인다. ②`react-datepicker` 기본 팝오버는 셀이 작고 좁은 화면에서 좌우로 잘릴 수 있다.
- **내용**: 모바일에서 각 칸에 `border-base-300 rounded-xl min-h-12`(+`px-3`) 부여해 입력 컨트롤로 읽히게 한다(데스크톱 알약형 검색바는 현행 유지 — 2026-08-08 에 다듬은 결과물이므로 건드리지 않는다). DatePicker 는 모바일에서 `withPortal` + 셀 크기 확대(`.custom-datepicker-calendar` 훅이 이미 `index.css` 에 있다). 2026-08-08 에 도입한 `DateTrigger`(`MM/dd ~ MM/dd` 축약)는 그대로 둔다.
- **DoD**: 390px 폭에서 5개 칸이 각각 눌러야 할 컨트롤로 식별되고(테두리 + 최소 높이 48px), 달력이 화면 안에 온전히 들어오며 날짜 셀이 손가락으로 눌린다. 데스크톱 검색바 회귀 없음.
- **검증**: iframe 390px → 각 칸 탭 → 드롭다운/달력 열림 + 화면 밖으로 나가지 않는지. 1280px 에서 알약형 검색바 스크린샷 비교.

### Step R11 · 폰트 700 · hover 고착 · 메타 태그 🟡 개선 ▶
- **의존**: 없음
- **파일**: `src/index.css`, `index.html`, `components/planner/POICard.tsx`, `pages/Collection/Collection.tsx`
- **증상**: ①`index.css` 의 `@font-face` 가 Pretendard **Regular(400) 하나만** 로드하는데 UI 전반이 `font-bold`(700)·`font-extrabold`(800)를 쓴다 → 브라우저 합성 볼드로 저해상도 모바일에서 뭉갠다. ②POI 카드·컬렉션 카드의 `hover:-translate-y-0.5 hover:shadow-md` 가 터치 후 고착되고, 반대로 `active:` 눌림 피드백은 없다. ③`index.html` 에 `theme-color`(모바일 브라우저 크롬을 헤더 teal 과 통일)·`description`·공유 링크(`/share/:courseId`)용 OG 태그가 없다 — **카카오 공유(S7·GBC014)가 핵심 기능**이라 특히 아쉽다.
- **내용**: ①Pretendard 700 woff2 `@font-face` 추가(`font-display: swap` 유지). 800 은 실제 사용처 대비 비용을 보고 판단. ②`@media (hover: hover)` 로 hover 효과를 감싸고 `active:scale-[0.98]` 추가. ③`index.html` 에 `theme-color`(라이트/다크 `prefers-color-scheme` 분기)·`description`·기본 OG 태그. **공유 링크의 코스별 OG 는 SPA 라 정적 태그로는 불가** — 카카오 공유는 `kakaoShare` 의 feed 템플릿이 자체 이미지·제목을 싣고 있으므로 그 경로를 우선 확인하고, 정적 OG 는 서비스 기본값으로만 둔다(이 한계를 문서에 남긴다).
- **DoD**: DevTools Network 에 700 woff2 가 실제로 로드되고 합성 볼드가 사라진다. 카드 탭 후 hover 잔상이 없고 누르는 동안 축소 피드백이 있다. 모바일 브라우저 주소창 색이 헤더와 맞는다.
- **검증**: iframe 390px → `document.fonts.check('700 16px Pretendard')` · 카드 탭 후 `getComputedStyle(card).transform` 이 `none` 으로 복귀 · `<meta name="theme-color">` 존재 확인.

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
5. **그룹 F**(사용자 피드백)는 S1~S8·P1·P2 가 끝난 뒤 F1→F2→F3→F4→F5→F6→F7→F8→F9 순으로 진행한다. F1·F2 는 GBC020 영속 범위(백엔드 `{schedule}` 바디) 확인이, F4 는 로그인 세션 실측(사용자 대행)이 선행 조건이다.
6. **📱 그룹 R**(모바일 UI/UX)은 **백엔드도 로그인도 필요 없어 지금 바로 착수 가능한 유일한 그룹**이다. R1→R11 을 심각도 순으로 진행하되, 🔴 심각 3건(R1·R2·R3)은 실제 조작이 막히거나 상태가 유실되는 결함이므로 **다른 무엇보다 먼저** 처리한다. 검증은 동일 출처 iframe 390×731(및 R4 는 320×640) 하니스로 한다.
