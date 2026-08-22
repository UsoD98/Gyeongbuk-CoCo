import { hasLatLng } from '@/components/planner/mapModel.ts';
import type { MapMarker } from '@/components/planner/mapModel.ts';

/**
 * 지도 마커 클러스터링 (F7).
 *
 * **왜 필요한가**: 마커 배지(28px)와 그 오른쪽 아래로 6px 삐져나온 담기/빼기 토글(22px)은
 * 서로 겹칠 수 있고, 겹치면 **아래쪽 마커의 배지·토글에 손이 닿지 않는다** — 그 자리를 누르면
 * 위쪽 마커가 먹어서 엉뚱한 POI 의 상세 드로어가 열린다(2026-08-22 모바일 폭 390px 실측:
 * 토글 6개 중 1개가 도달 불가). 마커는 카카오 `CustomOverlay` 로 각각 독립된 DOM 이라
 * z-index 를 어떻게 정렬해도 **아래쪽에는 닿지 않는다** — 가려진 쪽을 없애야 한다.
 *
 * **규칙**:
 * - **코스 마커(순번 있는 것)와 열려 있는 마커(`active`)는 절대 접지 않는다.** 코스 순번 배지·
 *   경로선을 유지해야 하고(F5 DoD), 방금 고른 장소가 그룹 안으로 사라지면 안 된다.
 * - 나머지(결과 목록 POI)는 화면상 `minSeparationPx` 보다 가까우면 하나로 접고 개수를 보여준다.
 *   접힌 그룹을 누르면 호출부가 확대해서 풀어 준다.
 * - 접은 결과(그룹 중심)끼리 다시 겹칠 수 있으므로 **더 이상 겹치지 않을 때까지 반복 병합**한다.
 *   그래야 "그려진 것끼리는 겹치지 않는다"는 불변식이 성립한다.
 *
 * 픽셀 거리는 호출부가 넘기는 `pxPerDegLat`/`pxPerDegLng`(줌에서 계산)로 환산한다 —
 * 이 모듈은 SDK 를 모르는 순수 함수라 그대로 테스트할 수 있다.
 */

/** 좌표가 확정된 마커. `hasLatLng` 를 통과한 것만 지도에 그린다. */
export type PlacedMarker = MapMarker & {
  poi: MapMarker['poi'] & { lat: number; lng: number };
};

/** 접힌 마커 그룹. 위치는 멤버 좌표의 평균이다. */
export interface MarkerCluster {
  /** 안정적인 식별자. 멤버가 같으면 줌이 바뀌어도 같은 id → 오버레이를 재사용한다. */
  id: string;
  lat: number;
  lng: number;
  members: PlacedMarker[];
}

export interface ClusterScale {
  /** 화면 1도(경도)당 픽셀. `지도 폭(px) / 보이는 경도 폭(도)`. */
  pxPerDegLng: number;
  /** 화면 1도(위도)당 픽셀. `지도 높이(px) / 보이는 위도 폭(도)`. */
  pxPerDegLat: number;
  /**
   * 이 픽셀보다 가까우면 겹친 것으로 본다.
   * 배지 28px + 토글 오버행 6px + 여유 = 40px 를 기본값으로 쓴다(`DEFAULT_MIN_SEPARATION_PX`).
   */
  minSeparationPx: number;
}

/** 배지(28) + 토글 오버행(6) + 손가락 여유(6) → 40px 안쪽이면 서로 가린다고 본다. */
export const DEFAULT_MIN_SEPARATION_PX = 40;

/** 클러스터링 결과 — `singles` 는 개별로, `clusters` 는 개수 배지로 그린다. */
export interface ClusterResult {
  singles: PlacedMarker[];
  clusters: MarkerCluster[];
}

/** 접지 않는 마커: 코스에 편성된 것(순번 있음)과 드로어에 열려 있는 것. */
function isPinned(m: MapMarker): boolean {
  return m.order != null || m.active;
}

/** 화면 픽셀 거리의 제곱. 위도·경도 축의 배율이 달라 축별로 환산한다. */
function pxDistSq(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  scale: ClusterScale,
): number {
  const dx = (a.lng - b.lng) * scale.pxPerDegLng;
  const dy = (a.lat - b.lat) * scale.pxPerDegLat;
  return dx * dx + dy * dy;
}

/**
 * 겹치는 POI 마커를 그룹으로 접는다.
 *
 * 배율이 유효하지 않으면(지도 크기·시야를 아직 못 읽은 초기 프레임 등) **아무것도 접지 않고**
 * 전부 개별로 돌려준다 — 클러스터링 실패가 마커 소실로 이어지면 안 된다.
 */
