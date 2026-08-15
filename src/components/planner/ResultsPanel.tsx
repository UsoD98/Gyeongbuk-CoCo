import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Compass,
  Layers,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

import ErrorState from '@/components/common/ErrorState.tsx';
import Skeleton from '@/components/common/Skeleton.tsx';
import MapView from '@/components/planner/MapView.tsx';
import POICard from '@/components/planner/POICard.tsx';
import { resultDragId } from '@/components/planner/dnd.ts';
import EmptyState from '@/components/planner/parts/EmptyState.tsx';
import { getApiErrorMessage } from '@/api/types.ts';
import { usePoiList } from '@/hooks/usePoiList.ts';
import { usePoiResolver } from '@/hooks/usePoiResolver.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { useSigunguStore } from '@/stores/sigunguStore.ts';
import { cn } from '@/utils/cn.ts';
import type { Poi } from '@/types/planner.ts';

interface CardProps {
  poi: Poi;
  inCourse: boolean;
  onOpen: () => void;
  onAdd: () => void;
}

/** 데스크톱: 결과 카드를 코스로 끌어다 놓을 수 있게 래핑. 이미 담긴 항목은 드래그 비활성 */
function DraggablePOICard({ poi, inCourse, onOpen, onAdd }: CardProps) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: resultDragId(poi.id),
    disabled: inCourse,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        !inCourse && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <POICard poi={poi} inCourse={inCourse} onOpen={onOpen} onAdd={onAdd} />
    </div>
  );
}

const CAT_CHIPS = [
  ['all', '전체'],
  ['sight', '관광지'],
  ['food', '음식점'],
  ['stay', '숙박'],
  ['culture', '문화'],
] as const;

/** 한 시군구에 수백 곳이 오므로(경주 324곳 실측) 초기 렌더는 잘라 두고 '더 보기'로 늘린다. */
const PAGE_SIZE = 60;

/** 대체 진입점: 데이터가 확실한 경주시(시군구 코드 130)로 둘러보기. */
const FALLBACK_DEST = '130';

