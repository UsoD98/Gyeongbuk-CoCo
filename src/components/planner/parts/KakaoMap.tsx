import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Navigation, Plus } from 'lucide-react';

import {
  DEFAULT_MIN_SEPARATION_PX,
  clusterMarkers,
  spreadOverlaps,
} from '@/components/planner/mapCluster.ts';
import type {
  ClusterScale,
  Displacement,
  MarkerCluster,
  OverlapItem,
  PlacedMarker,
} from '@/components/planner/mapCluster.ts';
import { hasLatLng } from '@/components/planner/mapModel.ts';
import type { MapMarker } from '@/components/planner/mapModel.ts';
import {
  MAP_PIN_SVG,
  MARKER_MINUS_SVG,
  MARKER_PLUS_SVG,
  markerBadgeClass,
  markerClusterClass,
  markerClusterLabel,
  markerToggleClass,
  markerToggleLabel,
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
 *
 * 마커에는 코스 담기/빼기 토글(F6-a)이 붙는다. 오버레이는 `clickable: true` 라 클릭이 지도로
 * 새지 않으므로(pan/지도 클릭과 충돌 없음) 데스크톱·모바일에서 같은 방식으로 동작한다.
 *
 * 겹쳐서 서로를 가리는 POI 마커는 개수 배지 하나로 접는다(F7 · `mapCluster`). 코스 마커와
 * 열려 있는 마커는 접지 않는다 — 순번 배지·경로선을 유지해야 하고(F5), 방금 고른 장소가
 * 그룹 안으로 사라지면 안 된다. 접힌 배지를 누르면 그 자리를 확대해 풀어 준다.
 */
export default function KakaoMap({
  markers,
  route,
  onSelect,
  onToggle,
  dayLabel,
  onFail,
}: {
  markers: MapMarker[];
  /** 활성 Day 코스 경로(순서대로). 좌표가 있는 지점만 선으로 잇는다. */
  route: Poi[];
  onSelect: (poiId: string) => void;
  /** 코스 담기/빼기 토글(F6). 활성 Day 가 없으면 버튼을 만들지 않는다. */
  onToggle: (poiId: string) => void;
  /** 활성 Day 이름('Day 1'). null 이면 담을 곳이 없어 토글을 숨긴다. */
  dayLabel: string | null;
  /** SDK 로드 실패 통지(상위가 플레이스홀더로 폴백). */
  onFail: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<KakaoMaps | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const overlaysRef = useRef(new Map<string, OverlayEntry>());
  const lineRef = useRef<KakaoOverlay | null>(null);
  const [ready, setReady] = useState(false);
  // 화면 1도당 픽셀(클러스터 판정 배율). 줌이 바뀔 때만 갱신된다 — 겹침은 줌에만 의존한다.
  const [scale, setScale] = useState<ClusterScale | null>(null);

  // 최신 콜백을 오버레이 클릭 핸들러(React 밖 DOM)와 1회성 마운트 effect 가 참조하도록 ref 로 고정.
  const onSelectRef = useRef(onSelect);
  const onToggleRef = useRef(onToggle);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onToggleRef.current = onToggle;
    onFailRef.current = onFail;
  }, [onSelect, onToggle, onFail]);

  const placed = useMemo(() => markers.filter(hasLatLng), [markers]);
  /**
   * 그릴 것 = 개별 마커 + 접힌 그룹. 배율을 아직 못 읽었으면 `clusterMarkers` 가
   * 아무것도 접지 않고 전부 개별로 돌려준다(클러스터링 실패가 마커 소실로 이어지지 않게).
   */
  const view = useMemo(
    () =>
      clusterMarkers(
        markers,
        scale ?? {
          pxPerDegLng: 0,
          pxPerDegLat: 0,
          minSeparationPx: DEFAULT_MIN_SEPARATION_PX,
        },
      ),
    [markers, scale],
  );
  /**
   * 접고도 남은 겹침(코스↔코스, 그룹↔코스)을 밀어낸 변위. 오버레이 위치와 **경로선에 같이**
   * 얹어야 선이 배지에서 떨어지지 않는다.
   */
  const displacement = useMemo(() => {
    if (!scale) return new Map<string, Displacement>();
    const items: OverlapItem[] = [
      ...view.singles.map((m) => ({
        id: m.poi.id,
        lat: m.poi.lat,
        lng: m.poi.lng,
        z: zIndexOf(m),
      })),
      ...view.clusters.map((c) => ({
        id: c.id,
        lat: c.lat,
        lng: c.lng,
        z: CLUSTER_Z,
      })),
    ];
    return spreadOverlaps(items, scale);
  }, [view, scale]);

  /**
   * 변위를 얹은 최종 표시 좌표. 변위가 없으면 원래 좌표 그대로다.
   *
   * ⚠️ 마지막 안전망: 결과가 유한하고 한반도 범위 안일 때만 변위를 적용한다. 배율이 한 순간
   *    비정상이면 변위가 폭주하는데, 그런 좌표로 오버레이를 만들면 **마커가 아예 그려지지
   *    않는다**(실측: 확대 직후 마커 전체가 사라졌다). 겹침을 못 푸는 것보다 훨씬 나쁘다.
   */
  const shift = useCallback(
    (id: string, lat: number, lng: number) => {
      const d = displacement.get(id);
      if (!d) return { lat, lng };
      const next = { lat: lat + d.dLat, lng: lng + d.dLng };
      const sane =
        Number.isFinite(next.lat) &&
        Number.isFinite(next.lng) &&
        Math.abs(next.lat - lat) <= MAX_SHIFT_DEG &&
        Math.abs(next.lng - lng) <= MAX_SHIFT_DEG;
      return sane ? next : { lat, lng };
    },
    [displacement],
  );
  // 지도 시야는 "어떤 장소가 있는가"만 바뀔 때 다시 맞춘다(드로어 열기로 재이동하면 어지럽다).
  const boundsKey = useMemo(
    () =>
      placed
        .map((m) => `${m.poi.id}:${m.poi.lat},${m.poi.lng}`)
        .sort()
        .join('|'),
    [placed],
  );
  /**
   * 경로선이 이을 점들 — 마커에 얹은 변위를 **같이** 적용해야 선이 배지에서 떨어지지 않는다.
   * 코스 마커는 항상 개별로 그려지므로(`clusterMarkers` 가 접지 않는다) 변위 표에서 그대로 찾는다.
   */
  const routePath = useMemo(
    () =>
      route
        .filter(
          (p): p is Poi & { lat: number; lng: number } =>
            p.lat != null && p.lng != null,
        )
        .map((p) => shift(p.id, p.lat, p.lng)),
    [route, shift],
  );
  const routeKey = useMemo(
    () => routePath.map((p) => `${p.lat},${p.lng}`).join('|'),
    [routePath],
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

  /**
   * 클러스터 배율 읽기 — `보이는 영역(도)` 과 `컨테이너 크기(px)` 의 비.
   * 투영 API 대신 `getBounds()` 만 쓴다(더 안정적이고, 한 화면 안의 메르카토르 왜곡은 무시 가능).
   * 아직 크기·시야가 확정되지 않은 프레임에서는 `null` → 클러스터링을 건너뛴다.
   */
  const readScale = useCallback((): ClusterScale | null => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !el) return null;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return null;
    let sw: { getLat: () => number; getLng: () => number };
    let ne: { getLat: () => number; getLng: () => number };
    try {
      const bounds = map.getBounds();
      sw = bounds.getSouthWest();
      ne = bounds.getNorthEast();
    } catch {
      return null;
    }
    const dLng = ne.getLng() - sw.getLng();
    const dLat = ne.getLat() - sw.getLat();
    if (!(dLng > 0) || !(dLat > 0)) return null;
    // 확대 애니메이션 직후엔 시야가 말이 안 되는 값으로 잡히는 순간이 있다(실측). 그 배율로
    // 변위를 계산하면 도 단위 변위가 폭주해 마커가 좌표 범위를 벗어나 아예 안 그려진다 →
    // 지도 하나에 담길 수 없는 폭(경상북도 전체가 약 2.5°)이면 그 값은 버린다.
    if (dLng > MAX_PLAUSIBLE_SPAN_DEG || dLat > MAX_PLAUSIBLE_SPAN_DEG) return null;
    return {
      pxPerDegLng: w / dLng,
      pxPerDegLat: h / dLat,
      minSeparationPx: DEFAULT_MIN_SEPARATION_PX,
    };
  }, []);

  // ── 배율 추적(줌 변화) ───────────────────────────────────
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!ready || !maps || !map) return;
    // 배율이 그대로면 같은 객체를 유지해 재클러스터링·오버레이 재생성을 막는다.
    const sync = () =>
      setScale((prev) => {
        const next = readScale();
        if (!next) return prev;
        if (
          prev &&
          prev.pxPerDegLng === next.pxPerDegLng &&
          prev.pxPerDegLat === next.pxPerDegLat
        ) {
          return prev;
        }
        return next;
      });
    sync();
    const ev = maps.event;
    if (!ev?.addListener) return;
    // **`idle` 만** 듣는다 — `zoom_changed` 는 애니메이션 **시작**에 오므로 그때 `getBounds()` 를
    // 읽으면 중간 상태 배율로 클러스터를 만들고 오버레이를 그 투영으로 배치하게 된다(실측으로
    // 확인: 배치 시점이 다른 두 배치가 화면에서 30px 가량 어긋났다). `idle` 은 이동·확대가
    // 끝난 뒤 오므로 항상 정착된 값을 준다. pan 만으로는 배율이 안 바뀌어 no-op 이다.
    ev.addListener(map, 'idle', sync);
    return () => {
      ev.removeListener?.(map, 'idle', sync);
    };
  }, [ready, readScale]);

  /**
   * 접힌 그룹 펼치기 — 그 지점으로 옮기고 두 단계 확대한다(배율이 4배 → 대개 한 번에 풀린다).
   * 좌표가 완전히 같은 장소들은 확대로도 갈라지지 않으므로, 더 확대할 수 없으면 안내만 한다
   * (결과 목록에서 고르는 경로가 남아 있다).
   */
  const expandCluster = useCallback((lat: number, lng: number) => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    const level = map.getLevel();
    if (level <= 1) {
      toast.info('더 확대할 수 없어요 — 결과 목록에서 골라 주세요');
      return;
    }
    map.setCenter(new maps.LatLng(lat, lng));
    // 애니메이션을 켜지 않는다 — 확대가 끝나기 전의 시야로 배율을 읽어 클러스터·겹침 계산이
    // 중간 상태에 물리는 구간이 생긴다(실측). 즉시 전환이 이 동작('펼치기')에도 더 맞다.
    map.setLevel(Math.max(1, level - 2), { animate: false });
  }, []);

  // ── 마커·클러스터 동기화(id 기준 diff) ────────────────────
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!ready || !maps || !map) return;
    const store = overlaysRef.current;

    // 그릴 것을 id → 종류로 모은다. 클러스터 id 는 `cluster:` 접두사라 POI id 와 겹치지 않는다.
    const desired = new Map<string, DesiredOverlay>();
    view.singles.forEach((m) => desired.set(m.poi.id, { kind: 'marker', marker: m }));
    view.clusters.forEach((c) => desired.set(c.id, { kind: 'cluster', cluster: c }));

    store.forEach((entry, id) => {
      const want = desired.get(id);
      // 종류가 바뀌면 DOM 구조가 달라 재사용할 수 없다 → 버리고 다시 만든다.
      if (want && want.kind === entry.kind) return;
      entry.overlay.setMap(null);
      store.delete(id);
    });

    desired.forEach((want, id) => {
      const existing = store.get(id);
      if (want.kind === 'cluster') {
        const c = want.cluster;
        const at = shift(c.id, c.lat, c.lng);
        // 같은 id = 같은 멤버 집합 → 개수는 그대로고 변위만 바뀔 수 있다.
        if (existing) {
          existing.overlay.setZIndex(CLUSTER_Z);
          moveTo(existing, at, maps);
          return;
        }
        const label = markerClusterLabel(c.members.length);
        const badge = document.createElement('span');
        badge.className = markerClusterClass();
        badge.textContent = String(c.members.length);
        const button = document.createElement('button');
        button.type = 'button';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.appendChild(badge);
        button.addEventListener('click', () => expandCluster(c.lat, c.lng));
        const overlay = new maps.CustomOverlay({
          position: new maps.LatLng(at.lat, at.lng),
          content: button,
          // 개별 마커와 같은 앵커(점 위에 배지) → 점 거리로 겹침을 판정하는 모델과 일치한다.
          xAnchor: 0.5,
          yAnchor: 1,
          clickable: true,
          zIndex: CLUSTER_Z,
        });
        overlay.setMap(map);
        store.set(id, { kind: 'cluster', overlay, at });
        return;
      }

      const m = want.marker;
      const at = shift(m.poi.id, m.poi.lat, m.poi.lng);
      if (existing && existing.kind === 'marker') {
        paintBadge(existing.badge, m);
        paintToggle(existing.toggle, m, dayLabel);
        existing.overlay.setZIndex(zIndexOf(m));
        moveTo(existing, at, maps);
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

      // 코스 담기/빼기 토글 — 배지 위에 겹쳐 두고, 클릭이 상세(배지)로 번지지 않게 막는다.
      const toggle = document.createElement('button');
      toggle.type = 'button';
      paintToggle(toggle, m, dayLabel);
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        onToggleRef.current(m.poi.id);
      });

      // `inline-flex` 로 배지 크기에 딱 맞춘다 — 토글은 absolute 라 흐름에서 빠지므로
      // 오버레이 앵커(xAnchor 0.5 / yAnchor 1 = 배지 아래 중앙)가 그대로 유지된다.
      const wrap = document.createElement('div');
      wrap.className = 'relative inline-flex';
      wrap.appendChild(button);
      wrap.appendChild(toggle);

      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(at.lat, at.lng),
        content: wrap,
        xAnchor: 0.5,
        yAnchor: 1,
        clickable: true,
        zIndex: zIndexOf(m),
      });
      overlay.setMap(map);
      store.set(m.poi.id, { kind: 'marker', overlay, badge, toggle, at });
    });
  }, [view, ready, dayLabel, expandCluster, shift]);

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
    const path = routePath.map((p) => new maps.LatLng(p.lat, p.lng));
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