export function clusterMarkers(
  markers: MapMarker[],
  scale: ClusterScale,
): ClusterResult {
  const placed = markers.filter(hasLatLng) as PlacedMarker[];
  const pinned = placed.filter(isPinned);
  const loose = placed
    .filter((m) => !isPinned(m))
    // id 정렬로 결과를 결정적으로 만든다(같은 입력 → 같은 그룹·같은 id).
    .sort((a, b) => (a.poi.id < b.poi.id ? -1 : a.poi.id > b.poi.id ? 1 : 0));

  const usable =
    Number.isFinite(scale.pxPerDegLng) &&
    Number.isFinite(scale.pxPerDegLat) &&
    scale.pxPerDegLng > 0 &&
    scale.pxPerDegLat > 0 &&
    scale.minSeparationPx > 0;
  if (!usable || loose.length < 2) {
    return { singles: [...pinned, ...loose], clusters: [] };
  }

  const threshSq = scale.minSeparationPx * scale.minSeparationPx;

  // 그룹의 대표점(멤버 평균)끼리 다시 겹치면 또 합친다 → 겹침이 사라질 때까지 반복.
  let groups: PlacedMarker[][] = loose.map((m) => [m]);
  for (let pass = 0; pass < loose.length; pass += 1) {
    const centers = groups.map(centerOf);
    const parent = groups.map((_, i) => i);
    const find = (i: number): number => {
      let r = i;
      while (parent[r] !== r) r = parent[r];
      // 경로 압축 — 그룹 수가 수백 개일 수 있어 매 pass 를 선형에 가깝게 유지한다.
      let cur = i;
      while (parent[cur] !== r) {
        const nextCur = parent[cur];
        parent[cur] = r;
        cur = nextCur;
      }
      return r;
    };

    let merged = false;
    for (let i = 0; i < groups.length; i += 1) {
      for (let j = i + 1; j < groups.length; j += 1) {
        if (pxDistSq(centers[i], centers[j], scale) >= threshSq) continue;
        const ri = find(i);
        const rj = find(j);
        if (ri === rj) continue;
        parent[rj] = ri;
        merged = true;
      }
    }
    if (!merged) break;

    const byRoot = new Map<number, PlacedMarker[]>();
    groups.forEach((g, i) => {
      const r = find(i);
      const bucket = byRoot.get(r);
      if (bucket) bucket.push(...g);
      else byRoot.set(r, [...g]);
    });
    groups = [...byRoot.values()];
  }

  const singles: PlacedMarker[] = [...pinned];
  const clusters: MarkerCluster[] = [];
  groups.forEach((g) => {
    if (g.length === 1) {
      singles.push(g[0]);
      return;
    }
    const center = centerOf(g);
    clusters.push({
      id: clusterId(g),
      lat: center.lat,
      lng: center.lng,
      members: g,
    });
  });
  return { singles, clusters };
}

// ── 잔여 겹침 밀어내기 ──────────────────────────────────────────────────────────
//
// 클러스터링은 **POI 끼리의** 겹침만 없앤다. 남는 조합이 둘 있고 둘 다 실측으로 확인됐다
// (2026-08-22, 실 백엔드 경주 데이터 390px):
//   ① 코스 마커 ↔ 코스 마커 — 접지 않기로 했으니 그대로 겹친다(불국사가 석굴암에 가려
//      배지·토글 모두 도달 불가 = 지도에서 뺄 수 없다).
//   ② 접힌 그룹 ↔ 코스 마커 — 코스가 z 상위라 그룹 배지를 눌러 펼칠 수 없다(56곳이 가려졌다).
// 그래서 그려질 항목 전체를 훑어 **가려지는 쪽만** 임계 거리까지 밀어낸다. 위에 그려지는
// 항목(코스·활성)은 제자리에 두어 눈에 보이는 위치가 흔들리지 않게 하고, 밀어낸 양은
// `MAX_DISPLACEMENT_PX` 로 묶어 실제 위치에서 멀어지지 않게 한다.
//
// ⚠️ 코스 마커를 밀면 경로선과 어긋나므로 **경로선도 같은 변위를 따라가야 한다**
//    (호출부가 `displacementOf` 로 같은 값을 적용한다).

/** 겹침 해소 대상 = 지도에 그려질 항목 하나(개별 마커 또는 접힌 그룹). */
export interface OverlapItem {
  id: string;
  lat: number;
  lng: number;
  /** 겹칠 때 위에 그려지는 순위(클수록 위). 위에 있는 쪽은 제자리에 두고 아래쪽을 민다. */
  z: number;
}

/** 원래 좌표에서의 변위(도 단위). 오버레이 위치와 경로선에 같이 얹는다. */
export interface Displacement {
  dLat: number;
  dLng: number;
}

/**
 * 원래 위치에서 옮길 수 있는 최대 거리 = 겹침 임계의 몇 배까지인가.
 * 한 번의 충돌을 푸는 데 필요한 거리는 최대 `minSeparationPx` 라 1.0 보다 커야 하고,
 * 그 이상 옮기면 마커가 실제 위치에서 동떨어져 오히려 거짓말이 된다 → 1.2 배로 묶는다.
 * 자리를 못 찾으면 **옮기지 않는다**(겹침을 남기고 확대로 풀게 둔다).
 */
