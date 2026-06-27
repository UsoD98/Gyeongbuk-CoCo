import { MapPin } from 'lucide-react';

import { cn } from '@/utils/cn.ts';
import type { Poi, PoiCat } from '@/types/planner.ts';

const CAT_BG: Record<PoiCat, string> = {
  sight: 'bg-cat-sight',
  food: 'bg-cat-food',
  stay: 'bg-cat-stay',
  culture: 'bg-cat-culture',
};

/** 지도 플레이스홀더 위 마커. 코스 순번(n)이 있으면 숫자, 없으면 핀 아이콘. */
export default function Marker({
  poi,
  n,
  active,
  onClick,
}: {
  poi: Poi;
  n?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={poi.name}
      onClick={onClick}
      className="absolute z-[2] -translate-x-1/2 -translate-y-full"
      style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white transition-transform hover:scale-110',
          CAT_BG[poi.cat],
          active && 'scale-125',
        )}
      >
        {n ? (
          <span className="text-xs font-bold">{n}</span>
        ) : (
          <MapPin size={15} />
        )}
      </span>
    </button>
  );
}
