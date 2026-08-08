import { Outlet } from 'react-router-dom';

/**
 * 의도된 플레이스홀더(현재 라우터 미연결).
 *
 * 실제 전역 셸은 `Layout`(Header + main + Footer)이며 `router.tsx` 는 그것을 사용한다.
 * `RootLayout` 은 향후 `Layout` 상위에 도메인 공통 셸(예: 전역 프로바이더·배너)을 끼울 자리로
 * 남겨둔 뼈대라 지금은 `<Outlet/>` 만 통과시킨다.
 *
 * ⚠️ 삭제 금지(CLAUDE.md 규칙). 연결이 필요해지면 `router.tsx` 최상위 element 로 감싼다.
 */
export default function RootLayout() {
  return <Outlet />;
}
