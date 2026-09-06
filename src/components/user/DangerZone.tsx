import { useState } from 'react';

import ConfirmDialog from '@/components/common/ConfirmDialog.tsx';
import Section from '@/components/user/Section.tsx';
import { useAccountDelete } from '@/hooks/useAccountDelete.ts';

/**
 * 회원 탈퇴(GBC009) 영역.
 * 되돌릴 수 없는 액션이라 코스 삭제와 동일하게 `ConfirmDialog`(danger)로 한 번 막는다.
 * 인증 상태 정리는 훅이 하고, 로그인 화면으로 보내는 건 `RequireAuth`가 맡는다.
 */
export default function DangerZone({ nickname }: { nickname: string }) {
  const { deleting, remove } = useAccountDelete();
  const [confirming, setConfirming] = useState(false);

  return (
    <Section
      danger
      title="회원 탈퇴"
      description="탈퇴하면 이 계정으로 다시 로그인할 수 없어요."
    >
      <button
        type="button"
        className="btn h-11 btn-outline btn-error self-end"
        onClick={() => setConfirming(true)}
      >
        회원 탈퇴
      </button>

      <ConfirmDialog
        open={confirming}
        danger
        busy={deleting}
        title="정말 탈퇴하시겠어요?"
        description={`'${nickname}' 계정이 삭제되며 되돌릴 수 없어요.`}
        confirmLabel="탈퇴하기"
        onCancel={() => setConfirming(false)}
        onConfirm={() => void remove()}
      />
    </Section>
  );
}
