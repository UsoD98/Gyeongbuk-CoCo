# FE ↔ BE 계약 추적표 (S0-A)

> 짝 문서: [`FE_개발순서.md`](./FE_개발순서.md) §Step0 0-A · [`FE_API_연동가이드.md`](./FE_API_연동가이드.md) §1-A
> 목적: 연동 착수 전 확정되지 않았던 계약을 추적한다.
> **연동 중 400/422/빈결과가 나면 이 표부터 확인한다.**
> 최종 업데이트: 2026-07-17 (**백엔드 소스 실측 검증 완료** — `../back` 대조)

---

## 검증 방법
FE 가정을 백엔드 실제 소스(`../back/src/main/java/com/eodegano/cocobackend/{controller,dto,domain/enums,service}`)와 1:1 대조했다. 근거는 파일:라인으로 남긴다. (설정·비밀정보 파일은 제외)

## 계약 4건 (실측 결과)

| # | 항목 | 확정값 (백엔드 실측) | 근거 | 상태 |
|---|------|----------------------|------|:---:|
| 1 | `transport` | 대문자 enum `CAR`/`PUBLIC_TRANSPORT`/`WALK`. 요청 DTO가 `TransportType` enum이라 **정확 일치 필수** | `TransportType.java`, `TourCourseGenerateRequestDto.java:33` | ☑ 확정 |
| 2 | `sigunguCode` | 단일 `string`, 선택. **법정동 시군구 코드(경북 접두 `47`)** — 서비스가 `findByLDongSignguCd`로 조회. openapi 예시 `35130`은 오해 소지 | `TourCourseGenerateRequestDto.java:38`, `TourCourseServiceImpl.java:232~237` | ◐ 타입확정/값주의 |
| 3 | `theme` | `string[]`(≥1). **한국어 라벨 필수** — 값이 LLM 프롬프트에 그대로 삽입됨(코드/목id 금지) | `TourCourseGenerateRequestDto.java:35`, `TourCourseServiceImpl.java:371~379` | ◐ 타입확정/값주의 |
| 4 | `userId` | **백엔드 미제공** — 로그인/재발급/카카오 응답은 `{accessToken}`뿐. JWT subject=email, `/user/me` 없음 | `LoginResponseDto.java`, `AuthController.java:43,72,84`, `JwtProvider.java:59~65` | ⛔ 블로커 |

> 배지: `☑` 확정 · `◐` 타입은 확정·값 의미론 주의 · `⛔` 계약 불일치(블로킹)

---

## 항목별 상세

### 1. `transport` ☑ 확정
백엔드 `TransportType` enum = `CAR`("자동차")/`PUBLIC_TRANSPORT`("대중교통")/`WALK`("도보"). 요청 DTO 필드가 enum 타입이라 Jackson이 **정확한 대문자 문자열만** 역직렬화한다. FE `Transport` union 그대로 사용.
- **Step 1 유의**: Index의 `'walk'` 하드코딩 제거 → 대문자 선택값으로 교체.
- **S1 반영(2026-07-17)**: `Index`에 이동수단 드롭다운(`CAR`/`PUBLIC_TRANSPORT`/`WALK`) 추가, `'walk'` 하드코딩 제거. 기본값 `CAR`.

### 2. `sigunguCode` ◐ (값 체계 주의)
- 타입: 단일 `String`, 선택(없으면 전체 조회). FE `sigunguCode?: string` 정확.
- **값 체계**: `TourCourseServiceImpl.fetchPlacesData`가 `tourRepository.findByLDongSignguCd(sigunguCode)`로 조회 → **법정동 시군구 코드**(경북 접두 `47`, 예 경주 `47130`). openapi 예시 `35130`(TourAPI 35접두)과 다르다. 잘못된 값이면 `"해당 지역의 여행지 데이터가 없습니다"` 예외(`:237`).
- **Step 1 할 일**: FE `sigunguStore`의 실제 코드 접두를 확인해 `47xxx` 형식 **단일** 전송(현재 배열 → 단일).
- **S1 반영(2026-07-17)**: `sigunguCode = GYEONGBUK_AREA_CODE('47') + sigunguStore.value(뒤 3자리)` 단일 전송(예 경주 `47130`). 목적지 UI는 복수 선택 유지하되 첫 선택만 전송, 미선택 시 미전송(백엔드 전체 조회). ⚠️ 값 정확성(법정동 코드 일치)은 실백엔드 200/400 응답으로 최종 확인 필요.

