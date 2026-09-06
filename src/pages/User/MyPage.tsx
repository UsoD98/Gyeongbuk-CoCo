import { useNavigate } from 'react-router-dom';

import { logout as logoutApi } from '@/api/auth.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import ErrorState from '@/components/common/ErrorState.tsx';
import Skeleton from '@/components/common/Skeleton.tsx';
import DangerZone from '@/components/user/DangerZone.tsx';
import NicknameForm from '@/components/user/NicknameForm.tsx';
import PasswordForm from '@/components/user/PasswordForm.tsx';
import { MISSING_USER_ID_MESSAGE, useUser } from '@/hooks/useUser.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 마이페이지 — 닉네임 수정(GBC007)·비밀번호 변경(GBC008)·탈퇴(GBC009) 세 가지만 둔다.
 * 라우트는 `RequireAuth` 안에 있다.
 *
 * 회원 정보 조회(GBC006)는 화면에 카드로 보여 주지 않지만 계속 부른다 — 닉네임 입력의
 * 현재값(그리고 탈퇴 확인 문구의 계정 이름)이 서버 값이어야 하기 때문이다.
 *
 * 이 화면의 모든 API는 `{userId}` 경로변수를 요구하고, 그 값은 accessToken의
 * `userId` 클레임에서 온다(`authStore.userId`). 클레임이 없는 구버전 토큰이면
 * 호출 자체가 불가능하므로 재로그인을 안내한다.
 */
export default function MyPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const clearAuth = useAuthStore((state) => state.clear);
  const { data, loading, error, reload } = useUser();

  /** 인증을 비우고 로그인 화면으로. 비밀번호 변경 후·userId 부재 시 공통 경로. */
  const signOutTo = async (message: string) => {
    try {
      await logoutApi();
    } catch {
      // 서버 로그아웃이 실패해도 클라이언트 인증 상태는 비운다(헤더 로그아웃과 동일).
    }
    clearAuth();
    toast.success(message);
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-base-content">마이페이지</h1>
        <p className="text-sm text-base-content/60">
          닉네임과 비밀번호를 바꾸거나 계정을 정리할 수 있어요.
        </p>
      </header>

      {/* userId를 못 얻은 경우: API를 부를 수 없으므로 재로그인으로 유도한다. */}
      {userId == null ? (
        <ErrorState
          title="회원 정보를 불러올 수 없어요"
          description={MISSING_USER_ID_MESSAGE}
          retryLabel="다시 로그인"
          onRetry={() => void signOutTo('다시 로그인해 주세요.')}
        />
      ) : (
        <>
          {/* 최초 로딩(직전 데이터 없음): 카드 자리 스켈레톤 */}
          {loading && !data && (
            <div className="flex flex-col gap-6" aria-hidden="true">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          )}

          {/* 에러(보존된 데이터도 없을 때): 재시도 가능한 에러 상태 */}
          {!loading && !!error && !data && (
            <ErrorState
              description={getApiErrorMessage(
                error,
                '회원 정보를 불러오지 못했어요',
              )}
              onRetry={reload}
            />
          )}

          {data && (
            <>
              {/* key: 저장 성공 후 새 닉네임이 내려오면 입력 상태를 새 값으로 리셋한다. */}
              <NicknameForm
                key={data.nickname}
                currentNickname={data.nickname}
                onUpdated={reload}
              />
              <PasswordForm
                onChanged={() =>
                  void signOutTo(
                    '비밀번호를 변경했어요. 새 비밀번호로 다시 로그인해 주세요.',
                  )
                }
              />
              <DangerZone nickname={data.nickname} />
            </>
          )}
        </>
      )}
    </div>
  );
}
