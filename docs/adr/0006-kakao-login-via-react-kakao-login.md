# 0006. 카카오 OAuth는 react-kakao-login 사용

- 상태: Accepted
- 결정일: 2026-05-09
- 결정자: 프런트엔드 팀

## 맥락

- 1차 로그인 수단은 카카오. (한국 사용자 대상 서비스)
- 백엔드 API가 아직 정비 중이라, 우선 클라이언트 사이드 OAuth로 access token만 확보해 두는 단계.
- 별도 UI를 만들지 않고 카카오 가이드라인을 따른 버튼이 빨리 필요.

## 고려한 대안

- **직접 구현 (Kakao JavaScript SDK 호출)** — 가장 가볍지만 SDK 초기화·콜백 처리·React 통합을 직접 짜야 한다.
- **react-kakao-login** — 위 SDK를 얇게 감싼 React 컴포넌트. `token`(JS 키)·`onSuccess`·`onFail`·`render` props만으로 통합.
- **NextAuth/Auth.js 등 범용 라이브러리** — Next 친화적이고 SSR 가정. SPA + Vite 환경엔 과한 의존성.

## 결정

**`react-kakao-login`** 채택. JS 키는 `.env.development`의 `VITE_KAKAO_JAVASCRIPT_KEY`에서 주입. 성공 시 access token을 `localStorage['kakao_access_token']`에 저장하고 `/`로 navigate.

코드: `src/components/auth/KakoLoginComponent.tsx`.

## 결과

긍정적:
- 카카오 브랜드 가이드라인을 만족하는 버튼을 짧은 코드로 노출.
- 환경 변수 부재 시 fallback alert를 자연스럽게 그릴 수 있다.

부정적:
- access token을 `localStorage`에 저장하는 것은 XSS에 약하다. 백엔드 토큰 교환·HttpOnly 쿠키 흐름이 정해지면 본 ADR을 *Superseded*로 전환해야 한다.
- 라이브러리 유지보수 상태에 의존 — 향후 카카오 SDK 변경 시 fork 또는 직접 구현으로 전환할 가능성이 있다.

후속:
- 백엔드와의 토큰 교환·세션 정책이 정해지면 후속 ADR을 추가해 본 결정을 갱신/대체.
- 운영 코드에 남아 있는 `console.log` 토큰 출력은 흐름 정식화 시 제거.
