/**
 * 플래너 도메인 타입.
 * 서버 API 응답으로 대체되기 전까지 목업(`@/mocks/planner`)이 채우는 API 비의존 타입.
 * 데이터 출처가 mocks → api 로 바뀌어도 이 타입은 그대로 유지한다.
 */

export type PoiCat = 'sight' | 'food' | 'stay' | 'culture';

/** 인원 버킷: 1인 / 2인 / 3~4인 */
export type PaxBucket = 1 | 2 | '3-4';

export interface Poi {
  id: string;
  region: string; // Region.code
  name: string;
  cat: PoiCat;
  themes: string[];
  buckets: PaxBucket[];
  /** food/sight/culture = 1인 기준, stay = 1박 객실 기준 */
  price: number;
  priceNote: string;
  hours: string;
  rating: number;
  reviews: number;
  /** 지도 플레이스홀더 위 좌표(%) */
  x: number;
  y: number;
  tags: string[];
  /** 실제 이미지 도입 전까지 쓰는 텍스트 라벨 */
  img: string;
  desc: string;
}

export interface Region {
  code: string;
  name: string;
  ready: boolean;
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
}

export interface CategoryMeta {
  label: string;
}

/** 코스의 하루. items 는 Poi.id 배열(경로 순서) */
export interface CourseDay {
  label: string;
  items: string[];
}

export interface Course {
  title: string;
  days: CourseDay[];
}

/** 예산 카테고리 키 (POI 카테고리를 예산 항목으로 묶은 것) */
export type BudgetCatKey = 'stay' | 'food' | 'entry' | 'transport';

export interface BudgetItem {
  poiId: string;
  poi: Poi;
  bcat: BudgetCatKey;
  cost: number;
  edited: boolean;
}

export interface Budget {
  items: BudgetItem[];
  byCat: Record<BudgetCatKey, number>;
  total: number;
  perPerson: number;
  n: number;
}
