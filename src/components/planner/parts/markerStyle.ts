import { cn } from '@/utils/cn.ts';
import type { PoiCat } from '@/types/planner.ts';

/**
 * 지도 마커의 공유 스타일.
 * 플레이스홀더 지도(React `Marker`)와 카카오맵 오버레이(DOM 직접 생성)가 같은 배지를 쓰도록
 * 컴포넌트 파일 밖에 둔다(`react-refresh/only-export-components` 회피).
 */

export const CAT_BG: Record<PoiCat, string> = {
  sight: 'bg-cat-sight',
  food: 'bg-cat-food',
  stay: 'bg-cat-stay',
  culture: 'bg-cat-culture',
};

/** 마커 배지(원형 핀)의 클래스. 활성(드로어 열림) 시 확대. */
export function markerBadgeClass(cat: PoiCat, active?: boolean): string {
  return cn(
    'flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white transition-transform hover:scale-110',
    CAT_BG[cat],
    active && 'scale-125',
  );
}

/** 순번 없는 마커에 쓰는 핀 아이콘(lucide `map-pin`). DOM 마커용 정적 SVG 문자열. */
export const MAP_PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';

/**
 * 마커에 붙는 코스 담기/빼기 토글 버튼의 클래스 (F6-a).
 *
 * 배지 오른쪽 아래에 겹쳐 둔다 — 배지 자체의 위치·크기를 건드리지 않아 좌표 앵커가 그대로다.
 * 터치 목표를 확보하려고 배지(28px)보다 조금 작은 22px 로 두고, 코스에 있으면 제거(빨강)·
 * 없으면 추가(브랜드색)로 색을 바꾼다.
 */
export function markerToggleClass(inCourse: boolean): string {
  return cn(
    'absolute -bottom-1.5 -right-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-base-100 shadow ring-1 ring-base-300 transition-transform hover:scale-110',
    inCourse ? 'text-error' : 'text-primary',
  );
}

/** 토글 버튼의 접근성 라벨·툴팁. 어느 Day 에 담기는지 이름으로 밝힌다. */
export function markerToggleLabel(
  inCourse: boolean,
  dayLabel: string,
  poiName: string,
): string {
  return inCourse
    ? `${poiName} ${dayLabel}에서 제거`
    : `${poiName} ${dayLabel}에 추가`;
}

/** 토글 아이콘(lucide `plus`/`minus`). DOM 마커용 정적 SVG 문자열. */
export const MARKER_PLUS_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
export const MARKER_MINUS_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
