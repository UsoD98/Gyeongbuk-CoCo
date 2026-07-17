# 프론트엔드 API 연동 가이드

> 짝 문서: [`FE_API_현황.md`](./FE_API_현황.md) (현재 어디까지 됐는지)
> 이 문서: 남은 15개 엔드포인트를 **어떤 순서로, 어떻게** 붙일지에 대한 실무 가이드
> 기준 스펙: `openapi.yaml` (GBC001~020) · 대상: `front/src`

---

## 0. 이 가이드를 쓰는 법

- 각 작업은 **"만들 파일 → 함수 시그니처 → 붙일 UI → 주의점"** 순으로 정리했다.
- 코드 스니펫은 **기존 `api/auth.ts` 패턴을 그대로 복제**한 예시다. 새 규칙을 만들지 말고 이 패턴을 따를 것.
- 시작 전 [§1 공통 선결 과제](#1-공통-선결-과제-먼저-끝내야-막힘)를 반드시 먼저 처리한다. 이걸 건너뛰면 개별 작업이 중간에 막힌다.
- 코딩 규칙은 `CLAUDE.md` / `CONVENTION.md` 준수(모든 import는 `@/` 절대경로, `cn()` 사용, `import type`, 페이지는 `lazy`+`Suspense`, 도메인 라우터는 `RouteObject[]` default export).

---

## 1. 공통 선결 과제 (먼저 끝내야 막힘)

### 1-A. 백엔드와 계약 확정 (코드보다 먼저 — 회의 안건)

현황문서 §6의 불일치를 **연동 착수 전에 반드시 합의**한다. 이게 안 되면 만들어도 400이 난다.

| 항목 | FE 현재 | 스펙 | 확정 필요 |
|------|---------|------|-----------|
| `transport` | `'walk'` (소문자, 하드코딩) | `CAR`/`PUBLIC_TRANSPORT`/`WALK` | 대문자 값 + 선택 UI |
| `sigunguCode` | 배열 전송 | 단일 string `'35130'` | 단일값 여부 + 코드체계(`35`? `47`?) |
| `theme` | 코드 `001~004` | 예시는 문자열 `자연`,`맛집` | 코드 vs 라벨 |
| `userId` | 미보관 | path 파라미터 필수 | 로그인 응답에 `userId` 포함 or `/user/me` 제공 |

### 1-B. API 응답 타입 정의

현재 코스/POI 타입은 목업 전용(`types/planner.ts`)이다. 백엔드 스키마에 맞춘 타입을 신설한다.

```ts
// src/api/tourCourse.ts (신규) — 스펙 200 응답 예시 기반
export interface CoursePlace {
  seq: number;
  time: string;        // 'HH:mm:ss'
  type: string;        // 'ATTRACTION' | 'RESTAURANT' | ...
  contentId: number;
  placeName?: string;  // 상세 조회에만 포함
}
export interface CourseDay {
  date: string;        // 'yyyy-MM-dd'
  places: CoursePlace[];
}
export interface CourseSummary {   // 목록(GBC011)
  courseId: number;
  title: string;
  peopleCount: number;
  startDate: string;
  endDate: string;
  transport: string;
  theme: string[];
  createdAt: string;
}
export interface CourseDetail extends Omit<CourseSummary, 'createdAt'> {
  schedule: CourseDay[];
}
export interface CreateCourseRequest {
  peopleCount: number;
  startDate: string;
  endDate: string;
  transport: 'CAR' | 'PUBLIC_TRANSPORT' | 'WALK';
  theme: string[];
  sigunguCode?: string;
}
export interface CreateCourseResponse {
  courseId: number;
  schedule: CourseDay[];
}
```

### 1-C. `userId` 보관 (마이페이지 선결)

`authStore`에 `userId`를 추가하고 로그인/재발급/카카오 성공 시 세팅한다. 백엔드가 `login` 응답 `data`에 `userId`를 실어주는지 먼저 확인(현재 `LoginResponse`는 `accessToken`만).

```ts
// stores/authStore.ts — 필드 추가
interface AuthState {
  accessToken: string | null;
  userId: number | null;     // ← 추가
  // ...
  setAuth: (token: string, userId: number) => void;  // setAccessToken 확장
}
```

### 1-D. 목 → API 전환 원칙

`mocks/planner.ts` 파일 상단 주석대로 **"컴포넌트는 `@/mocks/*` 대신 `@/api/*`를 임포트하도록만 교체"** 한다. 즉 UI/타입은 유지하고 데이터 소스만 바꾼다. 급격한 리라이트 금지.

권장: 도메인별 커스텀 훅으로 로딩/에러/데이터를 캡슐화(예: `useCourseList()`)해 컴포넌트가 API 세부를 모르게 한다.

---

## 2. 우선순위 로드맵

의존 관계(저장이 안 되면 목록/상세/삭제가 무의미)를 반영한 순서.

### P0 — 코스 생성·저장 파이프라인 (서비스의 심장)
1. **GBC010** AI 코스 생성 — `Index.tsx` 검색폼을 실제 POST로 연결 + 결과를 플래너로 라우팅
2. **GBC016** 소유권 이전 — 비로그인 생성 코스를 로그인 후 내 것으로 귀속(= "저장")
3. **GBC011** 내 코스 목록 — `Collection.tsx` 구현
4. **GBC012** 코스 상세 — `:courseId` 라우트 + 목록→상세 진입

### P1 — 코스 관리 액션
5. **GBC013** 코스 삭제
6. **GBC015** 코스 제목 수정
7. **GBC020** 코스 수정 영속화 (백엔드 '개발중' — 백엔드 완료 대기)
8. **GBC014** 공유 링크 + 공개뷰 라우트

### P2 — POI & 마이페이지 (스펙상 보류/독립 기능)
9. **GBC017/018** POI 목록/상세 목→API 전환 (스펙 '보류' — 백엔드 준비 후)
10. **GBC019** POI 좋아요 토글
11. **GBC006~009** 마이페이지(조회/닉네임/비밀번호/탈퇴) — `userRouter` 신설

---

## 3. 엔드포인트별 연동 레시피

### 표준 패턴 (모든 신규 API 함수의 틀)

```ts
// api/tourCourse.ts (신규) — api/auth.ts와 동일 구조
import { apiClient } from '@/api/client.ts';
import type { ApiResponse } from '@/api/types.ts';

/** POST /tour-course — AI 코스 생성 (비로그인 허용) */
export async function createCourse(
  req: CreateCourseRequest,
): Promise<CreateCourseResponse> {
  const { data } = await apiClient.post<ApiResponse<CreateCourseResponse>>(
    '/tour-course',
    req,
  );
  return data.data;
}
```
> `apiClient`가 baseURL(`/api/v1`)·Bearer 헤더·401 재발급을 자동 처리하므로, 함수는 경로와 타입만 신경 쓰면 된다. 에러는 호출부에서 `getApiErrorMessage(err)`로 toast 처리.

---

### GBC010 · AI 코스 생성 🟡→🟢

- **만들 것**: `api/tourCourse.ts`의 `createCourse()`
- **고칠 것**: `pages/Index.tsx`의 `handleSearch`
- **UI**: 검색폼은 이미 완비. 이동수단(`transport`) 선택 UI만 추가.
- **레시피**:
  ```ts
  // Index.tsx handleSearch 교체
  const handleSearch = async () => {
    try {
      const res = await createCourse({
        peopleCount: number,
        startDate: formatDate(startDate)!,
        endDate: formatDate(endDate)!,
        transport,                    // ← 'walk' 하드코딩 제거, 선택값(대문자)
        theme: selectedThemes,
        sigunguCode: selectedDestinations[0],  // ← 단일값(계약에 따라)
      });
      usePlannerStore.getState().loadFromApi(res);  // 목업 로드 대신 API 응답 주입
      navigate('/planner/');
    } catch (e) {
      toast.error(getApiErrorMessage(e, '코스 생성에 실패했어요'));
    }
  };
  ```
- **주의**: §1-A의 `transport`/`sigunguCode`/`theme` 계약 먼저 확정. `plannerStore`에 `loadFromApi(res)` 액션 신설(현재 부팅 시 `DEFAULT_COURSE` 로드 로직 대체). 비로그인도 생성 가능하므로 게스트 코스 `courseId`를 보관해 GBC016에서 사용.

### GBC016 · 코스 소유권 이전 🔴→🟢 ("저장"의 실체)

- **만들 것**: `assignCourse(courseId)` = `PATCH /tour-course/{courseId}/assign`
- **고칠 것**: `Planner.tsx`의 `onSave`(현재 toast만), `LoginGateModal`
- **흐름**: 비로그인 사용자가 생성한 `courseId`를 보관 → 저장 클릭 시 로그인 게이트 → 로그인 성공 후 `assignCourse(보관된 courseId)` 호출 → 내 코스로 귀속.
- **주의**: 게스트 코스 식별자를 로그인 왕복(하드 리다이렉트 가능성) 동안 유지해야 함(예: `sessionStorage` 또는 로그인 `state`). PRD_BACK BOQ4의 "이전 타이밍" 결정과 맞물림.

### GBC011 · 내 코스 목록 🔴→🟢

- **만들 것**: `getMyCourses(): Promise<CourseSummary[]>` = `GET /tour-course`
- **구현할 것**: `pages/Collection/Collection.tsx`(현재 5줄 스텁) 전면 구현 — 코스 카드 리스트, 로딩/빈/에러 상태, 카드 클릭 시 상세 이동.
- **UI 참고**: 카드에 제목·지역·기간·인원·테마·생성일 표시(스펙 목록 응답 필드). daisyUI `card` 활용.
- **주의**: `/collection/`은 이미 `RequireAuth` 보호 하에 있음(로그인 필수). 공통 `EmptyState`/`ErrorState`가 없으니 이번에 `components/common`에 함께 만들면 재사용됨.

### GBC012 · 코스 상세 🔴→🟢

- **만들 것**: `getCourse(courseId): Promise<CourseDetail>` = `GET /tour-course/{courseId}`
- **고칠 것**: `routes/plannerRouter.tsx`에 `:courseId` 동적 세그먼트 추가(예: `/planner/:courseId`). 목록→상세 진입.
- **주의**: 플래너가 현재 목업 단일 코스만 그림. 상세 응답(`schedule[].places[]`)을 `plannerStore`에 주입하는 매핑 필요. 소유자 인증 필요(401 시 인터셉터가 처리).

### GBC013 · 코스 삭제 🔴→🟢

- **만들 것**: `deleteCourse(courseId)` = `DELETE /tour-course/{courseId}`
- **UI**: 컬렉션 카드/상세에 삭제 버튼 + 확인 다이얼로그. 삭제 후 목록 갱신.
- **주의**: 현재 `CoursePanel`의 '새 코스'는 toast만, `CourseItem`의 X는 POI 단위 `removePoi`다. **코스 전체 삭제는 별도**임을 혼동하지 말 것.

### GBC015 · 코스 제목 수정 🔴→🟢

- **만들 것**: `updateCourseTitle(courseId, title)` = `PATCH /tour-course/{courseId}/title`
- **UI**: 제목을 인라인 편집(클릭→input→onBlur 저장). 현재 `Planner.tsx:49`/`CoursePanel.tsx:98`는 읽기전용 표시.
- **주의**: `plannerStore`에 `setTitle` 액션 추가(낙관적 업데이트 후 실패 시 롤백).

### GBC020 · 코스 수정 영속화 🟠→🟢

- **만들 것**: `updateCourse(courseId, payload)` = `PATCH /tour-course/{courseId}`
- **상태**: 편집 UI(dnd 재정렬/추가/삭제/비용)는 완성됨. **저장 트리거만** 붙이면 됨.
- **주의**: 스펙 `x-status: 개발중` — **백엔드 완료 후** 착수. 요청 바디 스키마가 스펙에 미정의라 백엔드와 payload 형태(전체 schedule 교체? diff?) 협의 필요. 인메모리 변경을 debounce 저장 또는 명시적 "저장" 버튼으로 flush.

### GBC014 · 공유 + 공개뷰 🔴→🟢

- **만들 것**: 공유 링크 생성(백엔드 계약 확인) + `getPublicCourse(courseId)` = `GET /tour-course/{courseId}/view` (인증 불필요)
- **신설 라우트**: `shareRouter.tsx` + `pages/Share/Share.tsx` (예: `/share/:id`). **가드 밖**에 배치(비로그인 수신자용).
- **고칠 것**: `Planner.tsx`의 `onShare`(현재 toast만) → 실제 공유 URL 생성 + 카카오 공유 SDK 연동.
- **주의**: 공개뷰는 `apiClient`의 Bearer가 없어도 되는 유일한 코스 조회. 401 인터셉터에 걸리지 않도록 경로 확인.

### GBC017 / GBC018 · POI 목록·상세 🟠→🟢

- **만들 것**: `api/poi.ts`의 `getPois(params)` = `GET /poi`, `getPoi(contentId)` = `GET /poi/{contentId}`
- **고칠 것**: `ResultsPanel.tsx`(목록)·`PoiDrawer.tsx`(상세)의 `@/mocks/planner.ts` import를 API 호출로 교체. UI 구조는 유지.
- **주의**: 스펙 `x-status: 보류` — **백엔드 준비 후** 착수. `contentTypeId`(12/14/32/39)·`peopleCount` 버킷·`theme` 필터 파라미터가 스펙과 일치하는지 확인. 카카오맵 데모(`PoiDrawer.tsx:140`)를 실제 연동으로 교체. 목 POI의 `cat`(sight/food/stay/culture) ↔ 스펙 `contentTypeId` 매핑 테이블 필요.

### GBC019 · POI 좋아요 토글 🔴→🟢

- **만들 것**: `togglePoiLike(contentId)` = `POST /poi/{contentId}/like`
- **UI 신규**: `POICard`/`PoiDrawer`에 하트 버튼 + 찜 상태 표시. **UI가 아예 없으므로 새로 만들어야 함.**
- **주의**: 로그인 필수. 낙관적 업데이트(클릭 즉시 토글 후 실패 시 롤백) 권장. 좋아요 상태는 POI 조회 응답에 포함되는지 확인.

### GBC006~009 · 마이페이지 🔴→🟢

- **선결**: §1-C의 `userId` 보관 완료가 전제.
- **만들 것**: `api/user.ts`에 `getUser(userId)`·`updateNickname(userId, nickname)`·`updatePassword(userId, {currentPassword, newPassword})`·`deleteUser(userId)` 추가.
- **신설**: `routes/userRouter.tsx` + `pages/User/MyPage.tsx`(또는 Settings). 헤더 프로필 드롭다운에 진입 메뉴 추가.
- **UI**: 프로필 조회 + 닉네임 인라인 편집 + 비밀번호 변경 폼(현재/신규) + 회원탈퇴(확인 다이얼로그, 소프트 삭제).
- **주의**: 탈퇴 성공 시 `authStore.clear()` + 홈 이동. 비밀번호 변경 검증은 `Register.tsx`의 `validate` 재사용.

---

## 4. 함께 만들면 좋은 공통 자산

현황문서 §5에서 "없다"고 확인된 것들. 여러 작업이 공유하므로 초기에 만들면 중복이 준다.

- `components/common/EmptyState.tsx`, `ErrorState.tsx`, `Skeleton.tsx` — 목록/상세의 로딩·빈·에러 3종 규약(P0에서 첫 소비).
- 도메인 훅: `hooks/useCourseList.ts`, `hooks/useCourse.ts`, `hooks/usePoiList.ts` — 로딩/에러/데이터 캡슐화(`hooks/` 디렉터리는 CLAUDE.md에 예정되어 있으나 비어 있음).
- 코스/POI 도메인 스토어 확장: `plannerStore`에 `loadFromApi`·`setTitle`·서버 동기화 액션.

---

## 5. 작업 체크리스트 (엔드포인트당)

- [ ] `api/<domain>.ts`에 함수 추가 (요청/응답 타입은 백엔드 DTO와 1:1, `ApiResponse` 봉투 벗기기)
- [ ] UI에서 호출 + 로딩/에러 상태 처리 (`getApiErrorMessage` + `toast`)
- [ ] 목데이터 참조 제거(해당 시) — `@/mocks/planner.ts` import 삭제
- [ ] 인증 필요 여부 확인 (RequireAuth 라우트 or 액션 게이트)
- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과 (TS 타입 검사)
- [ ] `npm run dev`로 모바일·데스크톱 폭 모두 확인

---

## 6. 요약: 지금 당장 시작한다면

1. **회의**: §1-A 계약 4건(transport/sigunguCode/theme/userId) 확정.
2. **파일 2개 신설**: `api/tourCourse.ts`, `api/poi.ts` (§3 표준 패턴 복제).
3. **P0 착수**: GBC010(생성) → GBC016(저장) → GBC011(목록) → GBC012(상세). 이 4개가 "코스를 만들고 저장해 다시 본다"는 서비스 핵심 루프다.
4. 나머지는 P1/P2 순서대로. 스펙 `보류`(POI)·`개발중`(GBC020)은 백엔드 완료를 기다린다.
