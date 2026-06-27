import { Map as MapIcon, Minus, Navigation, Plus } from 'lucide-react';

import Marker from '@/components/planner/parts/Marker.tsx';
import { poiById } from '@/mocks/planner.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 카카오맵 SDK 연결 전까지 쓰는 플레이스홀더 지도.
 * 코스(활성 Day) 항목을 순번 마커 + 경로선으로 표시한다.
 */
export default function MapView({ pois }: { pois: Poi[] }) {
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const drawerPoiId = usePlannerStore((s) => s.drawer.poiId);
  const openDrawer = usePlannerStore((s) => s.openDrawer);

  const day = course.days[activeDay];
  const courseItems = (day?.items ?? [])
    .map((id) => poiById(id))
    .filter((p): p is Poi => Boolean(p));
  const order: Record<string, number> = {};
  courseItems.forEach((p, i) => {
    order[p.id] = i + 1;
  });
  const linePts = courseItems.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E9F0EF]">
      {/* 강/도로 장식 */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M-5 70 Q 30 55 50 68 T 105 60"
          fill="none"
          stroke="var(--color-cat-culture)"
          strokeWidth={3}
          opacity={0.2}
        />
        <path
          d="M20 -5 L 35 45 L 55 60 L 60 105"
          fill="none"
          stroke="#cbd5d3"
          strokeWidth={2}
          strokeDasharray="1 2"
        />
      </svg>

      {/* 코스 경로선 */}
      {courseItems.length > 1 && (
        <svg
          className="absolute inset-0 z-[1] h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            points={linePts}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={0.8}
            strokeDasharray="2 1.5"
            strokeLinecap="round"
            opacity={0.85}
          />
        </svg>
      )}

      {pois.map((p) => (
        <Marker
          key={p.id}
          poi={p}
          n={order[p.id]}
          active={drawerPoiId === p.id}
          onClick={() => openDrawer(p.id)}
        />
      ))}

      {/* 지도 컨트롤 (플레이스홀더) */}
      <div className="absolute bottom-3 right-3 z-[3] flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="확대"
          className="btn btn-sm btn-square bg-base-100 shadow"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          aria-label="축소"
          className="btn btn-sm btn-square bg-base-100 shadow"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          title="현위치"
          aria-label="현위치"
          className="btn btn-sm btn-square bg-base-100 shadow"
        >
          <Navigation size={15} />
        </button>
      </div>

      <div className="absolute left-3 top-3 z-[3] flex items-center gap-1 rounded-full bg-base-100/90 px-2.5 py-1 text-xs font-medium shadow">
        <MapIcon size={12} /> 카카오맵 영역 (플레이스홀더)
      </div>
    </div>
  );
}
