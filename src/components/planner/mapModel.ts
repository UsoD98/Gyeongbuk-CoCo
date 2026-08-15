import type { Poi } from '@/types/planner.ts';

/**
 * 지도 렌더러(카카오맵 / 폴백 플레이스홀더)가 공유하는 마커 모델.
 * 스토어 구독·순번 계산은 `MapView` 한 곳에서 하고, 렌더러는 이 배열만 그린다.
 */
export interface MapMarker {
  poi: Poi;
  /** 활성 Day 코스에서의 순번(1부터). 코스에 없으면 undefined → 핀 아이콘. */
  order?: number;
  /** 드로어에서 열려 있는 장소인지. */
  active: boolean;
}

/** 카카오맵에 그릴 수 있는(실좌표를 가진) 마커만 남긴다. */
export function hasLatLng(
  m: MapMarker,
): m is MapMarker & { poi: Poi & { lat: number; lng: number } } {
  return m.poi.lat != null && m.poi.lng != null;
}
