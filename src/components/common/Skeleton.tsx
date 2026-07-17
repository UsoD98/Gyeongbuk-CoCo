import { cn } from '@/utils/cn.ts';

/**
 * 로딩 자리표시자. daisyUI `skeleton`(shimmer) 위에 크기를 `className`으로 지정한다.
 * 예: 카드 목록 로딩 → `<Skeleton className="h-40 w-full rounded-2xl" />`를 카드 수만큼 반복.
 */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />;
}
