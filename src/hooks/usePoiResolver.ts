import { useCallback } from 'react';

import { mergePoi, usePlannerStore } from '@/stores/plannerStore.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * poiId → Poi 해석기(React용).
 *
 * `plannerStore.resolvePoi` 를 직접 구독하면 **함수 참조가 절대 바뀌지 않아**
 * `apiPois`/`poiCatalog` 가 갱신돼도 컴포넌트가 리렌더되지 않는다 —
 * 코스 생성 응답의 `장소 #id` placeholder 가 큐레이션 목록(GBC017)이 도착한 뒤에도
 * 그대로 남던 원인. 이 훅은 두 레지스트리를 구독하므로 갱신되면 소비처가 다시 그려진다.
 */
export function usePoiResolver(): (id: string) => Poi | undefined {
  const apiPois = usePlannerStore((s) => s.apiPois);
  const poiCatalog = usePlannerStore((s) => s.poiCatalog);
  return useCallback(
    (id: string) => mergePoi(apiPois[id], poiCatalog[id]),
    [apiPois, poiCatalog],
  );
}
