# 백엔드 계약 요청서 (FE → BE)

> **이 문서는 백엔드 팀에 넘기는 요청서다.** FE가 막혀 있는 계약 공백 3건을 근거·요청안·수용 효과와 함께 정리했다.
> 짝 문서: [`FE_계약_추적표.md`](./FE_계약_추적표.md) (#4 · #8 · #9) · [`FE_개발_진행상황.md`](./FE_개발_진행상황.md)
> 작성: 2026-08-22 · 작성자: FE
> **대조 기준**: 백엔드 리포 `../back` 커밋 `aa2a555` (CHANGELOG 0.5.12). 근거는 모두 이 시점 소스의 `파일:라인`이다.
> 규칙: 설정·비밀정보 파일(`application.yaml` 등)은 열지 않았다. 근거는 컨트롤러·DTO·서비스·리포지토리 소스뿐이다.
>
> ## 📬 회신 현황 (2026-08-22 갱신)
> - **R2 좌표 — ✅ 수용·반영 완료.** 백엔드 `cd6c7ec` (**0.6.3**) 가 `TourCourseShareResponseDto.PlaceInfo` 에
>   `mapx`/`mapy`(`BigDecimal`) 를 추가했다 → **GBC012(상세)·GBC014(공개뷰)** 양쪽 적용. 권장한 방식 그대로
>   `summaryMap` 캐시를 읽는 헬퍼 2개(`mapxOf`/`mapyOf`)만 늘어 **TourAPI 추가 조회는 없다**. FE 도 수용 반영 완료
>   (아래 §R2 «수용 후 실측» 참조). ⚠️ **생성(GBC010)은 다른 DTO** (`TourCourseGenerateResponseDto.PlaceInfo`)라
>   여전히 좌표가 없다 — 그 화면은 큐레이션 목록(GBC017) 좌표로 그리므로 **추가 요청은 하지 않는다**.
> - **R3 찜 상태 조회 — 🕒 추가 예정(구두 회신).** 아직 소스에 없다(0.6.3 `PoiCurationItemDto`·`PoiDetailResponseDto`
>   에 `liked` 없음). 도착 시 FE 는 `poiLikeStore` 초기 주입만 추가한다.
> - **R1 `userId` · 부록 B — 회신 대기.**

---

## 요약

| # | 요청 | 지금 무엇이 안 되나 (사용자 관점) | 권장안 | BE 변경 규모(추정) | FE 대응 |
|:-:|------|-----------------------------------|--------|:---:|---------|
| **R1** | 로그인 사용자 `userId` 획득 경로 | **마이페이지 전체가 없다** — 내 정보·닉네임 수정·비밀번호 변경·회원 탈퇴(GBC006~009) 착수 불가 | ① 로그인·재발급 응답에 `userId` 추가 | DTO 1필드 + 생성부 3곳 | **코드 수정 없이 즉시 동작**(FE 선반영 완료) |
| ~~**R2**~~ ✅ | 코스 장소에 좌표(`mapx`/`mapy`) | ~~컬렉션에서 내 코스를 열면 **지도에 마커가 0개**~~ → **해결**(0.6.3 `cd6c7ec`) | 응답 `schedule[].places[]` 에 `mapx`/`mapy` 추가 | DTO 2개에 2필드 + 헬퍼 1개 (**추가 조회 없음**) | **FE 반영 완료** — 지오코딩은 좌표 null 장소 전용 폴백으로 격하 |
| **R3** 🕒 | 내 찜(POI 좋아요) 상태 **조회** 경로 | 새로고침하면 찜한 곳의 **하트가 비어 보이고**, 그 하트를 누르면 추가가 아니라 **해제**된다 | ㉯ 목록·상세 응답에 `liked` 필드(인증 시에만 채움) | 조회 1건 + DTO 필드 | 초기 상태 주입만 추가(구조 변경 없음). **추가 예정 회신 받음** |

우선순위: **R3 ≥ R1** (R2 는 해결됨). R3은 이미 저장된 데이터가 사용자에게 잘못 보이는 **정합성 결함**이고, R1은 기능 4개를 통째로 막는 **블로커**다.

---

## R1. 로그인 사용자 `userId` 획득 경로 (추적표 #4)

### 현상 (실측)

- 인증 응답은 **전부 `accessToken` 하나뿐**이다.
  - `dto/LoginResponseDto.java` — 필드가 `String accessToken` 단일.
  - `controller/AuthController.java:37`(login) · `:63`(reissue) · `:78`(oauth/kakao/callback) — 세 곳 모두 반환형이 `ApiResponse<LoginResponseDto>`.
- JWT에도 id가 없다. `security/JwtProvider.java:59~65` — `subject(email)` + `claim("role", role)` 뿐.
- `/user/me` 같은 "나" 조회 경로가 없다. `controller/UserController.java` 매핑은 `POST /join`(`:22`) · `GET /{userId}`(`:28`) · `PATCH /{userId}/nickname`(`:34`) · `PATCH /{userId}/password`(`:43`) · `DELETE /{userId}`(`:52`).

### 결과

회원 API가 전부 `Long userId` **경로변수**를 요구하는데 FE가 자기 `userId`를 알 방법이 없다.
→ **섬 M(GBC006~009) 4개 Task 착수 불가.** 마이페이지 진입점 자체를 만들 수 없다.

> 참고: 코스 파이프라인·POI 좋아요는 백엔드가 `Authentication.getName()`(email)으로 사용자를 찾으므로 영향이 없다. 막히는 건 `/user/{userId}` 계열뿐이다.

### 요청안 (택 1)

| 안 | 내용 | BE 비용 | FE 비용 | 비고 |
|:-:|------|---------|---------|------|
| **① (권장)** | `LoginResponseDto` 에 `Long userId` 추가 → login·reissue·kakaoCallback 세 경로가 함께 채움 | DTO 1필드 + 생성부 3곳 | **0** | FE가 이미 이 형태로 선반영해 둠 |
| ② | `GET /user/me`(토큰 기반) 신설 — 기존 `UserInfoResponseDto` 재사용 | 컨트롤러 1 + 서비스 1 | 호출 1곳 추가 | 회원 API를 email 기준으로 옮길 발판이 되기도 함 |
| ③ | JWT에 `userId` 클레임 추가 → FE가 디코드 | 클레임 1줄 | 디코드 유틸 | 토큰 파싱을 FE가 하게 되어 비권장 |

### ①을 권장하는 이유

FE가 S0-C에서 **이미 ① 모양으로 구현을 끝내 놓았다.** 값이 응답에 실려 오는 순간 코드 수정 없이 동작한다.

- `src/stores/authStore.ts` — `userId: number | null` 상태 + `setAuth(token, userId?)`. `userId`를 **생략하면 기존 값 유지**라서, 재발급 응답이 `userId`를 안 실어도 로그인 때 받은 값이 보존된다. 토큰이 없으면(로그아웃) `userId`도 함께 비운다. `localStorage`(`gb-coco.userId`)에 병행 보관해 새로고침을 견딘다.
- `src/api/auth.ts:17` — `LoginResponse.userId?: number` (optional로 선반영).
- 현재는 항상 `null`이며 무해하다.

### ②를 고르실 경우 부탁

응답 스키마를 `UserInfoResponseDto` 그대로 유지해 주시면 FE는 `getUser`와 타입을 공유할 수 있다.

### 이 요청이 반영되면

섬 M 4개 Task(M1 회원정보 조회 → M2 닉네임 수정 → M3 비밀번호 변경 → M4 회원 탈퇴)가 바로 착수 가능해진다.

---

## R2. 코스 장소에 좌표(`mapx`/`mapy`) 추가 (추적표 #8) — ✅ **해결됨 (0.6.3)**

> **수용 후 실측 (2026-08-22, 로컬 백엔드 `ddcdbb2`/0.6.3 기동).** `GET /tour-course/1/view` 응답의
> `schedule[].places[]` 에 `mapx`/`mapy` 가 **JSON number** 로 온다(예: `mapx: 129.2423293844`,
> `mapy: 35.8232429015`). 백엔드 POI 캐시에 없는 `contentId` 는 **`null`** 이고, 그 장소는 `placeName`
> 도 빈 문자열이다(같은 응답 안에 섞여 있다 — 코스 1의 18곳 중 6곳). FE 는 이 둘을 좌표 없음으로
> 다루고 그 장소만 장소명 폴백에 넘긴다. 실측: **18곳 중 12곳이 API 좌표로 즉시 렌더, 지오코딩 왕복 0회.**
> 아래 원 요청 내용은 기록으로 남긴다.

### 현상 (실측)

코스 조회/생성 응답의 장소에 **좌표가 없다.**

- `dto/TourCourseShareResponseDto.PlaceInfo` — `seq` · `time` · `type` · `contentId` · `placeName` · `durationMinutes` · `thumbnailImg` · `operatingHours` · `cost` 9필드. 좌표 없음.
- 생성 응답(`TourCourseGenerateResponseDto.PlaceInfo`)도 동일하게 좌표 없음.

반면 POI 목록은 좌표를 준다 — `dto/PoiCurationItemDto.java:14~15`(`mapx`/`mapy`).

### 결과 (사용자 관점)

FE는 지도 마커를 **POI 목록(GBC017) 응답의 좌표**로만 찍을 수 있다. 그래서 **컬렉션에서 내 코스만 열면**(POI 목록을 부른 적이 없으므로) 좌표가 0개고 지도가 텅 빈다. 코스 항목 사이 이동시간 추정도 좌표가 없으면 표기가 생략된다.

### FE 현재 폴백과 그 한계

`src/utils/kakaoGeocode.ts` — 장소명으로 카카오 로컬 키워드 검색을 돌려 좌표를 메운다(경북 bbox 밖 동명 장소 배제, 이름별 1회 캐시, 6초 타임아웃).

- 장소당 외부 API 호출 1회가 추가되고, 동명 장소·표기 차이로 **틀린 좌표가 잡힐 수 있다.**
- `placeName`이 빈 문자열이면 검색 자체가 불가능하다.
- 카카오 SDK 장애 시 좌표가 전멸한다(실제로 겪었다).

### 요청안

`schedule[].places[]` 에 `mapx`(경도) · `mapy`(위도)를 추가해 주세요. 타입·의미는 **`PoiCurationItemDto`와 동일**하게(`BigDecimal`, 없으면 `null`) 부탁드립니다.

### 백엔드 변경 지점 — **추가 조회 없이 됩니다**

좌표는 이미 응답 조립 시점의 손 안에 있다.

- `service/PoiSummary.java` — `record PoiSummary(contentId, contentTypeId, title, firstimage, mapx, mapy, lDongSignguCd)` → **`mapx`/`mapy` 보유.**
- `service/TourCourseServiceImpl.java:269~279`(생성) · `:315~325`(상세/공개뷰) — 이 `summaryMap`으로 이미 `placeName`(`titleOf`)과 `thumbnailImg`(`thumbnailOf`)를 채우고 있다.
- 즉 `:374~378`의 `thumbnailOf`와 같은 모양으로 `mapxOf`/`mapyOf` 헬퍼를 만들어 두 빌더에 `.mapx(...)`/`.mapy(...)`를 얹으면 끝이다. **TourAPI 추가 호출이 필요 없다.**

### 유의 (FE가 이미 방어 중)

- 좌표 `0`인 항목이 섞여 온다(POI 목록에서 실측) → FE `src/utils/coords.ts`의 `isValidTourCoord`로 걸러 쓴다. 그대로 `0`을 주셔도 되고 `null`로 주시면 더 좋다.
- `mapx`=경도 / `mapy`=위도 규약을 POI 목록과 **동일하게** 유지해 주세요(뒤바뀌면 마커가 바다에 찍힌다).

### 이 요청이 반영되면

지오코딩 폴백을 제거하고(카카오 로컬 의존·오류 좌표 위험 제거) 컬렉션→플래너 진입에서 지도가 처음부터 정확히 그려진다. F3·F5·F6의 품질 전제가 해결된다.

---

## R3. 내 찜(POI 좋아요) 상태 **조회** 경로 (추적표 #9)

### 현상 (실측)

쓰기는 정상이고 **읽기 경로만 없다.**

- `controller/PoiController.java` 매핑은 3개뿐 — `GET /poi`(`:31`) · `GET /poi/{contentId}`(`:40`) · `POST /poi/{contentId}/like`(`:46`).
- 응답 DTO에 찜 관련 필드가 없다 — `dto/PoiCurationItemDto.java:11~17`, `dto/PoiDetailResponseDto.java:12~25` 둘 다 `liked`·`likes` 없음.
- 리포지토리에는 **필요한 메서드가 이미 선언돼 있는데 아무도 쓰지 않는다** — `repository/UserPoiLikeRepository.java:10` `existsByUserIdAndContentId(Long, Long)`(전 소스 grep 결과 호출처 0곳).
- 토글 자체는 진짜 토글이다 — `service/PoiLikeServiceImpl.java:37~` 기존 행이 있으면 `delete`+`decrementLikes`→`liked:false`, 없으면 저장+`incrementLikes`→`liked:true`.

### 결과 (사용자 관점) — 이게 실제 버그로 보인다

FE의 찜 상태는 **메모리 전용**이라 새로고침하면 비어 있다. 그래서:

1. 어떤 POI를 찜한다 → 하트가 채워진다(정상, 서버에도 저장됨).
2. **새로고침한다 → 하트가 빈 상태로 보인다**(서버엔 찜이 남아 있는데 FE가 알 방법이 없다).
3. 사용자가 "찜하려고" 그 하트를 누른다 → 서버는 기존 행을 발견하고 **찜을 해제**한다.

즉 사용자에게는 "찜이 안 된다 / 하트가 멋대로 꺼진다"로 보인다.

> 참고: 이전에 보고된 "좋아요가 추가만 된다" 증상의 원인은 백엔드 저장 유실 버그였고 `6e4e682`(2026-08-16)로 **이미 수정됐다.** 위 3단계는 그와 별개로 남아 있는 **조회 경로 부재** 문제다.

### FE가 하지 않기로 한 것

`localStorage`로 찜 상태를 흉내내는 방법은 **채택하지 않았다.** 다른 기기·다른 브라우저에서 찜한 내역과 어긋나고, 서버 진실과 다른 화면을 만들기 때문이다. 대신 토글 응답의 `liked`가 낙관적 기대와 다를 때 toast로 알린다("이미 찜한 곳이어서 찜을 해제했어요"). 이건 **미봉책이고, 조회 경로가 정답이다.**

### 요청안 (택 1, ㉯ 권장)

| 안 | 내용 | 장점 | 단점 |
|:-:|------|------|------|
| ㉮ | `GET /poi/likes` — 내가 찜한 `contentId[]` 반환(인증 필수) | 목록·상세와 무관하게 한 번에 주입. 호출 1회 | "내 찜 목록" 화면이 없는 지금은 FE가 전량을 받아 들고 있어야 함 |
| **㉯ (권장)** | `GET /poi` · `GET /poi/{contentId}` 응답에 **`liked`**(선택적으로 `likes`) 추가. **인증 헤더가 있을 때만 채우고, 없으면 `false`/`null`** | 보이는 화면에 필요한 만큼만. 추가 호출 0회. FE 주입 지점이 이미 있음 | 두 엔드포인트가 인증 선택(optional auth)을 다뤄야 함 |

둘 다 주시면 가장 좋다(㉯로 화면을 맞추고, ㉮로 향후 "내 찜 목록" 화면을 만든다).

### ㉯ 구현 힌트

- 두 엔드포인트는 현재 `permitAll`이라 **토큰이 있으면 SecurityContext에 인증이 들어온다.** 컨트롤러 시그니처에 `Authentication authentication`을 추가하고 `null`이면 미로그인으로 처리하면 된다(`PoiController.java:46`의 `toggleLike`가 이미 `Authentication`을 받는 패턴).
- 사용자 해석은 기존과 동일하게 email → `userRepository.findByEmailAndDeletedAtIsNull`(`PoiLikeServiceImpl.java:34~35` 패턴).
- 판정은 **이미 있는** `UserPoiLikeRepository.existsByUserIdAndContentId`를 쓰면 된다. 목록은 N+1을 피하려면 `contentId IN (...)`로 한 번에 조회하는 메서드를 추가하는 편이 좋다.
- **비로그인 응답 스키마는 바뀌지 않게** 부탁드린다(`liked:false` 또는 `null`). FE는 미로그인에서 하트를 눌러도 서버를 호출하지 않고 로그인 게이트를 띄운다.

### 이 요청이 반영되면

FE는 `src/stores/poiLikeStore.ts`(`setLiked`/`reset` 이미 있음)에 **초기 상태 주입만** 추가한다. 구조 변경이 없다. 새로고침·재접속 후에도 하트가 서버 진실과 일치하고, "누르면 꺼지는" 증상이 사라진다.

---

## 부록 A. 이미 확정된 제약 (요청 아님 · 참고용)

FE가 확인을 끝내고 **현재 설계를 받아들인** 항목들이다. 되돌릴 필요는 없고, 배경으로만 참고해 주세요.

- **`durationMinutes`·`cost` 영속 = 저장된다**(추적표 #5). `TourCourseUpdateRequestDto.PlaceUpdate`에 두 필드가 있고 `updateCourse`가 `TourCourseUserDefinedDetail`로 저장, 조회 시 저장값 우선(`resolveCost`). 무시되는 건 `contentName`·`thumbnailImg`·`operatingHours`(TourAPI 라이브 재조립)뿐 — 이건 합리적이라 FE도 계약대로 보내고 그 값을 신뢰하지 않는다.
- **`avgPrice`는 목록·상세 모두 항상 `null`**(백엔드 TODO `BOQ14`). FE는 가격 `0`을 '무료'가 아니라 **'가격 미정'**으로 표기하고, 예산은 사용자 입력(override) 기준으로 계산한다. 근거 데이터가 생기면 알려 주세요.
- **`GET /poi`에 `theme` 파라미터 없음.** 테마 기반 큐레이션은 하지 않는다(FE도 UI를 걸지 않았다).
- **동시 호출 시 503**(TourAPI 라이브 조회). FE가 in-flight dedup + contentId 단위 캐시로 완화 중.

## 부록 B. 우선순위 낮은 후보 (판단만 부탁 · 지금 요청은 아님)

**코스의 `transport`·교통비 영속**(추적표 #6). 현재 `transport`는 생성 시 1회 저장되고 **수정 경로가 없으며**(PATCH는 `/{id}`(schedule)·`/{id}/title`·`/{id}/assign` 셋뿐, `TourCourseUpdateRequestDto`에 필드 없음), 교통비는 백엔드 0.5.9에서 산정·저장을 FE 전담으로 이전했다.

→ FE는 이동수단·교통비 변경을 **세션 내 계산·표시로만** 처리하고 `dirty`를 세우지 않는다(저장 버튼이 "저장됨"이라고 거짓말하지 않게). 사용자가 코스를 다시 열면 편집한 이동수단은 생성 시 값으로 돌아간다.

**질문**: 이 유실을 허용할지, 아니면 ①`transport` 수정 경로 ②코스 단위 교통비 필드를 추가할지 판단만 주시면 FE가 그에 맞춰 UI 문구를 정리한다. (현재도 화면에 "이동수단·교통비 변경은 아직 코스에 저장되지 않아요"를 명시해 두었다.)

---

## 회신 양식 (이 표만 채워 주시면 됩니다)

| # | 요청 | 수용? | 선택안 | 예정 버전/일정 | 메모 |
|:-:|------|:----:|--------|----------------|------|
| R1 | `userId` 획득 경로 | ☐ 예 / ☐ 아니오 | ① / ② / ③ | | |
| R2 | 코스 장소 좌표 | **☑ 예** | — | **0.6.3 반영 완료**(`cd6c7ec`) | 상세·공개뷰만. 생성(GBC010)은 미적용 — FE 가 추가 요청 안 함 |
| R3 | 찜 상태 조회 | **☑ 예(예정)** | ㉯ 예상 | 미정 | 구두 회신 "추가될 예정". 도착 시 FE 는 초기 주입만 추가 |
| B | `transport`·교통비 영속 | ☐ 추가 / ☐ 현행 유지 | — | | |

스키마가 확정되면 FE는 `docs/FE_계약_추적표.md`에 반영하고 해당 Task를 착수한다.
