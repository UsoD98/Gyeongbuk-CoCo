import { Map as MapIcon, Minus, Navigation, Plus } from 'lucide-react';

import Marker from '@/components/planner/parts/Marker.tsx';
import type { MapMarker } from '@/components/planner/mapModel.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 카카오맵을 못 띄울 때(키 없음·도메인 미등록·스크립트 차단) 쓰는 폴백 지도.
 * 좌표는 실경위도가 아니라 결과 집합을 정규화한 % 값(`Poi.x/y`)이다 — 상대 위치만 보여준다.
 */
export default function PlaceholderMap({
  markers,
  route,
  onSelect,
  onToggle,
  dayLabel,
}: {
  markers: MapMarker[];
  /** 활성 Day 코스 경로(순서대로). 2곳 이상일 때 점선으로 잇는다. */
  route: Poi[];
  onSelect: (poiId: string) => void;
  /** 코스 담기/빼기 토글(F6). 카카오맵과 같은 규약. */
  onToggle: (poiId: string) => void;
  /** 활성 Day 이름. null 이면 토글을 숨긴다. */
  dayLabel: string | null;
}) {
  const linePts = route.map((p) => `${p.x},${p.y}`).join(' ');

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
      {route.length > 1 && (
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

      {markers.map((m) => (
        <Marker
          key={m.poi.id}
          poi={m.poi}
          n={m.order}
          active={m.active}
          onClick={() => onSelect(m.poi.id)}
          onToggle={() => onToggle(m.poi.id)}
          dayLabel={dayLabel}
        />
      ))}

      {/* 지도 컨트롤 (플레이스홀더 — 동작 없음) */}
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
        <MapIcon size={12} /> 지도 미리보기 (카카오맵 연결 실패)
      </div>
    </div>
  );
}
