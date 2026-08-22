import { Fragment, useMemo } from 'react';
import { Plus, Route, Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import CourseItem from '@/components/planner/CourseItem.tsx';
import {
  COURSE_DROP_ID,
  courseSortId,
  useActiveDrag,
} from '@/components/planner/dnd.ts';
import EmptyState from '@/components/planner/parts/EmptyState.tsx';
import TravelConnector from '@/components/planner/parts/TravelConnector.tsx';
import { useCourseCoords } from '@/hooks/useCourseCoords.ts';
import { usePoiResolver } from '@/hooks/usePoiResolver.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';
import { cn } from '@/utils/cn.ts';
import { coordsOf, travelMinutes } from '@/utils/travelTime.ts';
import type { Poi } from '@/types/planner.ts';

/** 리스트 끝 삽입(append) 드롭존 겸 안내 문구 */
function AppendDrop() {
  const { setNodeRef, isOver } = useDroppable({ id: COURSE_DROP_ID });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-xl border border-dashed p-2 text-xs transition-colors',
        isOver
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-transparent text-base-content/50',
      )}
    >
      <Route size={13} />
      경로 순서대로 지도에 표시됩니다
    </div>
  );
}

/** 비어 있는 day 에 드롭해 첫 장소를 추가하는 드롭존 */
function EmptyDrop({ mobile, label }: { mobile: boolean; label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: COURSE_DROP_ID });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full rounded-2xl transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/30',
      )}
    >
      <EmptyState
        icon={Plus}
        title={`${label} 코스가 비어 있어요`}
        sub={
          mobile
            ? '결과 탭에서 마음에 드는 장소를 추가해 보세요.'
            : '오른쪽 결과에서 장소를 끌어다 놓거나 추가 버튼을 눌러 보세요.'
        }
      />
    </div>
  );
}

/** 코스 아이템 드래그 중 노출되는 안내: 코스 밖으로 끌어 놓으면 제거 */
function RemoveHint() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-error/40 py-3 text-sm font-medium text-error/80">
      <Trash2 size={16} />
      코스 밖으로 끌어 놓으면 제거돼요
    </div>
  );
}

export default function CoursePanel({ mobile = false }: { mobile?: boolean }) {
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const setActiveDay = usePlannerStore((s) => s.setActiveDay);
  const transport = usePlannerStore((s) => s.transport);
  const resolvePoi = usePoiResolver();

  const day = course.days[activeDay];
  const active = useActiveDrag();
  // 제거 안내는 코스 아이템을 드래그할 때만(데스크톱) 노출
  const showRemoveHint = !mobile && active?.kind === 'course';

  /** 활성 Day 의 렌더 대상(해석 실패한 장소는 애초에 그릴 수 없어 제외). */
  const items = useMemo(
    () =>
      (day?.items ?? [])
        .map((id) => resolvePoi(id))
        .filter((p): p is Poi => Boolean(p)),
    [day?.items, resolvePoi],
  );

  // 코스 조회 응답엔 좌표가 없다(GBC012) → 이동시간을 계산할 수 있게 장소명으로 좌표를 채운다.
  // `MapView` 와 같은 훅·같은 캐시(`placeCoords`)를 쓰므로 지도를 열지 않아도, 또 두 곳이
  // 동시에 마운트돼도 중복 조회가 되지 않는다.
  useCourseCoords(items);

  /** 항목 사이 이동시간(분). 좌표를 모르는 구간은 null → 표기 생략(0분으로 오해 방지). */
  const travel = useMemo(
    () =>
      items.map((poi, i) =>
        i === 0
          ? null
          : travelMinutes(coordsOf(items[i - 1]), coordsOf(poi), transport),
      ),
    [items, transport],
  );
  const hasTravel = travel.some((m) => m != null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-2.5 border-b border-base-200 bg-base-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-bold">
            <Route size={18} className="text-primary" />내 코스
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-1"
            onClick={() => toast.info('새 코스를 시작했어요')}
          >
            <Plus size={15} />새 코스
          </button>
        </div>
        <div className="truncate text-sm text-base-content/60">{course.title}</div>
        {/* 이동시간은 실 경로 API 가 아니라 직선거리 추정이라, 근거를 화면에 밝힌다(F3). */}
        {hasTravel && (
          <div className="text-xs text-base-content/50">
            항목 사이 이동시간은 직선거리 기반 추정치예요
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {course.days.map((d, i) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setActiveDay(i)}
              className={cn(
                'btn btn-xs rounded-full',
                activeDay === i
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300',
              )}
            >
              {d.label} <span className="opacity-70">· {d.items.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!day || day.items.length === 0 ? (
          <EmptyDrop mobile={mobile} label={day?.label ?? ''} />
        ) : (
          <SortableContext
            items={day.items.map(courseSortId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2.5">
              {items.map((poi, idx) => (
                <Fragment key={poi.id}>
                  {travel[idx] != null && (
                    <TravelConnector
                      minutes={travel[idx]}
                      transport={transport}
                    />
                  )}
                  <CourseItem poi={poi} n={idx + 1} dayIdx={activeDay} />
                </Fragment>
              ))}
              <AppendDrop />
            </div>
          </SortableContext>
        )}
      </div>

      {showRemoveHint && (
        <div className="shrink-0 border-t border-base-200 p-4">
          <RemoveHint />
        </div>
      )}
    </div>
  );
}
