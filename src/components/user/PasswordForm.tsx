import { useState, type SubmitEvent } from 'react';

import AuthField from '@/components/auth/AuthField.tsx';
import Section from '@/components/user/Section.tsx';
import { usePasswordUpdate } from '@/hooks/usePasswordUpdate.ts';

type Errors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

/** 백엔드 제약(새 비밀번호 8자 이상) + 회원가입 폼과 같은 확인 입력 규칙. */
function validate(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Errors {
  const next: Errors = {};

  if (!currentPassword) next.currentPassword = '현재 비밀번호를 입력해 주세요.';

  if (!newPassword) next.newPassword = '새 비밀번호를 입력해 주세요.';
  else if (newPassword.length < 8)
    next.newPassword = '비밀번호는 8자 이상이어야 합니다.';
  else if (newPassword === currentPassword)
    next.newPassword = '현재 비밀번호와 다른 비밀번호를 입력해 주세요.';

  if (!confirmPassword) next.confirmPassword = '새 비밀번호를 다시 입력해 주세요.';
  else if (newPassword !== confirmPassword)
    next.confirmPassword = '비밀번호가 일치하지 않습니다.';

  return next;
}

/**
 * 비밀번호 변경(GBC008) 폼. 서버가 현재 비밀번호를 검증한 뒤 교체한다.
 *
 * 성공 뒤 처리(재로그인 유도)는 `onChanged`로 호출부에 맡긴다 — 서버가 기존 토큰을
 * 무효화하지 않으므로 "새 비밀번호로 다시 로그인"은 FE 정책이기 때문.
 */
export default function PasswordForm({ onChanged }: { onChanged: () => void }) {
  const { saving, save } = usePasswordUpdate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(currentPassword, newPassword, confirmPassword);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const ok = await save({ currentPassword, newPassword });
    if (!ok) return;

    // 입력값은 즉시 비운다(성공 후 화면에 남겨 두지 않는다).
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onChanged();
  };

  return (
    <Section
      title="비밀번호 변경"
      description="변경하면 보안을 위해 다시 로그인해야 해요."
    >
      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
        <AuthField
          id="mypage-current-password"
          name="currentPassword"
          icon={<span className="text-subtle">🔒</span>}
          placeholder="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={errors.currentPassword}
        />
        <AuthField
          id="mypage-new-password"
          name="newPassword"
          icon={<span className="text-subtle">🔒</span>}
          placeholder="새 비밀번호 (8자 이상)"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={setNewPassword}
          error={errors.newPassword}
        />
        <AuthField
          id="mypage-confirm-password"
          name="confirmPassword"
          icon={<span className="text-subtle">🔒</span>}
          placeholder="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />
        <button
          type="submit"
          className="btn h-11 btn-primary self-end"
          disabled={saving}
        >
          {saving && <span className="loading loading-spinner loading-sm" />}
          {saving ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>
    </Section>
  );
}
