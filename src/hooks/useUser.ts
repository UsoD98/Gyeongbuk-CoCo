import { useCallback } from 'react';

import { getUser } from '@/api/user.ts';
import type { UserInfo } from '@/api/user.ts';
import { useAsync } from '@/hooks/useAsync.ts';
import type { AsyncState } from '@/hooks/useAsync.ts';
import { useAuthStore } from '@/stores/authStore.ts';

/**
 * userId를 아직 확보하지 못한 상태(구버전 토큰 등)에서 쓰는 안내 문구.
 * 화면은 이 경우 API를 부르지 못하므로 재로그인을 유도한다.
 */
export const MISSING_USER_ID_MESSAGE =
  '로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요.';

/**
 * 내 회원 정보(GBC006) 로딩/에러/데이터 + 재조회를 캡슐화한 도메인 훅.
 *
 * `{userId}` 경로변수는 accessToken 클레임에서 온다(`authStore.userId`).
 * 값이 없으면 호출 자체가 불가능하므로 요청을 보내지 않고 즉시 실패시킨다
 * (서버에 의미 없는 404를 만들지 않기 위해).
 */
export function useUser(): AsyncState<UserInfo> {
  const userId = useAuthStore((state) => state.userId);

  const fetcher = useCallback(() => {
    if (userId == null) {
      return Promise.reject(new Error(MISSING_USER_ID_MESSAGE));
    }
    return getUser(userId);
  }, [userId]);

  return useAsync(fetcher);
}
