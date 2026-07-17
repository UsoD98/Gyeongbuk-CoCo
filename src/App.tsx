import { useEffect } from 'react';

import { reissueAccessToken } from '@/api/client.ts';
import AppRouter from '@/routes/router.tsx';
import { hasSessionHint, useAuthStore } from '@/stores/authStore.ts';

export default function App() {
  // 메모리 토큰은 새로고침으로 사라지므로, 부팅 시 refreshToken 쿠키로 1회 복원한다.
  // 성공 → setAuth가 status를 authenticated로, 실패 → guest로 확정한다.
  // 단, 로그인 힌트가 없으면(=한 번도 로그인 안 한 게스트) 보장된 401을 피해 바로 guest로 확정한다.
  useEffect(() => {
    if (!hasSessionHint()) {
      useAuthStore.getState().setStatus('guest');
      return;
    }
    let mounted = true;
    useAuthStore.getState().setStatus('loading');
    reissueAccessToken().catch(() => {
      if (mounted) useAuthStore.getState().clear();
    });
    return () => {
      mounted = false;
    };
  }, []);

  return <AppRouter />;
}
