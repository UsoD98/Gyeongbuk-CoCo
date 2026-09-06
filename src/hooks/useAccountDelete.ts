import { useCallback, useState } from 'react';

import { getApiErrorMessage } from '@/api/types.ts';
import { deleteUser } from '@/api/user.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 회원 탈퇴(GBC009) 흐름을 캡슐화한 도메인 훅.
 *
 * 성공하면 **인증 상태를 비운다**(`authStore.clear`) — 탈퇴한 계정의 토큰이 메모리에
 * 남아 다음 요청이 500/401로 튀는 걸 막기 위해서다.
 *
 * 화면 이동은 따로 하지 않는다. 마이페이지를 감싼 `RequireAuth`가 guest 전환에 반응해
 * 로그인 화면으로 보내 준다 — 여기서 `navigate`로 다른 곳을 가리키면 가드의 리다이렉트와
 * 경쟁해 목적지가 뒤집힌다(실측: 홈으로 보내도 로그인 화면이 이긴다).
 */
export interface AccountDelete {
  deleting: boolean;
  remove: () => Promise<void>;
}

export function useAccountDelete(): AccountDelete {
  const userId = useAuthStore((state) => state.userId);
  const clearAuth = useAuthStore((state) => state.clear);
  const [deleting, setDeleting] = useState(false);

  const remove = useCallback(
    async () => {
      if (deleting || userId == null) return;
      setDeleting(true);
      try {
        await deleteUser(userId);
        clearAuth();
        toast.success('탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.');
      } catch (error) {
        toast.error(getApiErrorMessage(error, '회원 탈퇴에 실패했어요'));
      } finally {
        setDeleting(false);
      }
    },
    [deleting, userId, clearAuth],
  );

  return { deleting, remove };
}
