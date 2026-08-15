import { MapPin } from 'lucide-react';

import { markerBadgeClass } from '@/components/planner/parts/markerStyle.ts';
import type { Poi } from '@/types/planner.ts';

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
      <span className={markerBadgeClass(poi.cat, active)}>
        {n ? (
          <span className="text-xs font-bold">{n}</span>
        ) : (
          <MapPin size={15} />
        )}
      </span>
    </button>
  );
}
