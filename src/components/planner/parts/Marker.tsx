import { MapPin, Minus, Plus } from 'lucide-react';

import {
  markerBadgeClass,
  markerToggleClass,
  markerToggleLabel,
} from '@/components/planner/parts/markerStyle.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 지도 플레이스홀더 위 마커. 코스 순번(n)이 있으면 숫자, 없으면 핀 아이콘.
 * 배지 오른쪽 아래의 토글로 활성 Day 에 담거나 뺀다(F6-a) — 카카오맵 마커와 같은 규약.
 */
export default function Marker({
  poi,
  n,
  active,
  onClick,
  onToggle,
  dayLabel,
}: {
  poi: Poi;
  n?: number;
  active?: boolean;
  onClick?: () => void;
  /** 코스 담기/빼기. `dayLabel` 이 없으면(담을 Day 없음) 버튼을 렌더하지 않는다. */
  onToggle?: () => void;
  dayLabel?: string | null;
}) {
  const inCourse = n != null;

  return (
    <div
      className="absolute z-[2] -translate-x-1/2 -translate-y-full"
      style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
    >
      {/* 토글은 absolute 라 흐름에서 빠진다 → inline-flex 로 배지 크기에 맞춰 위치를 지킨다. */}
      <div className="relative inline-flex">
        <button type="button" title={poi.name} aria-label={poi.name} onClick={onClick}>
          <span className={markerBadgeClass(poi.cat, active)}>
            {inCourse ? (
              <span className="text-xs font-bold">{n}</span>
            ) : (
              <MapPin size={15} />
            )}
          </span>
        </button>
        {dayLabel && onToggle && (
          <button
            type="button"
            title={markerToggleLabel(inCourse, dayLabel, poi.name)}
            aria-label={markerToggleLabel(inCourse, dayLabel, poi.name)}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={markerToggleClass(inCourse)}
          >
            {inCourse ? <Minus size={13} /> : <Plus size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}
