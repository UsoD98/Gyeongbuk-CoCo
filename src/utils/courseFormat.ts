/**
 * 코스 표시용 공용 포맷 헬퍼.
 * 컬렉션 카드(GBC011)·공개뷰(GBC014) 등 여러 화면이 동일 규약으로 코스 메타를 표시한다.
 */

import type { Transport } from '@/api/tourCourse.ts';

/**
 * 이동수단 표시 라벨(백엔드 enum → 한국어).
 * `WALK` 는 더 이상 고를 수 없지만(→ `TRANSPORT_ORDER`) 그 값으로 저장된 과거 코스를
 * 컬렉션·공개뷰에서 표시해야 하므로 라벨은 남긴다.
 */
export const TRANSPORT_LABEL: Record<Transport, string> = {
  CAR: '자동차',
  PUBLIC_TRANSPORT: '대중교통',
  WALK: '도보',
};

/** 이동수단 선택 순서(홈 검색 폼 `Index.TRANSPORT_OPTIONS` 와 동일 순서). 도보는 선택 불가. */
export const TRANSPORT_ORDER: Transport[] = ['CAR', 'PUBLIC_TRANSPORT'];

/**
 * 코스 일정 장소 타입(백엔드 PlaceType, 실측 7종) → 한국어 라벨.
 * 미매핑 타입은 원문을 그대로 보여준다(폴백).
 */
export const PLACE_TYPE_LABEL: Record<string, string> = {
  ATTRACTION: '관광지',
  CULTURE: '문화시설',
  EVENT: '행사',
  LEPORTS: '레포츠',
  ACCOMMODATION: '숙박',
  SHOPPING: '쇼핑',
  FOOD: '음식점',
};

/** 'yyyy-MM-dd' → 'yyyy.MM.dd'. 파싱 없이 구분자만 치환(타임존 영향 없음). */
export function formatDate(ymd: string): string {
  return ymd.replaceAll('-', '.');
}

/** 'HH:mm:ss' → 'HH:mm'. 빈 값이면 빈 문자열. */
export function formatTime(time: string | undefined): string {
  return time?.slice(0, 5) ?? '';
}

/** 'yyyy-MM-dd' 두 날짜의 숙박 일수 → 'N박 M일'(당일이면 '당일'). */
export function tripDuration(startYmd: string, endYmd: string): string {
  const start = new Date(`${startYmd}T00:00:00`);
  const end = new Date(`${endYmd}T00:00:00`);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (!Number.isFinite(nights) || nights <= 0) return '당일';
  return `${nights}박 ${nights + 1}일`;
}
