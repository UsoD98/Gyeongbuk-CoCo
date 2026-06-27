import type { ReactNode } from 'react';

import { cn } from '@/utils/cn.ts';

type AuthFieldProps = {
  /** label-input 연결 및 에러 메시지 aria-describedby 연결에 사용하는 고유 id. */
  id: string;
  /** 폼 시맨틱 + 패스워드 매니저 인식을 위한 name. */
  name: string;
  icon: ReactNode;
  placeholder: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  /** 브라우저·패스워드 매니저 자동완성 토큰(email, current-password, new-password 등). */
  autoComplete?: string;
  /** 검증 에러 메시지. 있으면 aria-invalid 및 연결된 에러 텍스트를 렌더한다. */
  error?: string;
};

export default function AuthField({
  id,
  name,
  icon,
  placeholder,
  type = 'text',
  value,
  onChange,
  autoComplete,
  error,
}: AuthFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      {/* label로 input을 감싸 암묵적 연결 + placeholder를 접근성 이름으로도 노출(aria-label). */}
      <label
        htmlFor={id}
        className={cn(
          'flex h-12 items-center gap-2.5 rounded-xl border-[1.5px] border-base-300 px-3.5',
          'ring-brand',
          error && 'border-error',
        )}
      >
        {icon}
        <input
          id={id}
          name={name}
          className="w-full bg-transparent outline-none"
          placeholder={placeholder}
          aria-label={placeholder}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </label>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