### 3. `theme` ◐ (라벨 필수)
- 타입: `@NotEmpty List<String>`. FE `theme: string[]` 정확.
- **값**: `buildUserRequest`가 `String.join(", ", theme)`로 **LLM 프롬프트에 그대로 삽입**(`"테마: 자연, 맛집"`), DB엔 JSON 배열로 저장. 검증·코드 매핑 없음.
- **Step 1 할 일**: FE `travelThemeStore` 코드(`001~004`)·목 id(`history` 등)를 **한국어 라벨**(자연/맛집/힐링/문화…)로 매핑해 전송. 코드 그대로 보내면 AI 품질 저하.
- **S1 반영(2026-07-17)**: `getThemeLabel(code)`로 한국어 라벨(어드벤처/휴식/문화/음식) 배열 전송. 코드·목 id 미전송. `theme` 미선택 시 검색 차단(백엔드 `@NotEmpty` 대응).

### 4. `userId` ⛔ (섬 M 블로커)
- **현실**: 로그인/재발급/카카오 응답 DTO는 `LoginResponseDto{accessToken}`뿐. JWT는 `subject=email`+`role`만. `/user/me` 없음. 인증 엔드포인트는 전부 email(`Authentication.getName()`)로 사용자를 식별한다.
- **결과**: 회원 API `GET/PATCH/DELETE /user/{userId}`(Long userId 경로변수)를 부를 **자기 userId를 FE가 얻을 방법이 없음** → **섬 M(GBC006~009) 착수 불가**.
- **영향 범위**: 코스 파이프라인(S1~S7)·POI 좋아요(P1)는 userId 불필요(백엔드가 email로 처리) → 정상 진행.
- **필요 결정(백엔드 중 택1)**: ① `LoginResponseDto`+재발급에 `userId` 추가, ② `GET /user/me`(토큰 기반) 추가, ③ JWT에 userId 클레임 추가(FE 디코드).
- **FE 준비 상태**: S0-C(`authStore.userId`+`setAuth`+localStorage, `LoginResponse.userId?`)는 ①이 되면 **코드 수정 없이 즉시 동작**. 현재는 항상 null(무해).

---

## 응답 타입/엔드포인트 실측 (S0-B 검증)
- ✅ `CreateCourseResponse`=`TourCourseGenerateResponseDto`, `CourseSummary`=`TourCourseListItemDto`, `CourseDetail`=`TourCourseShareResponseDto` 필드 **1:1 일치**. 봉투 `{code,msg,data}` 일치(`ApiResponse.java`).
- ✅ GBC012 상세·GBC014 공개뷰가 **둘 다 `TourCourseShareResponseDto`** 반환 → FE 단일 `CourseDetail`로 `getCourse`/`getPublicCourse` 공용 가능(`TourCourseController.java:50,66`).
- ✅ `place.type` 값 = `PlaceType` 이름: `ATTRACTION`/`CULTURE`/`EVENT`/`LEPORTS`/`ACCOMMODATION`/`SHOPPING`/`FOOD`(`PlaceType.java`).
- ✅ 상세/뷰의 `placeName`은 항상 문자열(빈값 `""` 가능), 목록/생성 응답엔 없음(`TourCourseServiceImpl.buildCourseResponse:167`).
- ✅ 게스트 생성(email null→userId null) → `assign`은 소유자 없을 때만 1회 허용(`TourCourseServiceImpl.assignCourse:203`). Step 1→2 흐름 그대로 작동.
- ✅ POI 좋아요 응답 `{liked, likes}` → FE `TogglePoiLikeResponse`에 `likes` 반영(`PoiLikeResponseDto.java`).
- ⏸ `GBC020`(PATCH `/tour-course/{courseId}`) 컨트롤러 미구현 → **S8 대기**. `GET /poi`·`/poi/{contentId}` 미구현 → **P2/P3 대기**.

## 구현 메모
- `CourseScheduleDay` 명명: 목업 `CourseDay`(`@/types/planner.ts`)와 충돌 회피(변경 없음).
- `ContentTypeId`: FE는 `PoiCat`(4종) 대응값 12/14/32/39만 정의. 백엔드 `PlaceType`엔 15(축제)/28(레포츠)/38(쇼핑)도 있음 — POI 목록/상세(P2/P3) 확장 시 반영.
