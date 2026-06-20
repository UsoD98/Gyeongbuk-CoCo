import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import AuthField from '@/components/auth/AuthField.tsx';
import AuthScreen from '@/components/auth/AuthScreen.tsx';
import { cn } from '@/utils/cn.ts';

type Errors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string, confirmPassword: string) {
  const next: Errors = {};

  if (!email.trim()) next.email = '이메일을 입력해 주세요.';
  else if (!emailPattern.test(email))
    next.email = '이메일 형식이 올바르지 않습니다.';

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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(email, password, confirmPassword);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    console.log('Register attempt:', { email, password, confirmPassword });
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

      <button
        className={cn('btn w-full border-0 font-extrabold btn-lg')}
        style={{ background: '#FEE500', color: '#181600' }}
        type="button"
      >
        카카오로 시작하기
      </button>

      <div className="text-subtle flex items-center gap-2.5">
        <div className="h-px grow bg-base-300" />
        <span className="text-[11px]">또는</span>
        <div className="h-px grow bg-base-300" />
      </div>

      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
        <AuthField
          icon={<span className="text-subtle">👤</span>}
          placeholder="이메일"
          type="email"
          value={email}
          onChange={setEmail}
        />
        {errors.email ? (
          <p className="text-xs text-error">{errors.email}</p>
        ) : null}

        <AuthField
          icon={<span className="text-subtle">🔒</span>}
          placeholder="비밀번호"
          type="password"
          value={password}
          onChange={setPassword}
        />
        {errors.password ? (
          <p className="text-xs text-error">{errors.password}</p>
        ) : null}

        <AuthField
          icon={<span className="text-subtle">🔒</span>}
          placeholder="비밀번호 확인"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        {errors.confirmPassword ? (
          <p className="text-xs text-error">{errors.confirmPassword}</p>
        ) : null}

        <button type="submit" className={cn('btn w-full btn-outline')}>
          이메일로 가입
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
