import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** 빈 목록·준비중 영역 안내 */
export default function EmptyState({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200 text-base-content/40">
        <Icon size={28} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-base font-bold">{title}</div>
        {sub && <div className="max-w-80 text-sm text-base-content/60">{sub}</div>}
      </div>
      {action}
    </div>
  );
}
