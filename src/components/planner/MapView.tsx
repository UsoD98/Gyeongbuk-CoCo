import { useCallback, useMemo, useState } from 'react';

import ConfirmDialog from '@/components/common/ConfirmDialog.tsx';
import { projectToPlaceholder } from '@/components/planner/mapModel.ts';
import type { MapMarker } from '@/components/planner/mapModel.ts';
import KakaoMap from '@/components/planner/parts/KakaoMap.tsx';
import PlaceholderMap from '@/components/planner/parts/PlaceholderMap.tsx';
import { useCourseCoords } from '@/hooks/useCourseCoords.ts';
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
 * 코스 장소의 좌표는 상세·공개뷰 응답(GBC012·014)의 `mapx`/`mapy` 로 온다 — 백엔드 캐시 미스로
 * 좌표가 null 인 장소만 장소명 검색으로 메운다(`useCourseCoords` 폴백).
 *
 * 지도에서의 코스 편집(F6)은 **마커 토글**로 한다 — 드래그 대신 마커의 +/− 버튼 한 번으로
 * 활성 Day 에 담거나 뺀다. 드래그 방식은 카카오맵 오버레이가 React 밖 DOM 이고 모바일에서는
 * 지도와 코스 패널이 동시에 보이지 않아(탭 전환) 성립하지 않는다 — 판단 근거는 보드 F6 참조.
 */
export default function MapView({ pois }: { pois: Poi[] }) {
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const drawerPoiId = usePlannerStore((s) => s.drawer.poiId);
  const openDrawer = usePlannerStore((s) => s.openDrawer);
  const addPoi = usePlannerStore((s) => s.addPoi);
  const removePoi = usePlannerStore((s) => s.removePoi);
  // 코스 항목은 목이 아니라 해석기로 푼다(API 코스 장소·큐레이션 카탈로그 병합).
  const resolvePoi = usePoiResolver();
  const [kakaoFailed, setKakaoFailed] = useState(false);
  /** 빼기 확인 대기 중인 장소 id(null = 대화상자 닫힘). */
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  const day = course.days[activeDay];
  const dayItems = day?.items;
  // 담을 Day 가 없으면(빈 코스) 토글을 숨긴다.
  const dayLabel = day?.label ?? null;

  /** 활성 Day 경로(코스 순서 그대로). */
  const route = useMemo(
    () =>
      (dayItems ?? [])
        .map((id) => resolvePoi(id))
        .filter((p): p is Poi => Boolean(p)),
    [dayItems, resolvePoi],
  );

  // 좌표 없는 코스 장소는 이름으로 좌표를 찾아 스토어에 채운다(도착하면 route 가 갱신된다).
  useCourseCoords(route);

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

  /**
   * 마커 토글(F6) — 활성 Day 에 있으면 빼고, 없으면 담는다.
   * 담기는 `addPoi`(맨 뒤 삽입·중복은 스토어가 toast 로 거절), 빼기는 `removePoi`.
   * 둘 다 `dirty` 를 세우므로 저장 버튼이 '변경 저장'으로 바뀐다.
   *
   * **빼기만 확인을 받는다** — 마커의 −/+ 버튼은 20px 남짓이라 지도를 짚다 잘못 누르기 쉽고,
   * 빼면 그 자리에서 정해 둔 시각·체류시간·비용까지 함께 날아간다. 담기는 잘못 눌러도
   * 바로 되돌릴 수 있으므로 묻지 않는다.
   */
  const toggleInCourse = useCallback(
    (poiId: string) => {
      if (!day) return;
      if (day.items.includes(poiId)) setPendingRemoval(poiId);
      else addPoi(poiId);
    },
    [addPoi, day],
  );

  /** 확인 문구에 쓸 장소명(해석 실패하면 이름 없이 묻는다). */
  const pendingRemovalName = pendingRemoval
    ? (resolvePoi(pendingRemoval)?.name ?? null)
    : null;

  const confirmRemoval = useCallback(() => {
    if (pendingRemoval) removePoi(activeDay, pendingRemoval);
    setPendingRemoval(null);
  }, [activeDay, pendingRemoval, removePoi]);

  const map = (() => {
    if (kakaoFailed) {
      // 폴백 지도는 % 좌표로 그린다 → 실좌표가 있는 장소는 그 집합에 맞춰 재투영해야
      // 코스 장소(원래 x/y 가 전부 50)가 중앙에 겹치지 않는다.
      const positions = projectToPlaceholder([
        ...route,
        ...markers.map((m) => m.poi),
      ]);
      const place = (poi: Poi): Poi => {
        const pos = positions.get(poi.id);
        return pos ? { ...poi, x: pos.x, y: pos.y } : poi;
      };
      return (
        <PlaceholderMap
          markers={markers.map((m) => ({ ...m, poi: place(m.poi) }))}
          route={route.map(place)}
          onSelect={openDrawer}
          onToggle={toggleInCourse}
          dayLabel={dayLabel}
        />
      );
    }

    return (
      <KakaoMap
        markers={markers}
        route={route}
        onSelect={openDrawer}
        onToggle={toggleInCourse}
        dayLabel={dayLabel}
        onFail={() => setKakaoFailed(true)}
      />
    );
  })();

  return (
    <>
      {map}
      <ConfirmDialog
        open={pendingRemoval !== null}
        title="코스에서 뺄까요?"
        description={
          pendingRemovalName
            ? `${pendingRemovalName}을(를) ${dayLabel} 일정에서 뺍니다. 지정해 둔 시각·체류시간·비용도 함께 사라져요.`
            : undefined
        }
        confirmLabel="빼기"
        cancelLabel="취소"
        danger
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </>
  );
}
