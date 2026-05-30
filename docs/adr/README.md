# Architecture Decision Records

이 디렉터리는 경북 CoCo의 주요 기술·아키텍처 의사결정을 시간순으로 기록한다.

ADR은 *"나중에 왜 이렇게 했지?"*에 답하기 위한 문서다. 결정의 **배경**, **고려한 대안**, **선택한 이유**, **트레이드오프**를 남긴다.

## 파일 규칙

- 파일명: `NNNN-kebab-case-title.md` (4자리 일련번호, 0001부터).
- 상태: `Proposed` → `Accepted` → 후속 ADR이 덮으면 `Superseded by 00XX`.
- 양식은 아래 템플릿을 따른다.

## 새 ADR 추가 시점

- 외부 의존성을 새로 도입하거나 교체할 때.
- 폴더 구조·레이어 의존 방향·라우팅·상태 관리 같은 광역 패턴을 결정할 때.
- 되돌리기 어려운 결정(데이터 모델, 인증 흐름, 빌드 출력 형태 등).

작은 컴포넌트·스타일 결정은 ADR 대상이 아니다.

## 템플릿

```markdown
# NNNN. <짧은 제목>

- 상태: Proposed | Accepted | Superseded by 00XX
- 결정일: YYYY-MM-DD
- 결정자: <이름/팀>

## 맥락
무엇을 해결하려고 했는가. 어떤 제약·요구가 있었는가.

## 고려한 대안
- A: 장단점
- B: 장단점
- C: 장단점

## 결정
선택한 안.

## 결과
긍정적: …
부정적: …
후속 작업: …
```

## 목록

| 번호 | 제목 | 상태 |
| --- | --- | --- |
| [0001](./0001-vite-as-build-tool.md) | Vite를 빌드 도구로 채택 | Accepted |
| [0002](./0002-tailwind-v4-with-daisyui.md) | Tailwind v4 + daisyUI 스타일 시스템 | Accepted |
| [0003](./0003-zustand-as-state-manager.md) | 전역 상태 관리에 Zustand 채택 | Accepted |
| [0004](./0004-router-domain-spread-pattern.md) | 라우터는 도메인별 RouteObject[] spread로 합성 | Accepted |
| [0005](./0005-absolute-imports-via-at-alias.md) | 절대 경로 `@/` 별칭 강제 | Accepted |
| [0006](./0006-kakao-login-via-react-kakao-login.md) | 카카오 OAuth는 react-kakao-login 사용 | Accepted |
| [0007](./0007-backend-db-ownership.md) | 백엔드/DB 소유 주체와 데이터 수집 위치 | Accepted |
| [0008](./0008-party-size-input-model.md) | 인원 입력 모델 — 버킷 vs 자유 카운터 | Accepted |
| [0009](./0009-shared-course-persistence.md) | 공유 코스 영속성 — URL vs 서버 저장 | Accepted |
| [0010](./0010-auth-gating-policy.md) | 인증 게이팅 정책 (저장·공유 로그인) | Accepted |