/**
 * 오버레이 저장 항목. 개별 마커는 다시 칠할 요소(배지·토글)를 들고 있고,
 * 클러스터는 멤버가 같으면 내용도 같아 오버레이만 들고 있으면 된다.
 */
/** 이번 렌더에 그려야 할 항목(개별 마커 / 접힌 그룹). 오버레이 diff 의 입력이다. */
type DesiredOverlay =
  | { kind: 'marker'; marker: PlacedMarker }
  | { kind: 'cluster'; cluster: MarkerCluster };

/**
 * 오버레이 저장 항목. `at` 은 마지막으로 적용한 표시 좌표(원좌표 + 겹침 해소 변위)다 —
 * 값이 바뀔 때만 `setPosition` 을 불러 불필요한 재배치를 막는다.
 */
type OverlayEntry = { at: { lat: number; lng: number } } & (
  | {
      kind: 'marker';
      overlay: KakaoOverlay;
      badge: HTMLSpanElement;
      toggle: HTMLButtonElement;
    }
  | { kind: 'cluster'; overlay: KakaoOverlay }
);

/** 표시 좌표가 바뀌었으면 오버레이를 옮기고 기록을 갱신한다. */
function moveTo(
  entry: OverlayEntry,
  at: { lat: number; lng: number },
  maps: KakaoMaps,
): void {
  if (entry.at.lat === at.lat && entry.at.lng === at.lng) return;
  entry.at = at;
  entry.overlay.setPosition?.(new maps.LatLng(at.lat, at.lng));
}

