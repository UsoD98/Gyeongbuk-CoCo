import { Navigate, Outlet, useLocation, type Location } from 'react-router-dom';

import Loading from '@/components/common/Loading.tsx';
import { useAuthStore } from '@/stores/authStore.ts';

/**
 * 비로그인 전용 라우트 가드(로그인·회원가입).
 * 이미 로그인 상태면 돌려보낸다. RequireAuth가 넘긴 state.from이 있으면
 * 원래 가려던 위치로, 없으면 홈으로 보낸다(로그인 핸들러의 navigate와
 * 경쟁해도 목적지가 일치하도록 동일 로직을 둔다). 부팅 복원 중에는 폼이
 * 깜빡였다가 리다이렉트되는 것을 막기 위해 Loading으로 보류한다.
 */
export default function GuestOnly() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') return <Loading />;

  if (status === 'authenticated') {
    const from = (location.state as { from?: Location } | null)?.from;
    const redirectTo = from ? from.pathname + from.search + from.hash : '/';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
