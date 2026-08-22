import { Bus, Car, Footprints } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { formatTravelMinutes } from '@/utils/travelTime.ts';
import { cn } from '@/utils/cn.ts';
import type { Transport } from '@/api/tourCourse.ts';

const ICON: Record<Transport, LucideIcon> = {
  WALK: Footprints,
  PUBLIC_TRANSPORT: Bus,
  CAR: Car,
};

/**
 * 코스 항목 사이의 이동시간 표시(F3). 직선거리 기반 **추정치**라 '약'을 붙이고,
 * 근거는 `CoursePanel` 의 안내 한 줄에서 밝힌다.
 *
 * 드래그 대상이 아니므로 `SortableContext` 안에 있어도 sortable 로 등록하지 않는다
 * (항목 사이 간격으로만 존재한다).
 */
export default function TravelConnector({
  minutes,
  transport,
  className,
}: {
  minutes: number;
  transport: Transport;
  className?: string;
}) {
  const Icon = ICON[transport] ?? Car;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 pl-4 text-[11px] text-base-content/50',
        className,
      )}
    >
      <span aria-hidden className="h-3.5 w-px shrink-0 bg-base-300" />
      <Icon size={12} className="shrink-0" />
      <span>약 {formatTravelMinutes(minutes)} 이동</span>
    </div>
  );
}
