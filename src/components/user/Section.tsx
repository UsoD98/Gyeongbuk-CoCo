import type { ReactNode } from 'react';

import { cn } from '@/utils/cn.ts';

/**
 * 마이페이지의 설정 블록 한 칸. 카드 스타일(컬렉션 카드와 동일한 결)을 한곳에 모아
 * 닉네임·비밀번호·탈퇴 섹션이 서로 다르게 보이지 않게 한다.
 */
export default function Section({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description?: string;
  /** 파괴적 영역(탈퇴)이면 테두리를 error 색으로 구분한다. */
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-2xl bg-base-100 p-5 shadow-sm ring-1',
        danger ? 'ring-error/30' : 'ring-base-200',
      )}
    >
      <div className="flex flex-col gap-1">
        <h2
          className={cn(
            'text-base font-bold',
            danger ? 'text-error' : 'text-base-content',
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-base-content/60">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
