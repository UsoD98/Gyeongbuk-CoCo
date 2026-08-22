import { useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { Clock, Pencil, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CatBadge from '@/components/planner/parts/CatBadge.tsx';
import ImgPlaceholder from '@/components/planner/parts/ImgPlaceholder.tsx';
import { courseSortId } from '@/components/planner/dnd.ts';
import { defaultCost } from '@/utils/budget.ts';
import {
  findBasePlace,
  placeTypeOfCat,
  resolveDurationMinutes,
} from '@/utils/coursePayload.ts';
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
const stopDrag = (e: PointerEvent) => e.stopPropagation();
/** 카드 루트가 클릭으로 상세 드로어를 열기 때문에, 내부 컨트롤 클릭은 전파를 끊는다 */
const stopClick = (e: MouseEvent) => e.stopPropagation();

export default function CourseItem({ poi, n, dayIdx }: Props) {
  const pax = usePlannerStore((s) => s.search.pax);
  const override = usePlannerStore((s) => s.overrides[poi.id]);
  const timeEdit = usePlannerStore((s) => s.placeTimes[poi.id]);
  const baseSchedule = usePlannerStore((s) => s.baseSchedule);
  const removePoi = usePlannerStore((s) => s.removePoi);
  const editCost = usePlannerStore((s) => s.editCost);
  const resetCost = usePlannerStore((s) => s.resetCost);
  const setPlaceTime = usePlannerStore((s) => s.setPlaceTime);
  const setPlaceDuration = usePlannerStore((s) => s.setPlaceDuration);
  const resetPlaceTime = usePlannerStore((s) => s.resetPlaceTime);
  const openDrawer = usePlannerStore((s) => s.openDrawer);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: courseSortId(poi.id) });

  const [editing, setEditing] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const edited = override != null;
  const cost = edited ? override : defaultCost(poi, pax);

  // 서버 원본 일정의 이 장소 메타(체류시간·타입 근거). 표시와 저장 페이로드가 같은 규칙을 쓴다.
  const basePlace = useMemo(
    () => findBasePlace(baseSchedule, poi.id),
    [baseSchedule, poi.id],
  );
  // 방문 시각: 사용자 지정 → 코스 응답(`visitTime`). 둘 다 없으면 미지정(운영시간을 대신 보여준다).
  const visitTime = timeEdit?.time ?? poi.visitTime ?? '';
  const duration = resolveDurationMinutes(
    basePlace?.type ?? placeTypeOfCat(poi.cat),
    basePlace?.durationMinutes,
    timeEdit?.durationMinutes,
  );
  const timeEdited = timeEdit != null;

  // 카드 전체 클릭으로 상세 열기 (사진은 드래그 핸들로 제한)
  const openProps =
    openDrawer && {
      role: 'button',
      tabIndex: 0,
      'aria-label': `${poi.name} 상세 보기`,
      onClick: () => openDrawer(poi.id),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDrawer(poi.id);
        }
      },
    };

  return (
    <div
      {...openProps}
      className={cn(
        'card relative flex gap-2.5 rounded-2xl bg-base-100 p-2.5 shadow-sm transition-shadow',
        'cursor-default touch-none select-none hover:shadow-md',
        isDragging && 'opacity-50 ring-2 ring-primary/30',
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="flex flex-1 gap-2">
        {/* 사진 영역만 드래그 핸들로 지정: setNodeRef + listeners/attributes 를 여기로 옮김 */}
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={cn(
            'relative items-center justify-center my-auto shrink-0',
            // 사진에서만 드래그 가능하다는 시각적 단서
            'cursor-grab active:cursor-grabbing',
          )}
        >
          <ImgPlaceholder
            label={poi.img}
            src={poi.imageUrl}
            alt={poi.name}
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
              onClick={(e) => {
                stopClick(e);
                removePoi(dayIdx, poi.id);
              }}
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <CatBadge cat={poi.cat} />
            {/* 방문 시각·체류시간 편집(F1). 시각이 없으면 운영시간을 대신 보여준다. */}
            {!editingTime && (
              <button
                type="button"
                className="flex min-w-0 items-center gap-1 text-xs text-base-content/50"
                onPointerDown={stopDrag}
                onClick={(e) => {
                  stopClick(e);
                  setEditingTime(true);
                }}
                title="방문 시각·체류시간 수정"
              >
                <Clock size={11} className="shrink-0" />
                <span className="truncate">
                  {visitTime || poi.hours || '시각 지정'}
                </span>
                {duration > 0 && <span className="shrink-0">· {duration}분</span>}
                <Pencil size={10} className="shrink-0" />
                {timeEdited && (
                  <span className="badge badge-xs shrink-0 text-primary">
                    수정됨
                  </span>
                )}
              </button>
            )}
          </div>
          {editingTime && (
            <div
              className="flex flex-wrap items-center gap-1"
              onPointerDown={stopDrag}
              onClick={stopClick}
              onKeyDown={(e) => {
                // 카드 루트의 Enter/Space(상세 열기)로 새지 않게 막고, Escape 로 편집을 닫는다.
                e.stopPropagation();
                if (e.key === 'Escape') setEditingTime(false);
              }}
            >
              <input
                type="time"
                aria-label="방문 시각"
                value={visitTime}
                className="h-7 rounded-lg border border-base-300 bg-base-100 px-1.5 text-xs"
                onChange={(e) => setPlaceTime(poi.id, e.target.value)}
              />
              <span className="flex h-7 items-center gap-1 rounded-lg border border-base-300 px-1.5 text-xs">
                <input
                  type="number"
                  aria-label="체류 시간(분)"
                  min={0}
                  max={1440}
                  step={10}
                  defaultValue={duration}
                  className="w-11 bg-transparent text-right outline-none"
                  onBlur={(e) => setPlaceDuration(poi.id, Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                />
                <span className="text-base-content/50">분</span>
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setEditingTime(false)}
              >
                완료
              </button>
              {timeEdited && (
                <button
                  type="button"
                  className="text-xs text-base-content/50"
                  onClick={() => {
                    resetPlaceTime(poi.id);
                    setEditingTime(false);
                  }}
                >
                  되돌리기
                </button>
              )}
            </div>
          )}
          <div className="mt-0.5 flex items-center justify-between gap-1.5">
            {editing ? (
              <span
                className="flex h-[30px] max-w-[132px] items-center gap-1 rounded-lg border border-base-300 px-2"
                onClick={stopClick}
              >
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
                    e.stopPropagation();
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                />
              </span>
            ) : (
              <button
                type="button"
                className="flex items-center gap-1"
                onPointerDown={stopDrag}
                onClick={(e) => {
                  stopClick(e);
                  setEditing(true);
                }}
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
                onClick={(e) => {
                  stopClick(e);
                  resetCost(poi.id);
                }}
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
