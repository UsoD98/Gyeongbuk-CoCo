import { useCallback, useState } from 'react';

import { getApiErrorMessage } from '@/api/types.ts';
import { updateNickname } from '@/api/user.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 닉네임 수정(GBC007) 흐름을 캡슐화한 도메인 훅.
 *
 * 입력·검증 UI는 호출부(NicknameForm)가 들고, 이 훅은 서버 요청 + 진행 상태 +
 * 성공/실패 toast만 담당한다(useCourseDelete와 동일한 결).
 * 서버는 204 성격의 빈 응답을 주므로, 성공 후 최신값은 `onUpdated`(목록 reload)로 다시 읽는다.
 */
export interface NicknameUpdate {
  saving: boolean;
  save: (nickname: string, onUpdated?: () => void) => Promise<void>;
}

export function useNicknameUpdate(): NicknameUpdate {
  const userId = useAuthStore((state) => state.userId);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (nickname: string, onUpdated?: () => void) => {
      // 중복 발사 방지 + userId 없으면(구버전 토큰) 호출 불가.
      if (saving || userId == null) return;
      setSaving(true);
      try {
        await updateNickname(userId, nickname);
        toast.success('닉네임을 변경했어요');
        onUpdated?.();
      } catch (error) {
        toast.error(getApiErrorMessage(error, '닉네임 변경에 실패했어요'));
      } finally {
        setSaving(false);
      }
    },
    [saving, userId],
  );

  return { saving, save };
}
