# 경북 CoCo

> 경상북도 여행을 위한 스마트 일정·예산 플래너 (프런트엔드).

목적지·일정·인원·테마를 한 줄로 골라 여행 코스를 생성하고, 마음에 든 코스를 컬렉션으로 보관한다. 카카오 로그인으로 시작한다.

## 주요 기능

- 메인 검색: 목적지 / 일정(범위 선택) / 인원 / 테마(복수 선택) 통합 검색 UI
- 플래너: 여행 일정 작성 (개발 중)
- 컬렉션: 저장한 코스 모음 (개발 중)
- 카카오 OAuth 로그인
- light / dark 테마 토글, Pretendard 폰트, 모바일·데스크톱 반응형

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | React 19, TypeScript 6 |
| 빌드 도구 | Vite 8 |
| 라우팅 | react-router-dom 7 (`createBrowserRouter` + 도메인 라우터 spread) |
| 상태 관리 | Zustand 5 |
| 스타일 | Tailwind CSS v4, daisyUI 5 |
| HTTP | axios 1 |
| 인증 | react-kakao-login |
| 아이콘 | lucide-react |
| 날짜 | react-datepicker, react-day-picker |
| 린트·포맷 | ESLint 10, Prettier 3, prettier-plugin-tailwindcss |

## 요구 환경

- **Node.js** ≥ 20 (Vite 8 권장)
- **npm** 10+ (lockfile 기준 — yarn/pnpm 전환 금지)
- OS: Windows 11 / macOS / Linux 모두 가능 (개발은 주로 Windows + PowerShell 7)

## 설치

```bash
git clone <repo-url>
cd Gyeongbuk-CoCo
npm install
```

## 환경 변수

`.env.development` 파일을 루트에 생성한다 (Vite는 `VITE_` 접두사만 클라이언트에 노출).

```env
VITE_KAKAO_JAVASCRIPT_KEY=<카카오 디벨로퍼스에서 발급받은 JavaScript 키>
VITE_REDIRECT_URI=http://localhost:5173
```

키가 비어 있으면 카카오 로그인 버튼이 에러 메시지로 대체된다. 키 값은 절대 커밋하지 않는다.

## 실행

```bash
npm run dev          # 개발 서버 (기본 http://localhost:5173)
npm run build        # 타입 검사 + 프로덕션 빌드 (dist/)
npm run preview      # 빌드 결과 로컬 미리보기
npm run lint         # ESLint 전체 검사
```

테스트 러너는 아직 도입되지 않았다.

## 디렉터리 구조 (요약)

```
src/
├── api/              # axios 모듈 (예정)
├── components/
│   ├── auth/         # 카카오 로그인 등 인증 위젯
│   ├── common/       # Loading, ThemeController
│   └── layout/       # Header, Footer, Layout, NotFound
├── hooks/            # 커스텀 훅 (예정)
├── pages/
│   ├── Auth/         # Login, Register
│   ├── Collection/   # 컬렉션
│   ├── Planner/      # 플래너
│   └── Index.tsx     # 메인
├── routes/           # createBrowserRouter + 도메인 라우터
├── stores/           # Zustand (themeStore)
├── utils/            # cn 등 순수 유틸
└── index.css         # Tailwind v4 + daisyUI + @theme 토큰
```

## 문서

| 문서 | 내용 |
| --- | --- |
| [docs/PRD.md](./docs/PRD.md) | 제품 기획서 (제안서 기반 비전·기능·데이터 활용) |
| [CLAUDE.md](./CLAUDE.md) | Claude Code 작업 지침 (AI 우선) |
| [CONVENTION.md](./CONVENTION.md) | 코딩 컨벤션 (네이밍·임포트·금지 패턴) |
| [DESIGN.md](./DESIGN.md) | 디자인 시스템 (색·타이포·컴포넌트 패턴) |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 브랜치 전략·커밋·PR 규칙 |

## 라이선스

내부 프로젝트. 추후 확정.
