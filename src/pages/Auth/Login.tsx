import { useEffect, useState, type SubmitEvent } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';

import { login } from '@/api/auth.ts';
import { SESSION_FLASH_KEY, type SessionFlash } from '@/api/client.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import AuthField from '@/components/auth/AuthField.tsx';
import AuthScreen from '@/components/auth/AuthScreen.tsx';
import KakaoLoginComponent from '@/components/auth/KakoLoginComponent.tsx';
import { useAuthStore } from '@/stores/authStore.ts';
import { toast } from '@/stores/toastStore.ts';
import { cn } from '@/utils/cn.ts';

type Errors = {
  email?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readSessionFlash(): SessionFlash | null {
  const raw = sessionStorage.getItem(SESSION_FLASH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionFlash;
  } catch {
    return null; // 손상된 flash는 무시한다.
  }
}

function validate(email: string, password: string) {
  const next: Errors = {};

  if (!email.trim()) next.email = '이메일을 입력해 주세요.';
  else if (!emailPattern.test(email))
    next.email = '이메일 형식이 올바르지 않습니다.';

  if (!password.trim()) next.password = '비밀번호를 입력해 주세요.';

  return next;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // RequireAuth가 가드로 막을 때 state.from에 원래 가려던 위치를 담아 보낸다.
  // 로그인 성공 후 그 위치로 복귀하고, 없으면(직접 로그인 진입) 홈으로 간다.
  const from = (location.state as { from?: Location } | null)?.from;
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  // 세션 만료로 하드 리다이렉트돼 온 경우, 인터셉터가 남긴 1회용 안내·복귀경로를 소비한다.
  // (풀 리로드로 toast 상태가 날아가므로 여기서 다시 띄운다.)
  // 복귀경로는 렌더 시점에 순수 read로 한 번 읽어 두고(제거하지 않음),
  // 안내 toast와 sessionStorage 정리는 effect에서 1회 수행한다.
  const [returnTo] = useState<string | null>(() => readSessionFlash()?.returnTo ?? null);
  useEffect(() => {
    const flash = readSessionFlash();
    if (!flash) return;
    sessionStorage.removeItem(SESSION_FLASH_KEY);
    if (flash.message) toast.error(flash.message);
  }, []);

  const redirectTo =
    returnTo ?? (from ? from.pathname + from.search + from.hash : '/');

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(email, password);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const { accessToken, userId } = await login({
        email: email.trim(),
        password,
      });
      setAuth(accessToken, userId);
      toast.success('로그인되었습니다.');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, '로그인에 실패했습니다.'));
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
          로그인
        </h1>
        <p className="text-muted text-sm">
          카카오 계정으로 3초 만에 로그인하세요.
        </p>
      </div>

      <KakaoLoginComponent redirectTo={redirectTo} />

      <div className="text-subtle flex items-center gap-2.5">
        <div className="h-px grow bg-base-300" />
        <span className="text-[11px]">또는</span>
        <div className="h-px grow bg-base-300" />
      </div>

      <form className="flex flex-col gap-2.5" onSubmit={handleSubmit}>
        <AuthField
          id="login-email"
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
          id="login-password"
          name="password"
          icon={<span className="text-subtle">🔒</span>}
          placeholder="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        <button
          type="submit"
          className={cn('btn w-full btn-outline')}
          disabled={submitting}
        >
          {submitting ? '로그인 중…' : '이메일로 로그인'}
        </button>
      </form>

      <p className="text-muted text-center text-[11px]">
        아직 회원이 아니신가요?{' '}
        <button
          type="button"
          className="font-bold text-primary"
          onClick={() => navigate('/auth/register')}
        >
          회원가입
        </button>
      </p>
    </AuthScreen>
  );
}
