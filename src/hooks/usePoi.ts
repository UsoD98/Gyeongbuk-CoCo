import { usePlannerStore } from '@/stores/plannerStore.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 단일 POI(상세 드로어용, GBC018)의 데이터 소스를 캡슐화한 훅 — 목→API 교체 지점.
 *
 * ▷ 현재(P0): 플래너 스토어의 `resolvePoi`(생성/상세로 채워진 `apiPois` → 없으면 목)로 해석.
 * ▷ P3(GBC018, 백엔드 대기): 이 훅 내부에서 `getPoi(contentId)`로 실상세를 불러와 병합하면
 *   `PoiDrawer`는 수정 없이 실데이터를 받는다.
 *
 * ⚠️ 훅이므로 조건부로 호출하지 말 것(컴포넌트 최상단에서 호출). `poiId` 가 null 이면 undefined 반환.
 */
export function usePoi(poiId: string | null): Poi | undefined {
  const resolvePoi = usePlannerStore((s) => s.resolvePoi);
  return poiId ? resolvePoi(poiId) : undefined;
}
