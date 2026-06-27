import { cn } from '@/utils/cn.ts';
import type { PoiCat } from '@/types/planner.ts';

const META: Record<PoiCat, { label: string; cls: string }> = {
  sight: { label: '관광지', cls: 'bg-cat-sight/12 text-cat-sight' },
  food: { label: '음식점', cls: 'bg-cat-food/12 text-cat-food' },
  stay: { label: '숙박', cls: 'bg-cat-stay/12 text-cat-stay' },
  culture: { label: '문화시설', cls: 'bg-cat-culture/12 text-cat-culture' },
};

/** POI 카테고리 색상 배지 */
export default function CatBadge({
  cat,
  className,
}: {
  cat: PoiCat;
  className?: string;
}) {
  const m = META[cat];
  return (
    <span className={cn('badge badge-sm border-0 font-semibold', m.cls, className)}>
      {m.label}
    </span>
  );
}
