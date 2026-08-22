import { useEffect } from 'react';

import { placeholderPlaceName, usePlannerStore } from '@/stores/plannerStore.ts';
import { geocodePlaceName } from '@/utils/kakaoGeocode.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 좌표가 없는 코스 장소의 좌표를 장소명으로 찾아 스토어에 채운다(F5) — **폴백 전용**.
 *
 * 코스 상세·공개뷰(GBC012·014)가 `mapx`/`mapy` 를 주게 된 뒤(백엔드 0.6.3, 추적표 #8)
 * 대부분의 장소는 이 훅에 도달하기 전에 이미 좌표를 갖는다. 남는 대상은 백엔드 POI 캐시에
 * 없어 좌표가 `null` 로 온 장소뿐이다. 이 훅이 채운 좌표는 `plannerStore.placeCoords` 에 남고
 * `usePoiResolver`/`resolvePoi` 가 좌표 없는 장소에만 얹어 준다.
 *
 * - 이름이 placeholder(`장소 #id`)면 검색해도 의미가 없으니 건너뛴다.
 *   (실측: 캐시 미스 장소는 `placeName` 도 빈 문자열이라 대개 여기서 걸러진다.)
 * - 좌표를 이미 아는 장소(코스 응답·큐레이션 카탈로그·이전 검색 결과)는 대상이 아니다.
 * - 실패는 조용히 무시한다(지도는 "표시할 좌표가 없어요" 상태로 남는다).
 */
export function useCourseCoords(pois: Poi[]): void {
  const setPlaceCoords = usePlannerStore((s) => s.setPlaceCoords);

  // 배열은 매 렌더 새 참조라 effect 의존성으로 쓸 수 없다 → 조회 대상을 JSON 문자열로 고정한다
  // (장소명에 공백·쉼표가 섞여 있어 구분자를 직접 고르면 깨진다).
  const targets = JSON.stringify(
    pois
      .filter(
        (p) => p.lat == null && p.name && p.name !== placeholderPlaceName(p.id),
      )
      .map((p) => [p.id, p.name]),
  );

  useEffect(() => {
    const entries = JSON.parse(targets) as [string, string][];
    if (!entries.length) return;
    let cancelled = false;
    entries.forEach(([id, name]) => {
      void geocodePlaceName(name).then((coords) => {
        if (!cancelled && coords) setPlaceCoords(id, coords);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [targets, setPlaceCoords]);
}
