import React, { useState } from 'react';
import KakaoLoginComponent from '@/components/auth/KakoLoginComponent.tsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.SubmitEvent) => {
    e.preventDefault();
    // TODO: 로그인 로직 구현
    console.log('Login attempt:', { email, password });
  };

  return (
    <section className="flex min-h-[60%] items-center justify-center px-4">
      <div className=" max-w-md">
        <div className="mt-4 rounded-2xl border border-primary-50 bg-base-100 p-6 shadow-2xl">
          {/* 헤더 */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-primary">경북 CoCo</h1>
            <p className="text-sm text-base-content/60">계정에 로그인하세요</p>
          </div>

          {/* 일반 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* 이메일 입력 */}
            <div className="form-control ">
              <label className="label">
                <span className="label-text font-medium">이메일</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered focus:input-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">비밀번호</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered focus:input-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="btn btn-primary mt-6 w-full font-semibold"
            >
              로그인
            </button>
          </form>

          {/* 구분자 */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-base-300"></div>
            <span className="text-xs font-medium text-base-content/50">또는</span>
            <div className="flex-1 border-t border-base-300"></div>
          </div>

          {/* 카카오 로그인 */}
          <div className="space-y-3">
            <KakaoLoginComponent />
          </div>

          {/* 하단 링크 */}
          <div className="mt-4 text-center text-sm">
            <p className="text-base-content/60">
              계정이 없으신가요?{' '}
              <a href="/register" className="link link-primary font-semibold">
                회원가입
              </a>
            </p>
          </div>
        </div>

        {/* 추가 정보 */}
        <p className="mt-4 text-center text-xs text-base-content/40">
          서비스 약관 및 개인정보 처리방침에 동의합니다.
        </p>
      </div>
    </section>
  );
}
