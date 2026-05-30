# 경북 CoCo — 프런트엔드 ↔ 백엔드 API 계약 협의 문서

> **목적**: FE 팀이 PRD·ADR 기준으로 백엔드에 필요한 API를 **제안**하고, 백엔드 팀과 엔드포인트·스키마·정책을 **협의·확정**하기 위한 문서.
> **상태**: 🟡 제안(Draft) — 백엔드 검토 전. 합의된 항목은 ✅, 협의 필요 항목은 ❓로 표기.
> 기준일 2026-05-30 · 작성: 프런트엔드 팀 · 근거: [PRD](./PRD.md), [ADR 0007](./adr/0007-backend-db-ownership.md)~[0010](./adr/0010-auth-gating-policy.md).

---

## 0. 역할 경계 (ADR 0007 합의)

| 책임 | 주체 |
| --- | --- |
| 관광공사 OpenAPI 호출·키 관리 | **백엔드** |
| DB 적재, 월 1회 주기 수집 | **백엔드** |
| 음식점 평균 식비·숙박 요금 메타데이터 가공 | **백엔드** |
| 인원 버킷(1/2/3~4) 분류 | **백엔드** |
| MapX/Y 기반 동선·교통비 추정 | **백엔드** |
| 위 가공 결과를 REST API로 제공 | **백엔드** |
| API 응답 표시·코스 빌더·예산 합산·공유 UI | **프런트엔드** |

> FE는 관광공사 API를 **직접 호출하지 않는다.** 자체 백엔드 API만 소비한다.
> FE 환경변수는 `VITE_API_BASE_URL` 정도. 관광공사 키는 FE에 두지 않는다.

---

## 1. 협의가 필요한 핵심 질문 (백엔드 팀 회신 요청)

1. **❓ 인증 방식** — 카카오 OAuth 토큰을 FE→BE에 어떻게 전달하나? (Bearer JWT / 세션 쿠키 / 카카오 access token 검증 프록시)
2. **❓ 인원 버킷 분류 기준** — 숙박 수용인원 기준 1·2·4인 분류 규칙과 추천 쿼리의 `partyBucket`(`1|2|'3-4'`) 매핑이 일치하는가?
3. **❓ 객단가 단위·통화** — 금액 필드는 KRW 정수(원)로 통일하는가? 1인 기준인가 그룹 총액인가?
4. **❓ 교통비 추정** — 어떤 입력(코스 POI 순서)을 받아 어떤 형태(구간별/총액)로 돌려주나? 동기 계산인가 별도 엔드포인트인가?
5. **❓ 공유 영속성** — 서버 저장(ADR 0009 목표 B) 채택 시 공유 생성/조회 엔드포인트와 단축 ID 규칙. (FE는 그 전까지 URL 인코딩으로 임시 운영)
6. **❓ 컬렉션 저장** — 서버 저장 스키마와, 게스트 localStorage 저장분을 로그인 시 병합하는 정책.
7. **❓ 페이지네이션·정렬** — 목록 응답의 페이징 방식(offset/cursor)과 기본 정렬 기준.
8. **❓ 에러 포맷** — 공통 에러 응답 스키마(코드·메시지·필드)와 HTTP 상태 코드 정책.
9. **❓ 운영시간 데이터** — `detailIntro`의 운영시간을 어떤 정규화 형태(요일별 open/close)로 내려주나?

---

## 2. 제안 엔드포인트 (FE 초안 — 협의 대상)

> 경로·필드명은 제안값이며 백엔드 컨벤션에 맞춰 조정 가능. 핵심은 **FE가 필요로 하는 데이터 형태**다.

### 2.1 POI 검색 / 추천 — F1·F2

```
GET /api/pois
  query:
    region:      string[]   # 시군구 코드 (예: gyeongju, pohang) — 다중
    partyBucket: 1 | 2 | "3-4"
    themes:      string[]    # culture, food, relax, adventure ...
    startDate:   YYYY-MM-DD
    endDate:     YYYY-MM-DD
    page/cursor: ❓
```

응답 (FE 소비 형태 제안):

