# FE ↔ BE 계약 추적표 (S0-A)

> 짝 문서: [`FE_개발순서.md`](./FE_개발순서.md) §Step0 0-A · [`FE_API_연동가이드.md`](./FE_API_연동가이드.md) §1-A
> **백엔드에 넘길 요청서: [`BE_계약_요청서.md`](./BE_계약_요청서.md)** — 3건(#4→R1 · #8→R2 · #9→R3)을 근거·요청안·회신 양식으로 정리했다. **R2 는 회신·반영 완료(0.6.3), R3 은 추가 예정, R1 은 대기.**
> 목적: 연동 착수 전 확정되지 않았던 계약을 추적한다.
> **연동 중 400/422/빈결과가 나면 이 표부터 확인한다.**
> 최종 업데이트: 2026-08-22 (**R2 회신 수용 → #8 `☑ 확정(라이브)`** — 백엔드 `cd6c7ec`(0.6.3)가 코스 상세·공개뷰 응답에 `mapx`/`mapy` 를 추가했다. 로컬 백엔드를 실제로 띄워 `GET /tour-course/1/view` 로 실측: 좌표가 **JSON number**(`129.2423293844`)로 오고, POI 캐시에 없는 `contentId` 는 `null`(그 장소는 `placeName` 도 `''`) — 코스 1의 18곳 중 6곳이 그렇다. FE 는 `CoursePlace.mapx/mapy` 를 받아 `Poi.lat/lng` 로 주입하고 장소명 지오코딩을 **좌표 null 전용 폴백으로 격하**했다(제거하지 않음 — 캐시 미스가 실재한다). Vite dev 모듈을 직접 태운 실측: 18곳 중 **12곳 즉시 렌더 · 지오코딩 왕복 0회**. ⚠️ **생성(GBC010)은 다른 DTO 라 여전히 좌표 없음**(그 화면은 GBC017 좌표로 그림 → 추가 요청 안 함). #9 는 "추가 예정" 구두 회신을 받아 `🕒 예정` 로 갱신.)
> 이전 업데이트: 2026-08-22 (**미해결 3건을 요청서로 승격** — #4 `userId`·#8 코스 장소 좌표·#9 찜 상태 조회를 [`BE_계약_요청서.md`](./BE_계약_요청서.md) R1·R2·R3 으로 정리. 백엔드 `aa2a555`(0.5.12) 재실측으로 세 건 모두 **여전히 미해결** 확인. R2 는 `PoiSummary` 가 이미 `mapx`/`mapy` 를 들고 있어 **추가 조회 없이** 가능하다는 사실을 새로 확인했다. #6(`transport` 영속)은 요청서 부록 B 로 판단 요청.)
> 이전 업데이트: 2026-08-15 (P2 착수로 **GBC017 `GET /poi` 계약 실측 확정** — 응답 스키마·파라미터(단수 `sigunguCode`)·`theme` 미지원·`avgPrice` null·좌표 결측 주의 추가)

---

## 검증 방법
FE 가정을 백엔드 실제 소스(`../back/src/main/java/com/eodegano/cocobackend/{controller,dto,domain/enums,service}`)와 1:1 대조했다. 근거는 파일:라인으로 남긴다. (설정·비밀정보 파일은 제외)

## 계약 4건 (실측 결과)

| # | 항목 | 확정값 (백엔드 실측) | 근거 | 상태 |
|---|------|----------------------|------|:---:|
| 1 | `transport` | 대문자 enum `CAR`/`PUBLIC_TRANSPORT`/`WALK`. 요청 DTO가 `TransportType` enum이라 **정확 일치 필수** | `TransportType.java`, `TourCourseGenerateRequestDto.java:33` | ☑ 확정 |
| 2 | `sigunguCodes` | **복수** `string[]`, 선택. **법정동 시군구 코드 3자리 bare**(예 경주 `130`, 접두 `47` 없음) — 서비스가 `findByLDongSignguCdIn`으로 조회. FE `sigunguStore.value`·`mst_sigungu`와 동일 | `TourCourseGenerateRequestDto.java:38`, `TourCourseServiceImpl.java:412~417`, 라이브 실측(200/400) | ☑ 확정 |
| 3 | `theme` | `string[]`(≥1). **한국어 라벨 필수** — 값이 LLM 프롬프트에 그대로 삽입됨(코드/목id 금지) | `TourCourseGenerateRequestDto.java:35`, `TourCourseServiceImpl.java:371~379` | ◐ 타입확정/값주의 |
| 4 | `userId` | **백엔드 미제공** — 로그인/재발급/카카오 응답은 `{accessToken}`뿐. JWT subject=email, `/user/me` 없음. **`aa2a555`(0.5.12) 재실측에서도 동일** → [요청서 R1](./BE_계약_요청서.md#r1-로그인-사용자-userid-획득-경로-추적표-4) | `LoginResponseDto.java`, `AuthController.java:37,63,78`, `JwtProvider.java:59~65`, `UserController.java:22,28,34,43,52` | ⛔ 블로커 · 📤 요청 |

> 배지: `☑` 확정 · `◐` 타입은 확정·값 의미론 주의 · `⛔` 계약 불일치(블로킹)

---

## 항목별 상세

### 1. `transport` ☑ 확정
백엔드 `TransportType` enum = `CAR`("자동차")/`PUBLIC_TRANSPORT`("대중교통")/`WALK`("도보"). 요청 DTO 필드가 enum 타입이라 Jackson이 **정확한 대문자 문자열만** 역직렬화한다. FE `Transport` union 그대로 사용.
- **Step 1 유의**: Index의 `'walk'` 하드코딩 제거 → 대문자 선택값으로 교체.
- **S1 반영(2026-07-17)**: `Index`에 이동수단 드롭다운(`CAR`/`PUBLIC_TRANSPORT`/`WALK`) 추가, `'walk'` 하드코딩 제거. 기본값 `CAR`.

### 2. `sigunguCodes` ☑ 확정 (라이브 실측으로 정정)
- 타입: **복수** `List<String>`(백엔드 DTO 필드명 `sigunguCodes`), 선택(없으면 경북 전역 선정). ⚠️ **S1의 단수 `sigunguCode?: string`은 필드명·값 형식 둘 다 오류였음** — 백엔드가 인식하지 못해 지역 필터가 조용히 무시됐다.
- **값 체계(정정)**: `fetchPlacesData`가 `tourRepository.findByLDongSignguCdIn(codes)`로 조회. `Tour.lDongSignguCd`는 **3자리 bare 코드**(예 경주 `130`)이고, 시도코드 `47`은 별도 컬럼 `lDongRegnCd`라 필터에 쓰이지 않는다. 따라서 **접두 `47`을 붙이면(`47130`) 매칭 실패** → `"해당 지역의 여행지 데이터가 없습니다"`. FE `sigunguStore.value`(111/130/…)와 `mst_sigungu.sigunguCode`가 동일 3자리. openapi 예시 `35130`(TourAPI 35접두)은 이 엔드포인트와 무관.
- **라이브 실측(2026-08-08, DB 기동 상태)**: `["47130"]` → 400 "해당 지역의 여행지 데이터가 없습니다"(fetchPlacesData 단계 즉시). `["130"]` → 지역 조회 통과(이후 AI 단계 진행). 미전송(전역) → 정상 생성(courseId 11/12).
- **수정 반영(2026-08-08)**: `CreateCourseRequest.sigunguCodes?: string[]`로 변경. `Index`가 `selectedDestinations`(bare value 배열, 복수 선택 전부)를 그대로 전송(미선택 시 생략). `GYEONGBUK_AREA_CODE` 접두 로직 제거.
- **POI(GBC017) 실측 확정(2026-08-15, P2)**: `GET /poi`는 **단수·필수 `sigunguCode`**가 맞다(코스 생성의 복수 `sigunguCodes`와 다름). 값은 3자리 bare(`130`)이며 백엔드가 `35`(TourAPI areaCode) 접두 5자리도 `normalizeSigunguCode`로 정규화한다(`PoiCurationServiceImpl:66`). FE는 `sigunguStore.value` 그대로 전송하고, 지역 복수 선택은 **지역마다 병렬 호출 후 합침**으로 처리한다.

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
- **📤 요청 발송(2026-08-22)**: [`BE_계약_요청서.md` R1](./BE_계약_요청서.md#r1-로그인-사용자-userid-획득-경로-추적표-4)로 정리(권장안 ①). 백엔드 `aa2a555`(0.5.12) 재실측 결과 **변화 없음** — 세 인증 경로 모두 `LoginResponseDto{accessToken}` 단일 필드, `UserController`는 여전히 `/{userId}` 경로변수만. (라인 참조를 현재 소스 기준 `AuthController.java:37/63/78`로 정정했다.)

---

## 응답 타입/엔드포인트 실측 (S0-B 검증)
- ✅ `CreateCourseResponse`=`TourCourseGenerateResponseDto`, `CourseSummary`=`TourCourseListItemDto`, `CourseDetail`=`TourCourseShareResponseDto` 필드 **1:1 일치**. 봉투 `{code,msg,data}` 일치(`ApiResponse.java`).
- ✅ GBC012 상세·GBC014 공개뷰가 **둘 다 `TourCourseShareResponseDto`** 반환 → FE 단일 `CourseDetail`로 `getCourse`/`getPublicCourse` 공용 가능(`TourCourseController.java:50,66`).
- ✅ `place.type` 값 = `PlaceType` 이름: `ATTRACTION`/`CULTURE`/`EVENT`/`LEPORTS`/`ACCOMMODATION`/`SHOPPING`/`FOOD`(`PlaceType.java`).
- ✅ **코스 장소(`places[]`)에 실데이터 필드가 이미 있다(2026-08-15 실측)** — FE가 `seq/time/type/contentId/placeName`만 쓰고 나머지를 버리고 있었다(예산 ₩0·썸네일 없음의 원인). 생성·상세 응답 모두 아래를 채워 보낸다:
  - `thumbnailImg`: TourAPI firstimage URL(없으면 null, **`http://`로 옴** → FE가 https 승격)
  - `operatingHours`: 운영시간 원문(예 `09:00~18:00`, `- 10:00~21:00- 브레이크타임 …`, 없으면 null)
  - `cost`: **1인 예상 비용(원)**. 실데이터 없으면 타입별 기본값(`ATTRACTION` 5000·`FOOD` 12000·`CULTURE` 3000·`LEPORTS` 20000·`SHOPPING`/`EVENT` 0), **`ACCOMMODATION`은 매핑에 없어 null** → FE는 '가격 미정'
  - `durationMinutes`: 체류 시간(분) — 현재 항상 null(실측)
  - 장소명: 상세/공개뷰는 `placeName`(**빈 문자열일 수 있음**), 생성 응답은 없음 → **`contentName` 추가 예정(백엔드 합의)**. FE는 `placeName || contentName || '장소 #id'` 순으로 폴백하도록 선반영 완료.
- ✅ 상세/뷰의 `placeName`은 항상 문자열(빈값 `""` 가능), 목록/생성 응답엔 없음(`TourCourseServiceImpl.buildCourseResponse:167`).
- ✅ 게스트 생성(email null→userId null) → `assign`은 소유자 없을 때만 1회 허용(`TourCourseServiceImpl.assignCourse:203`). Step 1→2 흐름 그대로 작동.
- ✅ POI 좋아요 응답 `{liked, likes}` → FE `TogglePoiLikeResponse`에 `likes` 반영(`PoiLikeResponseDto.java`).
- ✅ `GBC020`(PATCH `/tour-course/{courseId}`) **구현·라이브 검증 완료(2026-08-15)** — 백엔드 `TourCourseController.updateCourse` + `TourCourseServiceImpl.updateCourse` 실측. 코스 39로 편집→저장→재진입까지 200 확인.
  - 바디 = `{ "schedule": [...] }` — **전체 교체**(diff 아님). 하루 = `{date:'yyyy-MM-dd', places:[...]}`.
  - 장소 = `{seq, time:'HH:mm:ss', type(PlaceType), contentId, contentName, durationMinutes, thumbnailImg, operatingHours, cost}`. 조회 응답과 같은 모양이되 **장소명 키는 `contentName`**(`placeName` 아님), `operatingHours`/`thumbnailImg`/`cost` 는 nullable.
  - 헤더 `Authorization: Bearer` 필수, 경로 `courseId`(Long). 응답 = 공통 봉투(`data` 는 "완료 데이터"로만 명시 → FE는 값을 쓰지 않고 성공 여부만 본다).
  - ⚠️ **백엔드가 실제로 저장하는 필드는 `seq`·`time`·`type`·`contentId`·`durationMinutes` 뿐이다**(실측 `TourCourseUpdateRequestDto.PlaceUpdate`). `contentName`·`thumbnailImg`·`operatingHours`·`cost` 는 "조회 전용 표시 필드"라 **의도적으로 무시**하고 TourAPI 라이브 조회로 재조립한다(`@JsonIgnoreProperties(ignoreUnknown = true)`).
    → **결과: 사용자의 비용(예산) 편집은 서버에 영속되지 않는다.** 재진입하면 백엔드 타입별 기본값으로 돌아온다(라이브 실측: `cost 7000` 전송 → 재조회 `5000`). 영속이 필요하면 백엔드에 `cost` 저장 요청 필요.
  - ⚠️ 검증 규칙(`validateUpdateRequest` 실측): ①`schedule` 비어 있으면 400 ②**Day 마다 장소 1곳 이상**(`@NotEmpty` → 400 "일정에 최소 한 개의 장소가 필요합니다") ③`date` 는 코스 `startDate~endDate` 범위 안 ④`type` 은 유효한 `PlaceType` ⑤`contentId` 는 백엔드 후보 목록(`tourLiveDataService.getAllCandidates`)에 있어야 한다. FE는 ②를 보내기 전에 막고 어느 Day 인지 toast 로 알린다(`useCourseUpdate`).
  - ⚠️ **인증 없이 호출하면 401 이 아니라 500** 이 온다(실측). 매핑 존재 여부를 상태코드로 추정하지 말 것.
  - ⚠️ FE 조립 규칙(`utils/coursePayload`): UI 코스에 없는 원본 필드는 `plannerStore.baseSchedule`(응답 원본)에서 복원하고, 새로 담은 장소는 카탈로그 Poi 로 채운다. 방문 시각은 **그 날 원본 시각 슬롯을 순번대로 배분**(재정렬해도 시각이 역전되지 않음). 예산 override(총액)는 `cost`(1인 기준)로 환산해 보낸다(백엔드가 무시하더라도 계약대로 전송).
- ✅ **`GET /poi/{contentId}`(GBC018) 구현 확인(백엔드 소스 실측 2026-08-22)** — P3 착수·완료. `PoiController.getPoiDetail` + `PoiDetailServiceImpl`(TourAPI `detailCommon` + `detailInfo` 라이브 조회). 인증 불필요(`/api/v1/poi/**` permitAll).
  - 응답 = `{contentId, contentTypeId, title, tel, homepage, overview, firstimage, firstimage2, addr1, addr2, mapx, mapy, avgPrice, infoList[{infoname, infotext}]}`(`PoiDetailResponseDto`). `title` 은 없으면 `'(제목없음)'` 으로 채워 **항상 문자열**, 나머지 문자열·좌표는 nullable, `infoList` 는 없으면 **빈 배열**(`List.of()`).
  - ⚠️ **목록(GBC017)과 필드명이 다르다** — 썸네일이 `thumbnail` 이 아니라 `firstimage`/`firstimage2`. 좌표 키(`mapx`=경도·`mapy`=위도)는 동일.
  - ✅ **HTML 은 백엔드가 제거해서 준다**(`stripHtml`: `<br>`→줄바꿈 후 태그 제거) → `overview`·`homepage`·`infotext` 는 그대로 텍스트로 렌더한다(`dangerouslySetInnerHTML` 불필요). 줄바꿈이 살아 있어 `whitespace-pre-line` 필요.
  - ⚠️ **`avgPrice` 는 항상 null**(서비스가 명시적으로 `null` 고정, TODO BOQ14) → 목록과 같은 제약. 가격은 사용자 입력(override)만 의미가 있다.
  - ⚠️ **좌표 `0`** 항목이 섞여 있다(목록과 동일) → `utils/coords.isValidTourCoord` 로 걸러 쓴다.
  - ⚠️ **찜 상태(`liked`)는 상세 응답에도 없다** → #9 그대로 유효.
  - ⚠️ 없는 contentId 는 **404** + `{code:404, msg:'존재하지 않는 POI입니다'}`(`GlobalExceptionHandler`). TourAPI 라이브 조회라 응답이 느릴 수 있고 동시 호출 시 503 가능(목록과 동일) → FE 는 contentId 단위 캐시 + in-flight dedup.
  - `infoList` 는 유형마다 항목이 다르다(관광지=이용시간·주차, 음식점=대표메뉴·영업시간 …) → FE 는 이름에 '시간' 이 든 항목을 운영시간 폴백으로 쓰고 나머지는 부가정보 목록으로 표시.
- ✅ **`GET /poi`(GBC017) 구현 확인(백엔드 v0.5.1, 2026-08-15)** — P2 완료. 응답 `{available, items[{contentId, contentTypeId, title, mapx, mapy, thumbnail, avgPrice}]}`(`PoiCurationResponseDto`/`PoiCurationItemDto`). 파라미터는 `sigunguCode`(단수·필수)·`peopleCount`(필수, **검증만 하고 필터엔 미사용**)·`contentTypeId`(선택). 인증 불필요(`SecurityConfig` permitAll).
  - ⚠️ **`theme` 파라미터 없음** — 가이드 §3의 `theme` 필터는 백엔드에 존재하지 않는다(테마 기반 큐레이션 불가). 필요하면 백엔드 추가 요청 대상.
  - ⚠️ **`avgPrice` 항상 null** — 근거 테이블 소실(백엔드 TODO `BOQ14`). FE는 가격 0을 '무료'가 아닌 **'가격 미정'**으로 표기한다. 예산 계산에서 POI 비용은 사용자가 직접 입력(override)해야 의미가 있다.
  - ⚠️ **`contentTypeId` 8종** — 12/14/15/25/28/32/38/39가 모두 응답에 등장(경주 실측). FE `PoiCat` 4종으로 접어서 사용(`catOfContentType`).
  - ⚠️ **좌표 결측치** — `mapx/mapy = 0`인 항목이 섞여 있다(경주 324건 중 1건). 좌표 사용 시 범위 검사 필수.
  - ⚠️ **동시 호출 시 503** — TourAPI 라이브 조회라 동일/다중 요청이 겹치면 503이 나올 수 있다(실측). FE는 in-flight dedup으로 완화.

## 추가 확인 요청 (그룹 F, 2026-08-22)

| # | 항목 | 질문 | FE 현재 처리 | 상태 |
|---|------|------|--------------|:---:|
| 5 | `durationMinutes`·`cost` 영속 (F1·S8) | GBC020 으로 보낸 `schedule[].places[].durationMinutes`·`cost` 를 **저장하는가**? | **☑ 저장한다**(백엔드 소스 실측, 2026-08-22). `TourCourseUpdateRequestDto.PlaceUpdate` 에 `durationMinutes`·`cost` 가 있고 `TourCourseServiceImpl.updateCourse` 가 `TourCourseUserDefinedDetail` 로 그대로 저장한다. 조회도 반영 — `resolveCost(type, detail, storedCost)` 가 **저장값을 최우선**으로 쓰고 `durationMinutes` 는 엔티티 값을 그대로 내려준다(백엔드 0.5.9·0.5.10 에서 `cost` 컬럼 신설). ⚠️ 무시되는 건 `contentName`·`thumbnailImg`·`operatingHours`(TourAPI 라이브 재조립) 뿐이다 → **보드 S8 의 "비용은 서버가 저장하지 않는다" 메모는 그 시점 기준이고 지금은 저장된다.** 라이브 왕복 재확인은 백엔드 기동 시 | ☑ 확정(소스) |
| 6 | `transport`·교통비 영속 (F2) | 코스 헤더의 `transport` 를 수정할 경로가 있는가? 교통비를 저장할 필드가 있는가? | **⛔ 둘 다 없다(백엔드 소스 실측, 2026-08-22).** ①`transport` 는 생성(GBC010) 시 `TourCourseUserDefined.transport` 에 1회 저장되고 이후 수정 경로가 없다 — `TourCourseController` 의 PATCH 는 `/{id}`(schedule)·`/{id}/title`·`/{id}/assign` 셋뿐이고 `TourCourseUpdateRequestDto` 에도 `transport` 필드가 없다. ②교통비는 **설계상 서버가 산정·저장하지 않는다**(백엔드 0.5.9 에서 BU3 교통비 추정 취소, "이동 관련 비용 계산은 프론트엔드가 전담"). 저장되는 비용은 장소별 `cost` 뿐. → FE 는 `plannerStore.transport`·`transportOverride` 로 세션 내 계산·표시만 하고 `dirty` 를 세우지 않는다(저장 버튼이 거짓말하지 않게). **영속이 필요하면 백엔드에 ①`transport` 수정 경로 ②코스 단위 교통비 필드를 요청해야 한다** → [요청서 부록 B](./BE_계약_요청서.md#부록-b-우선순위-낮은-후보-판단만-부탁--지금-요청은-아님)로 **판단 요청**(추가할지 현행 유지할지) | ⛔ 불가 확정 · 📤 판단 대기 |
| 7 | 내 찜 목록 조회 (F4) | 로그인 사용자의 POI 좋아요 목록을 주는 엔드포인트가 있는가? 같은 POI 두 번 호출 시 `liked:false` 로 내려오는가(insert-only 여부) | **원인 확정(백엔드 소스 실측 2026-08-22).** ①**insert-only 아님** — `PoiLikeServiceImpl.toggleLike` 는 `findByUserIdAndContentId` 로 기존 행을 찾아 있으면 `delete`+`decrementLikes`(0 하한) 후 `liked:false`, 없으면 `saveAndFlush`+`incrementLikes` 후 `liked:true` 를 준다. 컨트롤러 메시지도 "좋아요가 취소되었습니다."로 갈린다. ②사용자 증상("추가만 됨")의 실제 원인은 **백엔드 저장 유실 버그**였고 `6e4e682`(2026-08-16, "벌크 업데이트 `clearAutomatically` 로 INSERT 유실")로 **수정 완료**(현재 소스에 `saveAndFlush`+`flush()` 반영). ③**남은 계약 공백 = 찜 상태 조회 경로 없음** — `PoiController` 는 `/poi`·`/poi/{contentId}`·`/poi/{contentId}/like` 3개뿐이고 `PoiCurationItemDto`·`PoiDetailResponseDto` 에 `liked`/`likes` 필드가 없다(`UserPoiLikeRepository.existsByUserIdAndContentId` 는 존재하나 **아무 컨트롤러도 쓰지 않음**) → 새로고침하면 서버에 남은 찜도 하트가 비어 보이고, 그 상태에서 누르면 실제로는 **해제**된다. FE 는 `localStorage` 흉내내기를 채택하지 않고(서버 진실과 어긋남) 응답 `liked` 가 기대와 다를 때 toast 로 알린다. → **#9 로 백엔드 요청 승격** | ☑ 확정(소스) |

| # | 항목 | 질문 | FE 현재 처리 | 상태 |
|---|------|------|--------------|:---:|
| 8 | 코스 장소 좌표 (F5) | 코스 조회/생성 응답의 `schedule[].places[]` 에 **`mapx`/`mapy`(좌표)를 넣어 줄 수 있는가**? | **☑ 해결 — 백엔드 0.6.3 (`cd6c7ec`) 이 `TourCourseShareResponseDto.PlaceInfo` 에 `mapx`/`mapy`(`BigDecimal`) 추가.** **GBC012(상세)·GBC014(공개뷰)** 가 같은 DTO 를 쓰므로 양쪽 동시 적용. FE 가 요청서에서 제시한 방식 그대로 `summaryMap`(PO1 캐시, TTL 6h) 을 읽는 헬퍼 2개(`mapxOf`/`mapyOf`)만 늘어 **TourAPI 추가 조회 없음**. **라이브 실측(2026-08-22, 로컬 `ddcdbb2` 기동)**: `GET /tour-course/1/view` 가 `mapx: 129.2423293844` 처럼 **JSON number** 로 준다 → FE 타입은 `mapx?: number \| null`. 캐시에 없는 `contentId` 는 **`null`** 이고 그 장소는 `placeName` 도 `''` 다(코스 1의 18곳 중 6곳). ⚠️ **생성(GBC010)은 미적용** — 다른 DTO(`TourCourseGenerateResponseDto.PlaceInfo`)를 쓴다. 그 화면은 큐레이션 목록(GBC017) 좌표로 그리므로 **추가 요청하지 않는다**. | **FE 반영 완료** — `CoursePlace.mapx/mapy` 타입 추가 → `plannerStore.synthesizePoi` 가 `isValidTourCoord` 통과 시 `Poi.lat/lng` 주입, `mergeSources` 는 좌표를 **쌍으로** 고른다(카탈로그 우선, 없으면 코스 응답). `utils/kakaoGeocode`·`useCourseCoords` 는 **좌표 null 장소 전용 폴백으로 격하**(제거하지 않음 — 캐시 미스가 실제로 존재한다). 실측: 18곳 중 12곳 즉시 렌더, 지오코딩 왕복 **0회** | ☑ 확정(라이브) |
| 9 | 찜 상태 조회 API (F4) | 로그인 사용자의 찜 상태를 **읽을** 경로를 주실 수 있는가? (선택지: ㉮ `GET /poi/likes` → 내가 찜한 `contentId[]`, ㉯ `GET /poi`·`GET /poi/{contentId}` 응답에 `liked`(+`likes`) 필드 추가 — 인증 있을 때만 채움) | **🕒 추가 예정(구두 회신 2026-08-22)** — GBC017·GBC018 에 `liked` 를 실어 줄 예정이라는 회신을 받았다. **아직 소스에 없음**(0.6.3 `PoiCurationItemDto`·`PoiDetailResponseDto` 에 `liked` 부재) → 착수 불가. | `poiLikeStore` 는 **메모리 전용**이라 새로고침 시 항상 미찜으로 시작한다. 서버 진실과 어긋나는 localStorage 캐시는 쓰지 않고, 토글 응답이 기대와 다르면 "이미 찜한 곳이어서 찜을 해제했어요"로 알린다. 도착하면 `poiLikeStore` 초기 주입만 추가한다(구조 변경 불필요) | 🕒 예정 |

---

## 구현 메모
- `CourseScheduleDay` 명명: 목업 `CourseDay`(`@/types/planner.ts`)와 충돌 회피(변경 없음).
- `ContentTypeId`: FE는 `PoiCat`(4종) 대응값 12/14/32/39만 정의. 백엔드 `PlaceType`엔 15(축제)/28(레포츠)/38(쇼핑)도 있음 — POI 목록/상세(P2/P3) 확장 시 반영.
