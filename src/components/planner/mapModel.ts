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

/** 폴백 지도의 % 좌표(`Poi.x`/`Poi.y` 와 같은 단위). */
export interface PlaceholderPos {
  x: number;
  y: number;
}

/**
 * 폴백(플레이스홀더) 지도용 좌표 보정.
 *
 * 폴백 지도는 실경위도가 아니라 `Poi.x`/`Poi.y`(%)로 그린다. 그런데 코스 응답만으로 만든 장소는
 * 좌표가 없어 x/y 가 전부 50 이라, 컬렉션에서 코스만 열면 마커가 화면 중앙에 **전부 겹친다**.
 * 그래서 실좌표(카탈로그·장소명 검색으로 채운 값)를 가진 장소는 그 집합의 bounding box 를
 * 10~90% 로 정규화해 x/y 를 다시 계산한다. 좌표가 없는 장소는 원래 값을 그대로 둔다.
 *
 * 지점이 1곳뿐이면 정규화할 폭이 없어 보정하지 않는다(중앙 표시가 맞다).
 */
export function projectToPlaceholder(pois: Poi[]): Map<string, PlaceholderPos> {
  const out = new Map<string, PlaceholderPos>();
  const placed = pois.filter(
    (p): p is Poi & { lat: number; lng: number } =>
      p.lat != null && p.lng != null,
  );
  if (placed.length < 2) return out;

  const lats = placed.map((p) => p.lat);
  const lngs = placed.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const minLng = Math.min(...lngs);
  const spanLat = Math.max(...lats) - minLat;
  const spanLng = Math.max(...lngs) - minLng;
  const scale = (v: number, min: number, span: number) =>
    span > 0 ? 10 + ((v - min) / span) * 80 : 50;

  placed.forEach((p) => {
    out.set(p.id, {
      x: scale(p.lng, minLng, spanLng),
      // 위도는 값이 클수록 북쪽(위) → y(%) 는 위가 0이므로 반전.
      y: 100 - scale(p.lat, minLat, spanLat),
    });
  });
  return out;
}

/** 카카오맵에 그릴 수 있는(실좌표를 가진) 마커만 남긴다. */
export function hasLatLng(
  m: MapMarker,
): m is MapMarker & { poi: Poi & { lat: number; lng: number } } {
  return m.poi.lat != null && m.poi.lng != null;
}
