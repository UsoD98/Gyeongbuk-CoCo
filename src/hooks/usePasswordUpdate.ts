import { useCallback, useState } from 'react';

import { getApiErrorMessage } from '@/api/types.ts';
import { updatePassword } from '@/api/user.ts';
import type { UpdatePasswordRequest } from '@/api/user.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 비밀번호 변경(GBC008) 흐름을 캡슐화한 도메인 훅.
 *
 * 성공 여부만 반환하고, 변경 후 처리(재로그인 유도 등)는 호출부가 결정한다 —
 * 서버가 기존 토큰을 무효화하지 않으므로 "새 비번으로 다시 로그인"은 FE 정책이다.
 */
export interface PasswordUpdate {
  saving: boolean;
  /** 성공하면 true. 실패는 toast로 안내하고 false. */
  save: (request: UpdatePasswordRequest) => Promise<boolean>;
}

export function usePasswordUpdate(): PasswordUpdate {
  const userId = useAuthStore((state) => state.userId);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (request: UpdatePasswordRequest) => {
      if (saving || userId == null) return false;
      setSaving(true);
      try {
        await updatePassword(userId, request);
        return true;
      } catch (error) {
        toast.error(getApiErrorMessage(error, '비밀번호 변경에 실패했어요'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [saving, userId],
  );

  return { saving, save };
}