/**
 * 접힌 그룹의 겹침 우선순위 — 일반 POI(10) 위, 코스 마커(20·30) 아래.
 * 코스 마커는 절대 접히지 않으니 항상 위에 있어야 순번 배지가 가려지지 않는다.
 */
const CLUSTER_Z = 15;

/**
 * 지도 한 화면에 담길 수 있는 최대 시야 폭(도). 경상북도 전체가 약 2.5° 라 3° 를 넘는
 * `getBounds()` 값은 확대 애니메이션 중의 비정상 값으로 보고 버린다.
 */
const MAX_PLAUSIBLE_SPAN_DEG = 3;

/**
 * 겹침 해소 변위의 절대 상한(도) — **폭주만 걸러내는 안전망**이고 정상 변위를 막아선 안 된다.
 * 정상 변위는 픽셀로 이미 묶여 있고(`MAX_DISPLACEMENT_RATIO`), 시야 폭 상한(3°)에서 가장
 * 넓게 잡아도 `48px ÷ (343px/3°) ≈ 0.42°` 다 → 0.5° 로 둔다. 넓은 시야에서 40px 은 실제로
 * 수 km 이므로 이보다 촘촘히 조이면 정당한 겹침 해소가 통째로 무력화된다(실측으로 확인).
 */
const MAX_SHIFT_DEG = 0.5;

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

/**
 * 토글 버튼을 현재 상태로 다시 칠한다(요소는 재사용).
 * 활성 Day 가 없으면(`dayLabel === null`) 담을 곳이 없으므로 숨긴다.
 */
function paintToggle(
  toggle: HTMLButtonElement,
  m: MapMarker,
  dayLabel: string | null,
): void {
  // `hidden` 속성은 클래스의 `display:flex`(작성자 스타일)에 밀리므로 인라인 style 로 감춘다.
  toggle.style.display = dayLabel ? '' : 'none';
  if (!dayLabel) return;
  const inCourse = m.order != null;
  toggle.className = markerToggleClass(inCourse);
  toggle.innerHTML = inCourse ? MARKER_MINUS_SVG : MARKER_PLUS_SVG;
  const label = markerToggleLabel(inCourse, dayLabel, m.poi.name);
  toggle.title = label;
  toggle.setAttribute('aria-label', label);
}

/** 경로선 색은 CSS 변수(hex)를 읽어 브랜드 색과 맞춘다. SDK 는 CSS 변수를 못 받는다. */
function primaryColor(): string {
  if (typeof window === 'undefined') return '#008080';
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim();
  return v || '#008080';
}
