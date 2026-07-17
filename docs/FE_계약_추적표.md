# FE ↔ BE 계약 추적표 (S0-A)

> 짝 문서: [`FE_개발순서.md`](./FE_개발순서.md) §Step0 0-A · [`FE_API_연동가이드.md`](./FE_API_연동가이드.md) §1-A
> 목적: 연동 착수 전 확정되지 않은 계약 4건을 **비블로킹**으로 추적한다.
> 원칙: 답이 오면 반영, **안 오면 아래 "스펙 가정"으로 진행**하고 표를 유지한다.
> **연동 중 400/422가 나면 이 표부터 확인한다.**
> 최종 업데이트: 2026-07-17 (S0-A 등록, 4건 모두 스펙 가정으로 진행 중)

---

## 계약 4건

| # | 항목 | 스펙 가정(현재 코드가 따르는 값) | 백엔드에 확인 필요 | 코드 위치 | 상태 |
|---|------|----------------------------------|--------------------|-----------|:---:|
| 1 | `transport` | 대문자 enum `CAR` / `PUBLIC_TRANSPORT` / `WALK` | enum 값 확정 (대소문자·표현) | `api/tourCourse.ts` `Transport` | ☐ 미확정 |
| 2 | `sigunguCode` | 단일 `string`, `35130`(TourAPI `35` 접두) 체계 | 단일값 여부 + 코드체계(`35`냐 `47`이냐) | `api/tourCourse.ts` `CreateCourseRequest.sigunguCode`, `api/poi.ts` `PoiListParams.sigunguCode` | ☐ 미확정 |
| 3 | `theme` | 문자열 배열, 라벨 표기(예 `자연`,`맛집`) | 코드(`001`) vs 라벨(`자연`) | `api/tourCourse.ts` `CreateCourseRequest.theme: string[]` | ☐ 미확정 |
| 4 | `userId` | 로그인/카카오/재발급 응답 `data.userId` 포함(정수) | 포함 여부, 아니면 `/user/me` 제공 여부 | `api/auth.ts` `LoginResponse.userId?`, `api/client.ts` reissue, `stores/authStore.ts` `userId` | ☐ 미확정 |

> 상태 배지: `☐` 미확정(스펙 가정으로 진행) · `☑` 확정(백엔드 합의 완료)

---

## 항목별 상세 & 방어 로직

### 1. `transport`
- 스펙 예시가 대문자(`CAR`)이므로 `Transport` 타입을 대문자 3종으로 고정.
- FE 기존 코드의 `'walk'`(소문자, 하드코딩)는 **Step 1(GBC010)에서 선택 UI + 대문자 값으로 교체** 예정.
- 확정되면 `Transport` union만 수정하면 전 파일에 전파된다.

### 2. `sigunguCode`
- 스펙은 **단일 string**이나 FE 검색폼은 다중선택(배열) 상태 → Step 1에서 `selectedDestinations[0]`처럼 단일값 전송으로 맞춘다.
- 코드체계 불일치 주의: `sigunguStore`는 `47` 접두(법정동), 스펙 예시는 `35130`(TourAPI). 다중선택 정책과 함께 확정 필요.

### 3. `theme`
- 스펙 예시가 라벨 문자열(`자연`,`맛집`)이므로 `string[]`로 둠.
- 단, FE `travelThemeStore`는 코드(`001~004`), `mocks`는 별도 id(history/food/…)라 **3중 불일치**. Step 1에서 백엔드 기대 표현으로 매핑 필요.

### 4. `userId` (가장 중요 — 섬 M 선결)
- **스펙 가정**: 로그인/카카오/재발급 응답 `data`에 `userId: number` 포함.
- **방어 로직(구현됨, S0-C)**:
  - `LoginResponse.userId?`는 **선택 필드** — 없어도 컴파일·동작.
  - `authStore.setAuth(token, userId?)`: `userId`가 `undefined`면 기존 값을 **유지**(reissue가 안 실어줘도 덮어쓰지 않음).
  - `userId`는 민감정보가 아니므로 `localStorage`(`gb-coco.userId`)에도 보관 → **새로고침(reissue) 후에도 즉시 복원**. 로그아웃/`clear()` 시 함께 삭제.
- **미확정 리스크**: 백엔드가 어느 응답에도 `userId`를 주지 않으면, 최초 로그인 시점에 값이 없어 마이페이지(GBC006~009) 진입 불가. → 이 경우 백엔드에 **`/user/me` 토큰 기반 조회** 제공을 요청하고 섬 M 착수 전 재확정.

---

## 구현 메모 (계약 외 결정 사항)

- **`CourseScheduleDay` 이름**: 가이드 §1-B는 `CourseDay`로 표기하나, 목업/UI용 `CourseDay`(`@/types/planner.ts`, `{label, items}`)와 이름이 충돌·혼동되어 서버 스키마용은 `CourseScheduleDay`(`{date, places}`)로 명명했다. (`api/tourCourse.ts`)
- **POI 응답 타입 잠정**: GBC017/018은 스펙 `보류` + 200 스키마 미정의 → `api/poi.ts`의 `PoiSummary`/`PoiDetail`은 TourAPI 관례 기반 **잠정**. P2/P3에서 백엔드 확정 시 교정.
- **`POI cat ↔ contentTypeId` 매핑**: `api/poi.ts` `CONTENT_TYPE_BY_CAT`에 sight=12/culture=14/stay=32/food=39로 선반영(P0 전환 대비).
