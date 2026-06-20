import type { ReactNode } from 'react';

import { cn } from '@/utils/cn.ts';

type AuthFieldProps = {
  icon: ReactNode;
  placeholder: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
};

export default function AuthField({
  icon,
  placeholder,
  type = 'text',
  value,
  onChange,
}: AuthFieldProps) {
  return (
    <label
      className={cn(
        'flex h-12 items-center gap-2.5 rounded-xl border-[1.5px] border-base-300 px-3.5',
        'ring-brand',
      )}
    >
      {icon}
      <input
        className="w-full bg-transparent outline-none"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