export const MAX_DISPLACEMENT_RATIO = 1.2;

/** 고리 하나에서 시도하는 후보 각도 수. 12 면 30° 간격이라 빈틈을 잘 찾는다. */
const RING_SLOTS = 12;

/** 임계에 딱 붙으면 부동소수 오차로 다시 겹칠 수 있어 아주 살짝 여유를 둔다. */
const SEPARATION_EPS = 1.01;

/**
 * 그려질 항목들의 잔여 겹침을 해소하고 항목별 변위를 돌려준다(변위 0 인 항목은 생략).
 *
 * 우선순위(z 내림차순 → id 오름차순)로 하나씩 놓는다. 위에 그려지는 항목은 **제자리**를
 * 지키고, 아래쪽 항목이 겹치면 원래 자리 주변의 고리(반지름 `minSep` → 캡)에서 **빈 자리를
 * 찾아** 옮긴다. "밀어내기"가 아니라 "빈 자리 찾기"인 이유: 밀어내면 밀린 방향에 또 다른
 * 항목이 있을 때 연쇄로 멀리 날아가고, 캡에 걸려 겹침이 그대로 남는다(실측으로 확인).
 *
 * 결정적이며(같은 입력 → 같은 결과) 항목 수에 대해 O(n²·슬롯) 이다 — 클러스터링이 밀집을
 * 미리 접어 주므로 여기 오는 항목은 코스 마커 몇 개 + 그룹 몇 개다.
 */
export function spreadOverlaps(
  items: OverlapItem[],
  scale: ClusterScale,
): Map<string, Displacement> {
  const out = new Map<string, Displacement>();
  const usable =
    Number.isFinite(scale.pxPerDegLng) &&
    Number.isFinite(scale.pxPerDegLat) &&
    scale.pxPerDegLng > 0 &&
    scale.pxPerDegLat > 0 &&
    scale.minSeparationPx > 0;
  if (!usable || items.length < 2) return out;

  const minSep = scale.minSeparationPx;
  const threshSq = minSep * minSep;
  const maxOffset = minSep * MAX_DISPLACEMENT_RATIO;
  const order = [...items].sort(
    (a, b) => b.z - a.z || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  // 위도는 위로 갈수록 y 가 작아지지만 여기선 거리만 쓰므로 부호는 무관하다.
  const toPx = (it: OverlapItem) => ({
    x: it.lng * scale.pxPerDegLng,
    y: it.lat * scale.pxPerDegLat,
  });

  const placed: { x: number; y: number }[] = [];
  const isFree = (x: number, y: number) =>
    placed.every((p) => {
      const dx = x - p.x;
      const dy = y - p.y;
      return dx * dx + dy * dy >= threshSq;
    });

  order.forEach((it, index) => {
    const base = toPx(it);
    let spot = base;
    if (!isFree(base.x, base.y)) {
      // 가까운 고리부터: 필요한 만큼만 옮긴다.
      const radii = [minSep * SEPARATION_EPS, maxOffset];
      // 시작 각도를 항목마다 황금각으로 돌려 같은 자리에 여럿이 몰려도 서로 다른 방향을 본다.
      const start = index * 2.399963;
      let found: { x: number; y: number } | null = null;
      for (const radius of radii) {
        if (radius > maxOffset) break;
        for (let k = 0; k < RING_SLOTS && !found; k += 1) {
          const angle = start + (k * 2 * Math.PI) / RING_SLOTS;
          const cx = base.x + Math.cos(angle) * radius;
          const cy = base.y + Math.sin(angle) * radius;
          if (isFree(cx, cy)) found = { x: cx, y: cy };
        }
        if (found) break;
      }
      // 빈 자리가 없으면 옮기지 않는다 — 위치를 왜곡하는 것보다 겹침을 남기는 편이 낫다.
      if (found) spot = found;
    }
    placed.push(spot);
    const dLng = (spot.x - base.x) / scale.pxPerDegLng;
    const dLat = (spot.y - base.y) / scale.pxPerDegLat;
    if (dLng !== 0 || dLat !== 0) out.set(it.id, { dLat, dLng });
  });
  return out;
}

/** 그룹 대표점 = 멤버 좌표의 평균. */
function centerOf(group: PlacedMarker[]): { lat: number; lng: number } {
  let lat = 0;
  let lng = 0;
  group.forEach((m) => {
    lat += m.poi.lat;
    lng += m.poi.lng;
  });
  return { lat: lat / group.length, lng: lng / group.length };
}

/**
 * 멤버 집합에서 안정적인 클러스터 id 를 만든다.
 * 멤버가 같으면 항상 같은 값이라 오버레이를 재사용할 수 있고, POI id(숫자 문자열)와
 * 절대 겹치지 않도록 접두사를 붙인다.
 */
function clusterId(group: PlacedMarker[]): string {
  const ids = group.map((m) => m.poi.id).sort();
  return `cluster:${ids.join(',')}`;
}