```jsonc
{
  "items": [
    {
      "id": "string",
      "contentTypeId": 12,          // 12 관광지·14 문화시설·32 숙박·39 음식점
      "name": "string",
      "category": "string",
      "address": "string",
      "mapX": 129.224,              // 경도
      "mapY": 35.842,               // 위도
      "thumbnail": "https://...",
      "partyFit": [1, 2],           // 적합 인원 버킷 (백엔드 분류 결과)
      "avgCost": {                  // 1인 기준 객단가 (KRW, 정수)
        "type": "meal|lodging|admission",
        "amount": 12000,
        "editable": true           // 사용자 수정 가능 여부 (PRD OQ4)
      },
      "openingHours": [             // 운영시간 (정규화) ❓
        { "day": "mon", "open": "09:00", "close": "18:00" }
      ]
    }
  ],
  "page": { /* ❓ paging meta */ }
}
```

### 2.2 기본 추천 코스 — F2

```
GET /api/courses/recommended
  query: region[], partyBucket, themes[], startDate, endDate
```

```jsonc
{
  "courses": [
    {
      "id": "string",
      "title": "경주 1박 2일 도보 코스",
      "items": [
        { "poiId": "string", "order": 1, "day": 1, "plannedTime": "10:00" }
      ]
    }
  ]
}
```

### 2.3 교통비 추정 — F2 예산

```
POST /api/budget/transport
  body: { "poiOrder": ["poiId1", "poiId2", ...], "partySize": 3 }
```

```jsonc
{
  "segments": [
    { "from": "poiId1", "to": "poiId2", "distanceKm": 12.4, "estimatedFare": 8000 }
  ],
  "total": 16000                    // KRW
}
```

> 예산 합산(숙박·식비·입장료 + 위 교통비)과 1인당 분배(÷ 실제 인원 `n`)는 **FE가 수행**. 백엔드는 항목별 단가/추정치만 제공.

### 2.4 공유 (ADR 0009 목표 B — 서버 저장 전환 시)

```
POST /api/shares          body: { course, budget, v: 1 }   → { "shareId": "abc123" }
GET  /api/shares/:shareId                                  → { course, budget, v }
```

> 전환 전까지 FE는 동일 직렬화 페이로드(`v` 포함)를 URL에 인코딩해 임시 운영.

### 2.5 컬렉션 (인증 필요 — ADR 0010)

```
GET    /api/collections                 # 내 저장 코스 목록
POST   /api/collections   body: { course }
DELETE /api/collections/:id
```

> 전환 전까지 FE는 localStorage에 저장. 로그인 시 로컬분 병합 정책 ❓.

---

## 3. 공통 규약 제안

- **Base URL**: FE는 `VITE_API_BASE_URL`로 주입.
- **금액**: 모든 금액은 **KRW 정수(원)**, 음수 없음. (협의: 1인 기준 vs 총액 — §1.3)
- **좌표**: `mapX`=경도(lng), `mapY`=위도(lat) — 관광공사 표기 따름.
- **날짜**: `YYYY-MM-DD`, 시각은 `HH:mm` (24h).
- **에러 포맷(제안)**:
  ```jsonc
  { "error": { "code": "INVALID_REGION", "message": "…", "field": "region" } }
  ```
- **인증 헤더(제안)**: `Authorization: Bearer <token>` — §1.1 확정 후 고정.
- **CORS**: FE origin(개발 `http://localhost:5173`) 허용 필요.

---

## 4. 데이터 분류 매핑 (PRD §6 ② 정합 확인용)

| FE 추천 파라미터 `partyBucket` | 의미 | 백엔드 숙박 분류 기대 |
| --- | --- | --- |
| `1` | 1인 | 1인 적합(바테이블·싱글 등) |
| `2` | 2인 | 2인 적합(감성 숙소 등) |
| `'3-4'` | 3~4인(+5인 이상 포함) | 4인 적합(패밀리룸 등) |

> FE는 카운터 입력 `n`을 `toPartyBucket(n)`(`1→1`, `2→2`, `≥3→'3-4'`)으로 매핑해 전송한다([ADR 0008](./adr/0008-party-size-input-model.md)). 백엔드 분류 기준이 이와 다르면 §1.2에서 조정.

---

## 5. 회신 방법

- 각 ❓ 항목에 대해 이 문서에 코멘트/PR 또는 별도 회신.
- 합의된 스키마는 본 문서에서 ✅로 갱신하고, FE는 그에 맞춰 `src/api/` 타입·클라이언트를 구현한다.
- 변경 이력은 이 문서 상단 상태 표기와 ADR(필요 시 신규 ADR)로 추적한다.
