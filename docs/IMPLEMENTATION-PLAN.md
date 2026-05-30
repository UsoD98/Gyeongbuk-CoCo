# 경북 CoCo — 프런트엔드 구현 체크리스트

> 기준일 2026-05-30 · PRD v0.1 + ADR 0007~0010 확정 결과 반영.
> **전제: UI-우선 단계.** 백엔드 API 계약 확정 전까지 `src/api/` 본구현은 하지 않고, 모든 데이터는 더미/로컬로 진행한다([ADR 0007](./adr/0007-backend-db-ownership.md)).
> 백엔드와 맞춰야 할 항목은 [백엔드 협의 문서](./backend-api-contract.md) 참고.

## 확정 결정 요약

| 영역 | 결정 | 출처 |
| --- | --- | --- |
| 빌드 전략 | 백엔드 대기 / UI·인터랙션만, 데이터는 더미 | [ADR 0007](./adr/0007-backend-db-ownership.md) |
| 인원 모델 | 카운터 유지 + `n→버킷` 매핑, 1인당은 실제 `n`으로 분배 | [ADR 0008](./adr/0008-party-size-input-model.md) |
| 화면 구조 | 통합 `/planner` (좌:지도/리스트, 우:코스, 하단:예산), 모바일은 탭/시트 | PRD §3·§4 |
| 지도 SDK | `react-kakao-maps-sdk` 도입 | PRD §4 F2 |
| 예산 | 4항목(숙박·식비·입장료·교통), 교통비는 더미값(FE 계산 없음) | [ADR 0007](./adr/0007-backend-db-ownership.md) |
| 공유 | 임시 URL 인코딩 → 목표 서버 저장 | [ADR 0009](./adr/0009-shared-course-persistence.md) |
| 인증 | 하이브리드 — 저장·공유 시점 로그인 유도 | [ADR 0010](./adr/0010-auth-gating-policy.md) |
| 컬렉션 저장 | localStorage 지속(themeStore 패턴) | [ADR 0010](./adr/0010-auth-gating-policy.md) |
| 목적지 옵션 | 23개 시군구 멀티셀렉트, 데이터는 경주·포항·영덕·안동 우선 | PRD §10 OQ3 |

---

## 단계 0 — 기반 정비 (선행, 다른 단계의 전제)

- [ ] `react-kakao-maps-sdk` 설치 (`npm install react-kakao-maps-sdk`)
- [ ] 도메인 타입 정의 (`src/types/` 또는 각 store 내부)
  - [ ] `PartySize`(`number`) + `PartyBucket`(`1 | 2 | '3-4'`) + `toPartyBucket(n)` 헬퍼
  - [ ] `Poi`(id, name, contentTypeId, mapX, mapY, 운영시간, 객단가, 카테고리)
  - [ ] `Course`(id, title, items: `CourseItem[]`, partySize)
  - [ ] `BudgetBreakdown`(숙박·식비·입장료·교통 + total + perPerson)
- [ ] 경북 23개 시군구 상수 (`src/constants/regions.ts`) — value/label
- [ ] 더미 데이터 모듈 (`src/mocks/`) — 경주·포항·영덕·안동 POI + 객단가 + 운영시간
- [ ] (선택) MSW 도입 여부 결정 — 지금은 모듈 import로 충분, 계약 확정 시 재검토

## 단계 1 — F1 검색 (`src/pages/Index.tsx`)

- [ ] 목적지: 단일 드롭다운 → **23개 시군구 멀티셀렉트**로 변경 (테마 위젯 패턴 재사용)
- [ ] 더미 옵션(Inter/Poppins/Raleway) 제거 → 실제 시군구로 교체
- [ ] 데이터 없는 시군구(경주·포항·영덕·안동 외) 선택 시 "준비 중" 안내 UX
- [ ] 테마 옵션 보강(일반 테마 유지)
- [ ] 검색조건 store 신설 `src/stores/searchStore.ts` (목적지[]·기간·partySize·테마[])
- [ ] 검색 버튼 → `/planner` 이동 + 검색조건 전달
- [ ] 모바일·데스크톱 폭 확인

## 단계 2 — F2 플래너 (`src/pages/Planner/Planner.tsx`)

- [ ] 통합 레이아웃 골격: 좌(결과) / 우(코스 패널) / 하단(예산 대시보드)
- [ ] 모바일 반응형: 결과↔코스↔예산 탭 또는 바텀시트 전환
- [ ] 카카오맵 마운트(`react-kakao-maps-sdk`, `VITE_KAKAO_JAVASCRIPT_KEY`) + 더미 POI 마커
- [ ] 결과 영역 지도/리스트 토글
- [ ] 코스 store 신설 `src/stores/courseStore.ts` (코스 아이템 추가/삭제/순서)
- [ ] 기본 추천 코스(더미) 우측 패널 표시 + 커스텀/신규 코스
- [ ] POI 클릭 → '내 코스'에 추가/삭제
- [ ] 운영시간 반영: 불가능한 시간대 코스 항목 비활성/표시
- [ ] 실시간 예산 대시보드: 4항목 합산 + 총예산 + **1인당(÷ 실제 n)** 실시간 갱신
- [ ] 경로 시각화: 코스 순서대로 `Polyline` + 마커 번호
- [ ] 교통비는 더미값 표시(FE 거리 계산 없음)

## 단계 3 — F3 공유

- [ ] 코스+예산 직렬화 스키마(버전 필드 `v` 포함) — A/B 호환 설계
- [ ] 공유 라우트 `shareRouter.tsx` (`/share/:id` 또는 `/share#<payload>`) — URL 인코딩 디코드 렌더
- [ ] 카카오 공유 SDK 연동 + 메시지 템플릿(요약 카드: 코스명·총예산·1인당)
- [ ] 공유 액션에 인증 게이트(아래 단계 4) 연결

## 단계 4 — 컬렉션 + 인증

- [ ] `authStore` 신설 (UI 단계 더미/로컬 로그인 상태)
- [ ] 액션 단위 로그인 게이트 헬퍼/훅 (`requireAuth(action)`) — 저장·공유 직전 호출
- [ ] `collectionStore` 신설 (Zustand + localStorage persist, themeStore 패턴)
- [ ] `src/pages/Collection/Collection.tsx`: 저장 코스 목록/조회/삭제
- [ ] 코스 → 컬렉션 저장 액션 (게이트 경유)

## 작업 종료 전 점검 (CLAUDE.md)

- [ ] `npm run lint` 통과
- [ ] `npm run build` 통과 (TS 타입 검사 포함)
- [ ] UI 변경은 `npm run dev`로 모바일·데스크톱 폭 모두 확인
- [ ] 모든 import `@/` 절대 경로, 조건부 클래스는 `cn()`

---

## 백엔드 계약 확정 후 전환 항목 (지금 하지 않음)

- [ ] `src/api/` axios 클라이언트 본구현 (`VITE_API_BASE_URL`)
- [ ] 더미 데이터 → 실제 추천/POI/예산 API 응답으로 교체
- [ ] 공유 URL 인코딩(A) → 서버 저장 단축 ID(B) 전환
- [ ] 컬렉션 localStorage → 서버 동기화 + 게스트/로그인 병합 정책
- [ ] 더미 인증 → 실제 카카오 세션 연동

> 위 항목의 계약 요구사항은 [백엔드 협의 문서](./backend-api-contract.md)에 정리.
