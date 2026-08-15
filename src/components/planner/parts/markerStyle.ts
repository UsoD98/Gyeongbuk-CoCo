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
