import { useCallback, useMemo } from 'react';

import { POIS, REGIONS, paxBucket } from '@/mocks/planner.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 큐레이션 POI 목록(GBC017)의 데이터 소스를 캡슐화한 훅 — 목→API 교체 지점.
 *
 * ▷ 현재(P0): 목 데이터(`@/mocks/planner`)를 검색조건으로 동기 필터해 반환한다.
 * ▷ P2(GBC017, 백엔드 대기): 이 훅 내부만 `getPois(params)` + `useAsync`로 교체하면
 *   소비처(`ResultsPanel`)는 수정 없이 실데이터를 받는다. 반환 형태를 미리 비동기 3-상태
 *   (loading/error/reload)로 맞춰 두어 교체 시 컴포넌트가 바뀌지 않도록 한다.
 *
 * `dests` 는 시군구 코드 배열, `pax` 는 인원수, `themes` 는 테마 id 배열.
 */
export interface UsePoiListArgs {
  dests: string[];
  pax: number;
  themes: string[];
}

export interface PoiListState {
  pois: Poi[];
  /**
   * 데이터 제공 지역 여부(목 전용 게이트: `REGIONS.ready`).
   * P2에서는 '서버 결과 존재 여부'로 의미가 대체된다.
   */
  ready: boolean;
  loading: boolean;
  error: unknown;
  reload: () => void;
}

/**
 * 검색조건(목적지·인원·테마)으로 목 POI 필터 + 테마 매칭 우선 정렬.
 * P2에서 서버 필터(`GET /poi`)로 대체된다.
 */
function filterMockPois(dests: string[], pax: number, themes: string[]): Poi[] {
  const bucket = paxBucket(pax);
  let list = POIS.filter(
    (p) => dests.includes(p.region) && p.buckets.includes(bucket),
  );
  if (themes.length) {
    list = [...list].sort((a, b) => {
      const am = a.themes.some((t) => themes.includes(t)) ? 0 : 1;
      const bm = b.themes.some((t) => themes.includes(t)) ? 0 : 1;
      return am - bm;
    });
  }
  return list;
}

export function usePoiList({
  dests,
  pax,
  themes,
}: UsePoiListArgs): PoiListState {
  const pois = useMemo(
    () => filterMockPois(dests, pax, themes),
    [dests, pax, themes],
  );
  const ready = useMemo(
    () => dests.some((d) => REGIONS.find((r) => r.code === d)?.ready),
    [dests],
  );
  // 목 데이터는 동기라 항상 로딩 완료·에러 없음. reload 는 no-op(P2에서 useAsync.reload로 교체).
  const reload = useCallback(() => {}, []);
  return { pois, ready, loading: false, error: null, reload };
}
