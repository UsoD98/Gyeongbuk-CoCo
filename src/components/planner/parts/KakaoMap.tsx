import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Navigation, Plus } from 'lucide-react';

import { hasLatLng } from '@/components/planner/mapModel.ts';
import type { MapMarker } from '@/components/planner/mapModel.ts';
import {
  MAP_PIN_SVG,
  markerBadgeClass,
} from '@/components/planner/parts/markerStyle.ts';
import { toast } from '@/stores/toastStore.ts';
import { GYEONGBUK_CENTER, loadKakaoMaps } from '@/utils/kakaoMap.ts';
import type { KakaoMap as KakaoMapInstance, KakaoMaps, KakaoOverlay } from '@/utils/kakaoMap.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 카카오맵 실지도.
 *
 * 마커는 `CustomOverlay`로 그린다 — 기본 마커 이미지 대신 앱의 카테고리 색 배지를 그대로 쓰기 위함
 * (플레이스홀더 지도와 동일한 `markerBadgeClass`). React 밖 DOM이라 오버레이는 id 로 diff 한다.
 *
 * 좌표가 없는 장소(코스 응답만 있고 큐레이션 카탈로그에 없는 경우)는 지도에 찍을 수 없어 건너뛴다.
 * SDK 로드 실패는 이 컴포넌트가 아니라 상위 `MapView` 가 폴백으로 처리한다(`onFail`).
 */
