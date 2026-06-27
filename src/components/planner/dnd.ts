import { createContext, useContext } from 'react';

/**
 * 플래너 드래그 앤 드롭 공유 상수·헬퍼·컨텍스트.
 * 컴포넌트와 분리해 fast-refresh 경계를 깨지 않는다(PlannerDndProvider 는 컴포넌트만 export).
 */

export const COURSE_DROP_ID = '__course_drop__';
const RESULT_PREFIX = 'result:';
const COURSE_PREFIX = 'course:';

/** 결과 카드(드래그 소스) id */
export const resultDragId = (poiId: string) => RESULT_PREFIX + poiId;
/** 코스 아이템(sortable) id */
export const courseSortId = (poiId: string) => COURSE_PREFIX + poiId;

export type ActiveDrag = { kind: 'result' | 'course'; poiId: string } | null;

export function parseDragId(id: string): ActiveDrag {
  if (id.startsWith(RESULT_PREFIX))
    return { kind: 'result', poiId: id.slice(RESULT_PREFIX.length) };
  if (id.startsWith(COURSE_PREFIX))
    return { kind: 'course', poiId: id.slice(COURSE_PREFIX.length) };
  return null;
}

export const CourseDragCtx = createContext<ActiveDrag>(null);
/** 현재 드래그 중인 항목(휴지통 드롭존 노출 판단 등). 없으면 null */
export const useActiveDrag = () => useContext(CourseDragCtx);
