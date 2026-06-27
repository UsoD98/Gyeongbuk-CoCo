import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { CollisionDetection, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import {
  COURSE_DROP_ID,
  CourseDragCtx,
  parseDragId,
} from '@/components/planner/dnd.ts';
import type { ActiveDrag } from '@/components/planner/dnd.ts';
import { poiById } from '@/mocks/planner.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';

/**
 * 플래너 드래그 앤 드롭 컨텍스트.
 * - 결과 카드(result:) → 코스에 드롭 위치 삽입
 * - 코스 아이템(course:) → 같은 day 내 재정렬, 코스 범위 밖으로 끌어내면 제거(데스크톱)
 * 데스크톱(결과+코스 동시)과 모바일(코스 탭 단독) 각각 독립 컨텍스트로 마운트한다.
 * mobile=true 면 잘못된 스크롤·드래그로 인한 제거를 막기 위해 범위 밖 제거를 비활성화한다.
 */

/** 포인터가 드롭존 위에 있을 때만 충돌로 인정 → 패널 밖에 놓으면 추가되지 않음 */
const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length ? within : rectIntersection(args);
};

export default function PlannerDndProvider({
  children,
  mobile = false,
}: {
  children: ReactNode;
  mobile?: boolean;
}) {
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const addPoi = usePlannerStore((s) => s.addPoi);
  const removePoi = usePlannerStore((s) => s.removePoi);
  const reorder = usePlannerStore((s) => s.reorder);

  const [active, setActive] = useState<ActiveDrag>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) =>
    setActive(parseDragId(String(e.active.id)));

  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const { over } = e;
    const a = parseDragId(String(e.active.id));
    if (!a) return;

    const overId = over ? String(over.id) : null;
    const overDrag = overId ? parseDragId(overId) : null;
    // 코스 영역(드롭존/코스 아이템) 위에 놓였는지. 그 외(패널 밖)는 모두 '범위 밖'.
    const overCourse = overId === COURSE_DROP_ID || overDrag?.kind === 'course';
    const items = course.days[activeDay]?.items ?? [];

    if (a.kind === 'course') {
      if (!overCourse) {
        // 코스 범위 밖으로 끌어내면 제거 (데스크톱 전용)
        if (!mobile) removePoi(activeDay, a.poiId);
        return;
      }
      const from = items.indexOf(a.poiId);
      if (from < 0) return;
      const to =
        overId === COURSE_DROP_ID
          ? items.length - 1
          : items.indexOf(overDrag!.poiId);
      reorder(activeDay, from, to);
      return;
    }

    // result → 코스 삽입 (코스 영역 위에 놓을 때만)
    if (!overCourse) return;
    let index = items.length;
    if (overId !== COURSE_DROP_ID) {
      const i = items.indexOf(overDrag!.poiId);
      if (i >= 0) index = i;
    }
    addPoi(a.poiId, index);
  };

  const overlayPoi = active ? poiById(active.poiId) : undefined;

  return (
    <CourseDragCtx.Provider value={active}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActive(null)}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {overlayPoi ? (
            <div className="flex max-w-60 items-center gap-2 rounded-xl bg-base-100 px-3 py-2 shadow-xl ring-2 ring-primary/40">
              <span className="truncate text-sm font-bold">
                {overlayPoi.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </CourseDragCtx.Provider>
  );
}
