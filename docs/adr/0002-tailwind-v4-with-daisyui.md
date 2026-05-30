# 0002. Tailwind v4 + daisyUI 스타일 시스템

- 상태: Accepted
- 결정일: 2026-05-02
- 결정자: 프런트엔드 팀

## 맥락

- 디자인 시안은 피그마 기반, 모바일·데스크톱 반응형이 필요.
- 색·타이포·간격을 토큰화해 일관성을 유지해야 함.
- 공통 UI(버튼·네비·드롭다운)를 빠르게 깔되, 그 위에 커스텀 디자인을 얹을 여지가 있어야 함.
- light/dark 테마 가변성 필요.

## 고려한 대안

- **Tailwind v3 + daisyUI** — 검증되었지만 `tailwind.config.ts`/postcss 구성 파일이 많아 설정 표면이 넓다.
- **Tailwind v4 + daisyUI 5** — 설정이 `index.css`의 `@theme`·`@plugin` 지시어로 통합. config 파일이 사실상 없어진다. JIT가 기본.
- **CSS-in-JS (styled-components, emotion)** — 런타임 비용·번들 영향. 디자인 토큰화도 별도 작업 필요.
- **MUI / Chakra UI** — 자체 디자인 시스템이 강해 피그마 시안에 맞추기 어려움. 커스터마이즈 비용이 높다.

## 결정

**Tailwind v4 + daisyUI 5** 채택. 모든 설정은 `src/index.css`의 `@theme`·`@plugin` 블록에서 처리하고, `tailwind.config.js`는 두지 않는다.

- `@theme`에 primary/secondary 50–900 톤을 토큰화.
- 폰트는 Pretendard CDN.
- daisyUI는 시맨틱 컴포넌트 클래스(`btn`, `navbar`, `tab`, `dropdown`)와 테마(`light`, `dark` 등) 제공용으로 사용.
- 클래스 합성은 `clsx + tailwind-merge`를 묶은 `cn()` 유틸 강제.

## 결과

긍정적:
- 설정 파일이 거의 없어 신규 진입이 쉽다.
- 색·타이포 변경은 `index.css` 한 곳만 만지면 된다.
- daisyUI 컴포넌트로 기본 UI 구축이 빨랐고, 위에 `@theme` 토큰으로 브랜드 색을 덧입혔다.

부정적:
- Tailwind v4·daisyUI 5는 v3 대비 자료가 적어 일부 패턴은 시행착오가 필요.
- 임의값(`bg-[#...]`)이 늘면 토큰의 의미가 흐려진다 — 코드 리뷰에서 차단해야 한다(CONVENTION 9.2).

후속:
- 디자인 토큰의 실제 사용처는 [DESIGN.md](../../DESIGN.md)에 정리.
