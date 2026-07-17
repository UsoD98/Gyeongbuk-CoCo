import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/utils/cn.ts';

/**
 * 목록·상세 공용 빈 상태 안내.
 * (플래너 전용 `@/components/planner/parts/EmptyState`와 별개 — 이쪽은 도메인 무관 공용이다.)
 * 아이콘은 호출부가 이미 import한 lucide 아이콘을 넘긴다(없으면 아이콘 블록을 생략).
 */
export default function EmptyState({
  icon: Icon,
  title,
  sub,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  sub?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
          <Icon size={28} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-base font-bold text-base-content">{title}</p>
        {sub && <p className="max-w-80 text-sm text-base-content/60">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
