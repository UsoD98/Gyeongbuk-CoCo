import { Navigate, Outlet, useLocation } from 'react-router-dom';

import Loading from '@/components/common/Loading.tsx';
import { useAuthStore } from '@/stores/authStore.ts';

/**
 * 로그인 필수 라우트 가드.
 * 부팅 복원이 끝나기 전(idle/loading)에는 판단을 보류하고 Loading을 보여준다
 * (메모리 토큰이라 새로고침 직후 잠깐 비로그인처럼 보이기 때문).
 * guest로 확정되면 로그인 페이지로 보내되, 돌아올 위치를 state.from에 담는다.
 */
export default function RequireAuth() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') return <Loading />;

  if (status === 'guest') {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
