import { useState } from 'react';
import { Compass, Layers, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

import MapView from '@/components/planner/MapView.tsx';
import POICard from '@/components/planner/POICard.tsx';
import { resultDragId } from '@/components/planner/dnd.ts';
import EmptyState from '@/components/planner/parts/EmptyState.tsx';
import { POIS, REGIONS, paxBucket } from '@/mocks/planner.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
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

/** 검색조건(목적지·인원·테마)으로 POI 필터 + 테마 매칭 우선 정렬 */
function filterPois(dests: string[], pax: number, themes: string[]): Poi[] {
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

export default function ResultsPanel({ mobile = false }: { mobile?: boolean }) {
  const search = usePlannerStore((s) => s.search);
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const openDrawer = usePlannerStore((s) => s.openDrawer);
  const addPoi = usePlannerStore((s) => s.addPoi);
  const setSearch = usePlannerStore((s) => s.setSearch);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [cat, setCat] = useState<string>('all');

  const pois = filterPois(search.dests, search.pax, search.themes);
  const region = REGIONS.find((r) => r.code === search.dests[0]);
  const ready = search.dests.some(
    (d) => REGIONS.find((r) => r.code === d)?.ready,
  );
  const shown = cat === 'all' ? pois : pois.filter((p) => p.cat === cat);
  const inDay = (id: string) =>
    course.days[activeDay]?.items.includes(id) ?? false;

  const header = (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1.5 font-bold">
            <Compass size={18} className="text-primary" />
            {region?.name ?? '결과'}
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

  if (!ready) {
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-base-200 p-4">{header}</div>
        <EmptyState
          icon={Layers}
          title="데이터 준비 중인 지역이에요"
          sub="경주·포항·영덕·안동부터 코스·예산 데이터를 제공하고 있어요. 곧 더 많은 시군구를 만나보세요."
          action={
            <button
              type="button"
              className="btn btn-sm btn-soft"
              onClick={() => setSearch({ dests: ['gyeongju'] })}
            >
              경주로 둘러보기
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-base-200 bg-base-100 p-4">
        {header}
      </div>
      {viewMode === 'map' ? (
        <div className="relative min-h-80 flex-1">
          <MapView pois={shown} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div
            className={cn(
              'grid gap-3.5',
              mobile
                ? 'grid-cols-1'
                : 'grid-cols-[repeat(auto-fill,minmax(200px,1fr))]',
            )}
          >
            {shown.map((p) =>
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
        </div>
      )}
    </div>
  );
}
