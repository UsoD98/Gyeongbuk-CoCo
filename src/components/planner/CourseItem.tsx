import { useState } from 'react';
import { Clock, Pencil, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CatBadge from '@/components/planner/parts/CatBadge.tsx';
import ImgPlaceholder from '@/components/planner/parts/ImgPlaceholder.tsx';
import { courseSortId } from '@/components/planner/dnd.ts';
import { defaultCost } from '@/utils/budget.ts';
import { won } from '@/utils/format.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { cn } from '@/utils/cn.ts';
import type { Poi } from '@/types/planner.ts';

interface Props {
  poi: Poi;
  n: number;
  dayIdx: number;
}

/** 카드 내부 인터랙티브 컨트롤에서 드래그가 시작되지 않도록 포인터다운 전파 차단 */
const stopDrag = (e: React.PointerEvent) => e.stopPropagation();

export default function CourseItem({ poi, n, dayIdx }: Props) {
  const pax = usePlannerStore((s) => s.search.pax);
  const override = usePlannerStore((s) => s.overrides[poi.id]);
  const removePoi = usePlannerStore((s) => s.removePoi);
  const editCost = usePlannerStore((s) => s.editCost);
  const resetCost = usePlannerStore((s) => s.resetCost);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: courseSortId(poi.id) });

  const [editing, setEditing] = useState(false);
  const edited = override != null;
  const cost = edited ? override : defaultCost(poi, pax);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'card relative flex gap-2.5 rounded-2xl bg-base-100 p-2.5 shadow-sm transition-shadow',
        'cursor-grab touch-none select-none hover:shadow-md active:cursor-grabbing',
        isDragging && 'opacity-50 ring-2 ring-primary/30',
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex flex-1 gap-2">
        <div className="relative items-center justify-center my-auto">
          <ImgPlaceholder
            label={poi.img}
            className="h-[64px] w-[64px] rounded-xl"
          />
          <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold text-white shadow">
            {n}
          </span>
        </div>

        <div className="flex min-w-0 grow flex-col gap-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="truncate font-bold">{poi.name}</span>
            <button
              type="button"
              className="btn btn-square btn-ghost btn-xs"
              onPointerDown={stopDrag}
              onClick={() => removePoi(dayIdx, poi.id)}
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <CatBadge cat={poi.cat} />
            <span className="flex items-center gap-1 text-xs text-base-content/50">
              <Clock size={11} />
              {poi.hours}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-1.5">
            {editing ? (
              <span className="flex h-[30px] max-w-[132px] items-center gap-1 rounded-lg border border-base-300 px-2">
                <span className="text-sm text-base-content/50">₩</span>
                <input
                  type="number"
                  autoFocus
                  defaultValue={cost}
                  className="w-20 bg-transparent font-bold outline-none"
                  onPointerDown={stopDrag}
                  onBlur={(e) => {
                    editCost(poi.id, Number(e.target.value));
                    setEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')
                      (e.target as HTMLInputElement).blur();
                  }}
                />
              </span>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1"
                onPointerDown={stopDrag}
                onClick={() => setEditing(true)}
                title="금액 수정"
              >
                <span className="font-extrabold">{won(cost)}</span>
                <Pencil size={12} className="text-base-content/50" />
                {edited && (
                  <span className="badge badge-xs text-primary">수정됨</span>
                )}
              </button>
            )}
            {edited && (
              <button
                type="button"
                className="text-xs text-base-content/50"
                onPointerDown={stopDrag}
                onClick={() => resetCost(poi.id)}
              >
                되돌리기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
