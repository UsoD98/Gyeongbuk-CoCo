---
name: next-task
description: 경북 CoCo 프론트엔드 개발을 진행상황 보드 기준으로 한 단계 이어서 진행한다. docs/FE_개발_진행상황.md를 읽어 다음 착수할 Task를 파악하고, 사용자에게 진행 여부를 물은 뒤, 상세 사양대로 구현·검증·보드 갱신·커밋까지 수행한다. "다음 진행", "이어서 개발", "다음 할 일 해줘", "/next-task"를 요청할 때 사용.
---

# 다음 Task 진행

경북 CoCo FE 개발을 진행상황 보드 기준으로 **한 Task 진행**한다. 아래 7단계를 순서대로 따른다.
승인 없이 코드를 고치지 않는다(2단계 통과 필수).

## 1. 진행상황 파악
- **정본**: `docs/FE_개발_진행상황.md`. 항상 먼저 읽는다.
- **다음 착수 후보** = 의존(선행 Task)이 모두 `☑`이고, 상태가 `☐`(대기)이며, `⏸`(백엔드 대기)가 **아닌** Task 중 우선순위 최상위.
  - 우선순위: 메인 스파인(S1→S8)을 순차로. 그 외 병렬 후보(섬 M·섬 P)는 선행이 충족됐으면 함께 후보.
  - 의존 사슬은 `docs/FE_개발순서.md`의 "핵심 의존 사슬"과 각 Step의 **의존** 항목으로 확인한다.
- `⏸` Task(스펙 `보류`/`개발중`, 예: S8·P2·P3)는 백엔드 완료 전까지 착수하지 않는다.

## 2. 진행 여부 확인 (필수 — 코드 수정 전 게이트)
- 파악한 다음 Task(들)를 **한 줄 요약(무엇 / 의존 / DoD)** 과 함께 제시한다.
- `AskUserQuestion`으로 **진행 여부와 대상**을 묻는다. 병렬 후보가 여럿이면(예: S1 vs 섬 M vs 섬 P) 선택지로 제시하고, 추천안을 첫 번째로 둔다.
- 사용자가 특정 Task를 지목하면 그것을 우선한다. 승인 전에는 파일을 수정하지 않는다.

## 3. 상세 사양 확인 (구현 직전)
- 대상 Task 사양을 읽는다:
  - `docs/FE_개발순서.md` 해당 §Step (파일·DoD·검증)
  - `docs/FE_API_연동가이드.md` 해당 GBC 레시피 (§1 공통 선결 과제 + §3 엔드포인트별)
  - `docs/openapi.yaml` 해당 엔드포인트의 200 응답 예시
- 기존 패턴을 참조한다: `src/api/auth.ts`(API 함수 표준: `ApiResponse` 봉투 벗기기), `src/stores/*Store.ts`(Zustand), `src/components/common/*`(EmptyState·ErrorState·Skeleton), `src/hooks/useAsync.ts`(로딩/에러/데이터 캡슐화), `src/routes/*Router.tsx`.
- 규칙 문서 준수: `CLAUDE.md` · `CONVENTION.md` · `DESIGN.md`.

## 4. 구현
- **컨벤션 엄수**:
  - 모든 앱 import는 `@/` 절대경로 + `.ts`/`.tsx` 확장자. 상대경로 금지.
  - 타입 전용 import는 `import type`(verbatimModuleSyntax).
  - 2개 이상/조건부 Tailwind 클래스는 `cn()`. 템플릿 문자열 연결 금지.
  - 페이지 컴포넌트는 `React.lazy` + `<Suspense fallback={<Loading/>}>`.
  - 새 도메인 라우터는 `<domain>Router.tsx`로 `RouteObject[]` default export → `router.tsx`에서 `...spread`.
  - 파일 네이밍: 컴포넌트 `PascalCase.tsx`, 스토어 `<name>Store.ts`, 라우터 `<domain>Router.tsx`.
  - `tailwind.config.*` 생성·페이지별 `.css` 추가 금지(전역 스타일은 `src/index.css`만).
- **데이터 계층**: 로딩/빈/에러는 `hooks/useAsync` + 공용 `Skeleton`/`EmptyState`/`ErrorState` 재사용. 에러는 `getApiErrorMessage()` + `toast`.
- **목→API 전환**: UI/타입은 유지하고 데이터 소스만 교체(급격한 리라이트 금지). `@/mocks/*` import 제거는 해당 시.
- **디자인**: 테마 가변 시맨틱 토큰(`bg-base-100`, `text-base-content`, `text-base-content/60` 등). 고정색(`bg-white`, `text-gray-*`) 금지. 아이콘은 `lucide-react`, 오버레이 a11y(role/aria/Escape) 준수.
- **계약 미확정 값**(0-A: transport/sigunguCode/theme/userId): 스펙 가정 + TODO로 진행하고 `docs/FE_계약_추적표.md`를 갱신.
- **보안(조직 지침)**: `.env*`·DB 접속정보·개인정보(주민번호/전화/계정/암호 등)는 절대 커밋·로그·외부 노출 금지.

## 5. 검증
- **필수 게이트**: `npm run lint` 통과 + `npm run build`(tsc 타입검사 포함) 통과. 실패 시 원인을 고치고 재실행.
- UI 변경은 필요 시 `npm run dev`로 모바일·데스크톱 폭 모두 확인.
- **고레버리지/기반 Task**는 다차원 적대적 검증을 권장한다: 스펙 정합성·런타임 정확성·컨벤션·DoD/디자인 렌즈로 병렬 검토 → 각 지적을 적대적으로 재검증 → **확정(CONFIRMED)된 결함만 반영**. `Workflow` 도구가 열려 있으면 활용하고, 아니면 순차 자기검토로 대체한다.

## 6. 보드 갱신 (`docs/FE_개발_진행상황.md`)
- 대상 Task `☐`→`☑`(부분 완료면 `◐`). 해당 Task의 **DoD 충족**을 확인한 뒤에만 `☑`.
- "진행률 요약" 표의 그룹별 완료 개수와 **합계**를 갱신.
- "진행 로그"에 `- YYYY-MM-DD · <TaskID> 완료 · <한 줄 메모>` 추가. 상단 "최종 업데이트" 줄도 갱신.
- 계약 가정을 새로 했거나 확정됐으면 `docs/FE_계약_추적표.md`도 함께 갱신.

## 7. 커밋
- 브랜치 `develop`(기본). `main` 직접 push 금지. `git reset --hard`/`--force`는 사용자 확인 필수.
- 메시지: `<type>(<scope>) <한국어 설명>` + 본문에 무엇을 왜 했는지. 커밋 트레일러(`Co-Authored-By` 등)는 세션/리포 지침을 따른다.
- 관심사가 다르면 커밋을 분리한다(예: 계획 문서 vs 구현). 문서가 서로를 참조하면 참조 대상이 먼저/함께 커밋되도록 한다.
- `git push`는 **사용자가 요청할 때만**.

## 완료 후
- 한 일을 간결히 요약하고, **다음 착수 후보**를 제시한 뒤 이어서 진행할지 묻는다(1단계로 되돌아감).
