import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '@/api/types.ts';
import { join } from '@/api/user.ts';
import AuthField from '@/components/auth/AuthField.tsx';
import AuthScreen from '@/components/auth/AuthScreen.tsx';
import KakaoLoginComponent from '@/components/auth/KakoLoginComponent.tsx';
import { toast } from '@/stores/toastStore.ts';
import { cn } from '@/utils/cn.ts';

type Errors = {
  email?: string;
  nickname?: string;
  password?: string;
  confirmPassword?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
  email: string,
  nickname: string,
  password: string,
  confirmPassword: string,
) {
  const next: Errors = {};

  if (!email.trim()) next.email = '이메일을 입력해 주세요.';
  else if (!emailPattern.test(email))
    next.email = '이메일 형식이 올바르지 않습니다.';

  if (!nickname.trim()) next.nickname = '닉네임을 입력해 주세요.';
  else if (nickname.trim().length < 2 || nickname.trim().length > 100)
    next.nickname = '닉네임은 2자 이상 100자 이하여야 합니다.';

  if (!password.trim()) next.password = '비밀번호를 입력해 주세요.';
  else if (password.length < 8)
    next.password = '비밀번호는 8자 이상이어야 합니다.';

  if (!confirmPassword.trim())
    next.confirmPassword = '비밀번호를 다시 입력해 주세요.';
  else if (password !== confirmPassword)
    next.confirmPassword = '비밀번호가 일치하지 않습니다.';

  return next;
}

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(email, nickname, password, confirmPassword);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      // confirmPassword는 프론트 전용 검증 항목이라 join 요청에서는 제외한다.
      await join({ email: email.trim(), nickname: nickname.trim(), password });
      // toast는 Layout에 마운트돼 라우트 전환에도 유지되므로 이동 직전에 띄운다.
      toast.success('회원가입이 완료되었습니다. 로그인해 주세요.');
      navigate('/auth/login', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, '회원가입에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <button
        type="button"
        className="text-muted flex items-center gap-2"
        onClick={() => navigate('/')}
      >
        <span>←</span>홈으로
      </button>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">
          회원가입
        </h1>
        <p className="text-muted text-sm">
          카카오 계정으로 간편하게 시작하세요.
        </p>
      </div>

      <KakaoLoginComponent />

      <div className="text-subtle flex items-center gap-2.5">
        <div className="h-px grow bg-base-300" />
        <span className="text-[11px]">또는</span>
        <div className="h-px grow bg-base-300" />
      </div>

      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
        <AuthField
          id="register-email"
          name="email"
          icon={<span className="text-subtle">👤</span>}
          placeholder="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />

        <AuthField
          id="register-nickname"
          name="nickname"
          icon={<span className="text-subtle">😊</span>}
          placeholder="닉네임"
          type="text"
          autoComplete="nickname"
          value={nickname}
          onChange={setNickname}
          error={errors.nickname}
        />

        <AuthField
          id="register-password"
          name="password"
          icon={<span className="text-subtle">🔒</span>}
          placeholder="비밀번호 (8자 이상)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        <AuthField
          id="register-confirm-password"
          name="confirmPassword"
          icon={<span className="text-subtle">🔒</span>}
          placeholder="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          className={cn('btn w-full btn-outline')}
          disabled={submitting}
        >
          {submitting ? '가입 중…' : '이메일로 가입'}
        </button>
      </form>

      <p className="text-muted text-center text-[11px]">
        이미 계정이 있나요?{' '}
        <button
          type="button"
          className="font-bold text-primary"
          onClick={() => navigate('/auth/login')}
        >
          로그인
        </button>
      </p>
    </AuthScreen>
  );
}