export default function ResultsPanel({ mobile = false }: { mobile?: boolean }) {
  const search = usePlannerStore((s) => s.search);
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const openDrawer = usePlannerStore((s) => s.openDrawer);
  const addPoi = usePlannerStore((s) => s.addPoi);
  const setSearch = usePlannerStore((s) => s.setSearch);
  const getSigunguLabel = useSigunguStore((s) => s.getSigunguLabel);
  const resolvePoi = usePoiResolver();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [cat, setCat] = useState<string>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [pageKey, setPageKey] = useState('');

  // POI 데이터 소스는 usePoiList 훅으로 캡슐화(P0) → P2에서 훅 내부만 GBC017 실API로 교체됨.
  const { pois, ready, loading, error, reload } = usePoiList({
    dests: search.dests,
    pax: search.pax,
  });

  // 지역·카테고리가 바뀌면 다시 처음 페이지부터 보여준다.
  // (effect 대신 렌더 중 조정 — React 권장 패턴, 추가 리렌더 1회로 끝난다)
  const destKey = search.dests.join(',');
  const currentPageKey = `${destKey}|${cat}`;
  if (pageKey !== currentPageKey) {
    setPageKey(currentPageKey);
    setLimit(PAGE_SIZE);
  }

  // search.dests 는 시군구 코드. 지역명은 sigunguStore 로 해석한다(복수 선택 시 모두 표기).
  const regionName = search.dests.length
    ? search.dests
        .map((d) => getSigunguLabel(d) ?? d)
        .join(', ')
    : undefined;
  const shown = cat === 'all' ? pois : pois.filter((p) => p.cat === cat);
  // 코스에 편성된 장소는 코스 응답이 가격·운영시간을 더 갖고 있다 → 해석기를 거쳐
  // 카드와 상세 드로어가 같은 값을 보여주게 한다(그 외 장소는 카탈로그 그대로).
  const visible = shown.slice(0, limit).map((p) => resolvePoi(p.id) ?? p);
  const inDay = (id: string) =>
    course.days[activeDay]?.items.includes(id) ?? false;

  const header = (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1.5 font-bold">
            <Compass size={18} className="text-primary" />
            {regionName ?? '결과'}
          </span>
          <span className="badge badge-sm badge-ghost">{pois.length}곳</span>
        </div>
        <div className="join">
          <button
            type="button"
            className={cn(
              'btn btn-xs join-item gap-1',
              viewMode === 'list' ? 'btn-primary' : 'btn-ghost',
            )}
            onClick={() => setViewMode('list')}
          >
            <LayoutGrid size={14} />
            리스트
          </button>
          <button
            type="button"
            className={cn(
              'btn btn-xs join-item gap-1',
              viewMode === 'map' ? 'btn-primary' : 'btn-ghost',
            )}
            onClick={() => setViewMode('map')}
          >
            <MapIcon size={14} />
            지도
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CAT_CHIPS.map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setCat(k)}
            className={cn(
              'btn btn-xs rounded-full',
              cat === k ? 'btn-primary' : 'btn-ghost border border-base-300',
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );

  const gridCls = cn(
    'grid gap-3.5',
    mobile ? 'grid-cols-1' : 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]',
  );

  const shell = (body: ReactNode) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-base-200 bg-base-100 p-4">
        {header}
      </div>
      {body}
    </div>
  );

  const browseGyeongju = (
    <button
      type="button"
      className="btn btn-sm btn-soft"
      onClick={() => setSearch({ dests: [FALLBACK_DEST] })}
    >
      경주시로 둘러보기
    </button>
  );

  // 지역 미선택(코스 상세로 바로 진입하면 search.dests 가 비어 있다)
  if (!search.dests.length) {
    return shell(
      <EmptyState
        icon={MapPin}
        title="둘러볼 지역을 선택해 주세요"
        sub="홈에서 여행지를 고르면 그 지역의 추천 장소를 보여드려요."
        action={browseGyeongju}
      />,
    );
  }

  // 최초 로딩(이전 결과가 없을 때만 — 조건 변경 재조회는 stale-while-revalidate)
  if (loading && !pois.length) {
    return shell(
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className={gridCls}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              className={cn('w-full rounded-2xl', mobile ? 'h-28' : 'h-64')}
            />
          ))}
        </div>
      </div>,
    );
  }

  if (error && !pois.length) {
    return shell(
      <ErrorState
        title="추천 장소를 불러오지 못했어요"
        description={getApiErrorMessage(error)}
        onRetry={reload}
      />,
    );
  }

  // 서버가 available:false → 해당 시군구는 큐레이션 데이터 미제공
  if (!ready) {
    return shell(
      <EmptyState
        icon={Layers}
        title="데이터 준비 중인 지역이에요"
        sub="아직 이 지역의 추천 장소 데이터가 없어요. 다른 시군구를 골라보세요."
        action={search.dests.includes(FALLBACK_DEST) ? undefined : browseGyeongju}
      />,
    );
  }

  // 카테고리 칩으로 걸러 남은 게 없을 때
  if (!shown.length) {
    return shell(
      <EmptyState
        icon={Layers}
        title="이 카테고리에는 결과가 없어요"
        sub="다른 카테고리를 선택해 보세요."
        action={
          <button
            type="button"
            className="btn btn-sm btn-soft"
            onClick={() => setCat('all')}
          >
            전체 보기
          </button>
        }
      />,
    );
  }

  return shell(
    viewMode === 'map' ? (
      <div className="relative min-h-80 flex-1">
        <MapView pois={visible} />
      </div>
    ) : (
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className={gridCls}>
          {visible.map((p) =>
            mobile ? (
              <POICard
                key={p.id}
                poi={p}
                variant="horizontal"
                inCourse={inDay(p.id)}
                onOpen={() => openDrawer(p.id)}
                onAdd={() => addPoi(p.id)}
              />
            ) : (
              <DraggablePOICard
                key={p.id}
                poi={p}
                inCourse={inDay(p.id)}
                onOpen={() => openDrawer(p.id)}
                onAdd={() => addPoi(p.id)}
              />
            ),
          )}
        </div>
        {shown.length > visible.length && (
          <div className="flex justify-center pt-4">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
            >
              더 보기 ({visible.length}/{shown.length})
            </button>
          </div>
        )}
      </div>
    ),
  );
}
