import { useMemo, useState } from 'react';

import type { MapMarker } from '@/components/planner/mapModel.ts';
import KakaoMap from '@/components/planner/parts/KakaoMap.tsx';
import PlaceholderMap from '@/components/planner/parts/PlaceholderMap.tsx';
import { usePoiResolver } from '@/hooks/usePoiResolver.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 지도 패널 진입점.
 *
 * 스토어 구독(활성 Day 코스·드로어 선택)과 마커 모델 계산을 여기서 한 번만 하고,
 * 실제 렌더는 카카오맵(`KakaoMap`)에 맡긴다. SDK를 못 띄우면(키 없음·도메인 미등록 등)
 * `PlaceholderMap`으로 폴백해 지도 영역이 비지 않게 한다.
 *
 * 마커는 **결과 목록 ∪ 활성 Day 코스**다 — 코스 장소는 순번 배지로, 그 외는 핀으로 표시한다.
 */
export default function MapView({ pois }: { pois: Poi[] }) {
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const drawerPoiId = usePlannerStore((s) => s.drawer.poiId);
  const openDrawer = usePlannerStore((s) => s.openDrawer);
  // 코스 항목은 목이 아니라 해석기로 푼다(API 코스 장소·큐레이션 카탈로그 병합).
  const resolvePoi = usePoiResolver();
  const [kakaoFailed, setKakaoFailed] = useState(false);

  const dayItems = course.days[activeDay]?.items;

  /** 활성 Day 경로(코스 순서 그대로). */
  const route = useMemo(
    () =>
      (dayItems ?? [])
        .map((id) => resolvePoi(id))
        .filter((p): p is Poi => Boolean(p)),
    [dayItems, resolvePoi],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const order = new Map<string, number>();
    route.forEach((p, i) => order.set(p.id, i + 1));
    // 코스 장소를 먼저 깔고, 결과 목록에서 코스에 없는 것만 덧붙인다(중복 마커 방지).
    const merged: Poi[] = [...route];
    const seen = new Set(route.map((p) => p.id));
    pois.forEach((p) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      merged.push(p);
    });
    return merged.map((poi) => ({
      poi,
      order: order.get(poi.id),
      active: drawerPoiId === poi.id,
    }));
  }, [route, pois, drawerPoiId]);

  if (kakaoFailed) {
    return (
      <PlaceholderMap markers={markers} route={route} onSelect={openDrawer} />
    );
  }

  return (
    <KakaoMap
      markers={markers}
      route={route}
      onSelect={openDrawer}
      onFail={() => setKakaoFailed(true)}
    />
  );
}
