# 경북 CoCo

> 경상북도 여행을 위한 스마트 일정·예산 플래너 (프런트엔드). **v1.0 배포 완료.**

목적지·일정·인원·테마를 한 줄로 골라 여행 코스를 생성하고, 지도 위에서 코스를 편집하며,
1인당 예산을 실시간으로 계산하고, 마음에 든 코스를 컬렉션에 보관한다. 카카오 로그인으로 시작한다.

## 주요 기능

- **메인 검색** — 목적지(시군구) / 일정(범위 선택) / 인원 / 테마(복수 선택) 통합 검색
- **플래너** — 코스 생성·편집. 장소 추가·삭제, 드래그 순서 변경(`@dnd-kit`), 체류시간·금액 인라인 편집, Day 탭
- **지도 연동** — 카카오맵 위 코스 마커 토글로 장소를 코스에 담고 뺀다. 마커 겹침 회피·컨트롤 회피 포함
- **예산** — 항목별 비용 합산 + 1인당 금액 실시간 계산. 카카오페이 1/N 정산 링크 연결
- **컬렉션** — 저장한 코스 목록·삭제, 코스 공유 링크(`/share/:courseId`)
- **마이페이지** — 닉네임·비밀번호 변경, 회원 탈퇴, 찜한 장소
- **인증** — 카카오 OAuth + 자체 로그인/회원가입, 401 자동 토큰 재발급
- **반응형** — 모바일(390px)~데스크톱 대응, light/dark 테마 토글, Pretendard dynamic subset

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | React 19, TypeScript 6 |
| 빌드 도구 | Vite 8 |
| 라우팅 | react-router-dom 7 (`createBrowserRouter` + 도메인 라우터 spread) |
| 상태 관리 | Zustand 5 |
| 스타일 | Tailwind CSS v4 (CSS 기반 설정), daisyUI 5 |
| HTTP | axios 1 (토큰 주입·401 재발급 인터셉터) |
| 인증 | react-kakao-login |
| 드래그앤드롭 | @dnd-kit (core · sortable · utilities) |
| 지도 | 카카오맵 JavaScript SDK |
| 아이콘 | lucide-react |
| 날짜 | react-datepicker, react-day-picker |
| 린트·포맷 | ESLint 10, Prettier 3, prettier-plugin-tailwindcss |
| 배포 | Netlify (`netlify.toml` — `/api/*` 프록시 + SPA fallback) |

## 요구 환경

- **Node.js** ≥ 20 (Vite 8 권장)
- **npm** 10+ (lockfile 기준 — yarn/pnpm 전환 금지)
- OS: Windows 11 / macOS / Linux 모두 가능 (개발은 주로 Windows + PowerShell 7)

## 설치

```bash
git clone <repo-url>
cd Gyeongbuk-CoCo/front
npm install
```

## 환경 변수

`.env.development` 파일을 `front/` 루트에 생성한다 (Vite는 `VITE_` 접두사만 클라이언트에 노출).

```env
VITE_KAKAO_JAVASCRIPT_KEY=<카카오 디벨로퍼스 JavaScript 키>
VITE_REDIRECT_URI=http://localhost:5173
VITE_API_BASE_URL=<백엔드 API 베이스 URL>
VITE_KAKAO_PAY_URI=<카카오페이 1/N 정산하기 링크>   # 선택 — 없으면 정산 UI가 숨겨진다
```

- 카카오 키가 비어 있으면 카카오 로그인 버튼이 에러 메시지로 대체된다.
- **`.env*` 는 절대 커밋하지 않는다** (`.gitignore` 등록됨).

## 실행

```bash
npm run dev          # 개발 서버 (기본 http://localhost:5173)
npm run build        # 타입 검사 + 프로덕션 빌드 (dist/)
npm run preview      # 빌드 결과 로컬 미리보기
npm run lint         # ESLint 전체 검사
```

테스트 러너는 도입되지 않았다. UI 변경은 `npm run dev`로 모바일·데스크톱 폭 모두 확인한다.

## 디렉터리 구조 (요약)

```
src/
├── api/              # axios 모듈 (client · auth · user · tourCourse · poi · types)
├── components/
│   ├── auth/         # 카카오 로그인 등 인증 위젯
│   ├── common/       # Loading, ThemeController, EmptyState/ErrorState/Skeleton, Toast
│   ├── layout/       # Header, Footer, Layout, NotFound
│   ├── planner/      # 코스·지도·예산 패널
│   └── user/         # 마이페이지 위젯
├── hooks/            # useAsync + useCourse*/usePoi*/useUser 계열
├── mocks/            # 플래너 목업 데이터
├── pages/
│   ├── Auth/         # Login, Register
│   ├── Collection/   # 컬렉션
│   ├── Planner/      # 플래너 워크스페이스
│   ├── Share/        # 코스 공유 뷰
│   ├── User/         # 마이페이지
│   ├── About.tsx     # 소개
│   └── Index.tsx     # 메인 검색
├── routes/           # createBrowserRouter + 도메인 라우터(auth·planner·collection·user·share)
├── stores/           # Zustand (auth · planner · theme · toast · poiLike · sigungu · travelTheme · loginGate)
├── utils/            # cn · budget · coords · kakaoMap/Share/Pay · format 등 순수 유틸
└── index.css         # Tailwind v4 + daisyUI + @theme 토큰 (전역 CSS는 여기만)
```

## 문서

| 문서 | 내용 |
| --- | --- |
| [CLAUDE.md](./CLAUDE.md) | Claude Code 작업 지침 (AI 우선) |
| [CONVENTION.md](./CONVENTION.md) | 코딩 컨벤션 (네이밍·임포트·금지 패턴) |
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 (색·타이포·컴포넌트 패턴) |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 브랜치 전략·커밋·PR 규칙 |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | 구현 과정에서 내린 주요 설계 결정과 근거 |
| [docs/FE_계약_추적표.md](./docs/FE_계약_추적표.md) | FE ↔ BE 계약 추적 (400/빈결과 시 여기부터) |
| [docs/FE_개발_진행상황.md](./docs/FE_개발_진행상황.md) | v1.1 백로그 (남은 작업) |
| [docs/openapi.yaml](./docs/openapi.yaml) | API 스펙 (GBC001~020) |
| [docs/archive/](./docs/archive/) | 기획 단계 산출물 (PRD·기능 분해도) — 보존용, 갱신하지 않음 |

## 라이선스

내부 프로젝트. 추후 확정.