export default function KakaoMap({
  markers,
  route,
  onSelect,
  onFail,
}: {
  markers: MapMarker[];
  /** 활성 Day 코스 경로(순서대로). 좌표가 있는 지점만 선으로 잇는다. */
  route: Poi[];
  onSelect: (poiId: string) => void;
  /** SDK 로드 실패 통지(상위가 플레이스홀더로 폴백). */
  onFail: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const overlaysRef = useRef(
    new Map<string, { overlay: KakaoOverlay; badge: HTMLSpanElement }>(),
  );
  const lineRef = useRef<KakaoOverlay | null>(null);
  const [ready, setReady] = useState(false);

  // 최신 콜백을 오버레이 클릭 핸들러(React 밖 DOM)와 1회성 마운트 effect 가 참조하도록 ref 로 고정.
  const onSelectRef = useRef(onSelect);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onFailRef.current = onFail;
  }, [onSelect, onFail]);

  const placed = useMemo(() => markers.filter(hasLatLng), [markers]);
  // 지도 시야는 "어떤 장소가 있는가"만 바뀔 때 다시 맞춘다(드로어 열기로 재이동하면 어지럽다).
  const boundsKey = useMemo(
    () =>
      placed
        .map((m) => `${m.poi.id}:${m.poi.lat},${m.poi.lng}`)
        .sort()
        .join('|'),
    [placed],
  );
  const routeKey = useMemo(
    () =>
      route
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => `${p.lat},${p.lng}`)
        .join('|'),
    [route],
  );

  // ── 지도 생성 ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    loadKakaoMaps().then((maps) => {
      if (cancelled) return;
      if (!maps) {
        onFailRef.current();
        return;
      }
      mapsRef.current = maps;
      mapRef.current = new maps.Map(container, {
        center: new maps.LatLng(GYEONGBUK_CENTER.lat, GYEONGBUK_CENTER.lng),
        level: 10,
      });
      // 패널 전환 직후엔 컨테이너 크기가 확정되기 전일 수 있다.
      requestAnimationFrame(() => mapRef.current?.relayout());
      setReady(true);
    });

    const overlays = overlaysRef.current;
    return () => {
      cancelled = true;
      overlays.forEach((entry) => entry.overlay.setMap(null));
      overlays.clear();
      lineRef.current?.setMap(null);
      lineRef.current = null;
      mapRef.current = null;
      setReady(false);
      // StrictMode 재마운트 시 SDK 가 만든 DOM 이 겹쳐 남지 않도록 비운다.
      container.innerHTML = '';
    };
  }, []);

  // ── 마커 동기화(id 기준 diff) ─────────────────────────────
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!ready || !maps || !map) return;
    const store = overlaysRef.current;

    const next = new Set(placed.map((m) => m.poi.id));
    store.forEach((entry, id) => {
      if (next.has(id)) return;
      entry.overlay.setMap(null);
      store.delete(id);
    });

    placed.forEach((m) => {
      const existing = store.get(m.poi.id);
      if (existing) {
        paintBadge(existing.badge, m);
        existing.overlay.setZIndex(zIndexOf(m));
        return;
      }
      const badge = document.createElement('span');
      paintBadge(badge, m);
      const button = document.createElement('button');
      button.type = 'button';
      button.title = m.poi.name;
      button.setAttribute('aria-label', m.poi.name);
      button.appendChild(badge);
      button.addEventListener('click', () => onSelectRef.current(m.poi.id));

      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(m.poi.lat, m.poi.lng),
        content: button,
        xAnchor: 0.5,
        yAnchor: 1,
        clickable: true,
        zIndex: zIndexOf(m),
      });
      overlay.setMap(map);
      store.set(m.poi.id, { overlay, badge });
    });
  }, [placed, ready]);

  // ── 시야 맞추기 ──────────────────────────────────────────
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!ready || !maps || !map || !placed.length) return;
    if (placed.length === 1) {
      const only = placed[0].poi;
      map.setCenter(new maps.LatLng(only.lat, only.lng));
      map.setLevel(5);
      return;
    }
    const bounds = new maps.LatLngBounds();
    placed.forEach((m) => bounds.extend(new maps.LatLng(m.poi.lat, m.poi.lng)));
    map.setBounds(bounds, 40, 40, 40, 40);
    // boundsKey: 좌표 집합이 그대로면 다시 맞추지 않는다(드로어 열기 등으로 재이동 방지).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundsKey, ready]);

  // ── 코스 경로선 ──────────────────────────────────────────
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!ready || !maps || !map) return;
    lineRef.current?.setMap(null);
    lineRef.current = null;
    const path = route
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => new maps.LatLng(p.lat as number, p.lng as number));
    if (path.length < 2) return;
    const line = new maps.Polyline({
      path,
      strokeWeight: 4,
      strokeColor: primaryColor(),
      strokeOpacity: 0.85,
      strokeStyle: 'shortdash',
    });
    line.setMap(map);
    lineRef.current = line;
    // routeKey: 좌표 나열이 같으면 다시 그리지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, ready]);

  const zoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.setLevel(map.getLevel() + delta, { animate: true });
  };

  const locate = () => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    if (!navigator.geolocation) {
      toast.info('이 브라우저는 현위치를 지원하지 않아요');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setCenter(new maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        map.setLevel(5);
      },
      () => toast.info('현위치를 가져오지 못했어요'),
    );
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute bottom-3 right-3 z-[3] flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="확대"
          onClick={() => zoom(-1)}
          className="btn btn-sm btn-square bg-base-100 shadow"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          aria-label="축소"
          onClick={() => zoom(1)}
          className="btn btn-sm btn-square bg-base-100 shadow"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          title="현위치"
          aria-label="현위치"
          onClick={locate}
          className="btn btn-sm btn-square bg-base-100 shadow"
        >
          <Navigation size={15} />
        </button>
      </div>

      {ready && !placed.length && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[3] -translate-x-1/2 rounded-full bg-base-100/90 px-3 py-1 text-xs font-medium shadow">
          지도에 표시할 좌표가 없어요
        </div>
      )}
    </div>
  );
}

/** 활성 > 코스 편성 > 일반 순으로 겹침 우선순위. */
function zIndexOf(m: MapMarker): number {
  if (m.active) return 30;
  return m.order ? 20 : 10;
}

/** 마커 배지의 클래스·내용을 현재 상태로 다시 칠한다(요소는 재사용). */
function paintBadge(badge: HTMLSpanElement, m: MapMarker): void {
  badge.className = markerBadgeClass(m.poi.cat, m.active);
  badge.innerHTML = m.order
    ? `<span class="text-xs font-bold">${m.order}</span>`
    : MAP_PIN_SVG;
}

/** 경로선 색은 CSS 변수(hex)를 읽어 브랜드 색과 맞춘다. SDK 는 CSS 변수를 못 받는다. */
function primaryColor(): string {
  if (typeof window === 'undefined') return '#008080';
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim();
  return v || '#008080';
}
