import { useState } from 'react';

import { projectToPlaceholder } from '@/components/planner/mapModel.ts';
import type { MapMarker } from '@/components/planner/mapModel.ts';
import KakaoMap from '@/components/planner/parts/KakaoMap.tsx';
import PlaceholderMap from '@/components/planner/parts/PlaceholderMap.tsx';
import type { Poi } from '@/types/planner.ts';

/** 읽기 전용 지도(공개뷰)에서 쓰는 빈 토글. `dayLabel` 이 null 이라 실제로 불리지 않는다. */
const NOOP = () => {};

/**
 * 지도 렌더러 선택 + 폴백.
 *
 * 카카오맵(`KakaoMap`)을 띄우고, SDK 를 못 띄우면(키 없음·도메인 미등록 등)
 * `PlaceholderMap` 으로 폴백해 지도 영역이 비지 않게 한다. 폴백 지도는 실경위도가 아니라
 * % 좌표로 그리므로 실좌표를 가진 장소를 그 집합에 맞춰 재투영한다(`projectToPlaceholder`) —
 * 그러지 않으면 좌표가 없는 코스 장소(x/y 가 전부 50)가 중앙에 전부 겹친다.
 *
 * **스토어를 구독하지 않는다** — 마커·경로를 인자로만 받으므로 플래너(`MapView`)와
 * 공개뷰(`pages/Share`)가 같은 지도를 쓴다. 코스 편집이 없는 화면은 `dayLabel` 을 주지 않으면
 * 되고(두 렌더러 모두 null 이면 마커의 담기/빼기 토글을 숨긴다) 마커 탭(상세 열기)만 남는다.
 *
 * ⚠️ 두 렌더러 모두 `absolute inset-0` 이다 → **부모에 `relative` 와 높이**가 있어야 한다.
 */
export default function MapCanvas({
  markers,
  route,
  onSelect,
  onToggle = NOOP,
  dayLabel = null,
}: {
  markers: MapMarker[];
  /** 코스 경로(순서대로). 좌표가 있는 지점만 선으로 잇는다. */
  route: Poi[];
  onSelect: (poiId: string) => void;
  /** 코스 담기/빼기 토글(F6). `dayLabel` 이 null 이면 호출되지 않는다. */
  onToggle?: (poiId: string) => void;
  /** 담을 Day 이름. null(기본)이면 토글 버튼 자체를 만들지 않는다 = 읽기 전용 지도. */
  dayLabel?: string | null;
}) {
  const [kakaoFailed, setKakaoFailed] = useState(false);

  if (kakaoFailed) {
    const positions = projectToPlaceholder([
      ...route,
      ...markers.map((m) => m.poi),
    ]);
    const place = (poi: Poi): Poi => {
      const pos = positions.get(poi.id);
      return pos ? { ...poi, x: pos.x, y: pos.y } : poi;
    };
    return (
      <PlaceholderMap
        markers={markers.map((m) => ({ ...m, poi: place(m.poi) }))}
        route={route.map(place)}
        onSelect={onSelect}
        onToggle={onToggle}
        dayLabel={dayLabel}
      />
    );
  }

  return (
    <KakaoMap
      markers={markers}
      route={route}
      onSelect={onSelect}
      onToggle={onToggle}
      dayLabel={dayLabel}
      onFail={() => setKakaoFailed(true)}
    />
  );
}
