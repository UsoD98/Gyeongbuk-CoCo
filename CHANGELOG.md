# CHANGELOG

본 프로젝트의 모든 사용자 영향 변경을 기록한다. 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 1.1.0, 버전 정책은 [SemVer](https://semver.org/lang/ko/) 2.0.0.

기록 단위:
- `Added` 새 기능
- `Changed` 기존 기능 동작 변경
- `Deprecated` 곧 제거될 기능
- `Removed` 제거된 기능
- `Fixed` 버그 수정
- `Security` 보안 관련

---

## [Unreleased]

### Added
- 작업 중인 변경은 머지 시 이 섹션에 항목으로 추가한다.

---

## [0.1.0] - 2026-05-16

초기 프로토타입. 기본 셸과 메인 검색 UI까지.

### Added
- 프로젝트 셋업: Vite 8 + React 19 + TypeScript 6, ESLint·Prettier 구성, 절대 경로 `@/` 별칭.
- 스타일링 인프라: Tailwind v4 + daisyUI 5, Pretendard 폰트, `@theme` 기반 primary/secondary 팔레트 50–900 토큰화, `cn()` 유틸.
- 라우팅: `createBrowserRouter` + 도메인별 `RouteObject[]` spread 패턴 (`authRouter`, `plannerRouter`, `collectionRouter`).
- 레이아웃: `Layout`(Header + main + Footer) 반응형 컨테이너 — 모바일 햄버거 드로어, 데스크톱 가로 탭.
- 인증: 카카오 OAuth 로그인 위젯(`react-kakao-login`), `localStorage`에 `kakao_access_token` 저장.
- 상태 관리: Zustand `themeStore` — light/dark 토글, `localStorage` 영속화, `data-theme` 즉시 반영.
- 페이지: Index(메인 검색 바 — 목적지/일정/인원/테마), Home, About, Login, Register, Planner, Collection 골격.
- 메인 검색 UI: `react-datepicker` 범위 선택, 다중 테마 선택, 외부 클릭/Escape로 드롭다운 닫힘.

### Changed
- 검색 바·네비게이션을 모바일 우선 반응형으로 재구성 (commit `a1339d9`).

---

[Unreleased]: ../../compare/v0.1.0...HEAD
[0.1.0]: ../../releases/tag/v0.1.0
