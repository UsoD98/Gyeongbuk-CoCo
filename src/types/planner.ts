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
  /** food/sight/culture = 1인 기준, stay = 1박 객실 기준. 0 = 가격 정보 없음 */
  price: number;
  priceNote: string;
  /** 운영시간 원문. 빈 문자열 = 정보 없음 */
  hours: string;
  /** 코스 일정상의 방문 시각('HH:mm'). 코스에 편성된 장소만 갖는다(운영시간과 별개). */
  visitTime?: string;
  /** 별점(GBC017/018 `stars`, 0~5·소수 1자리). **0 = 평점 없음** → 표시를 생략한다. */
  rating: number;
  /** 리뷰 수. 백엔드에 대응 필드가 없어 항상 0(= 정보 없음)이다. */
  reviews: number;
  /** 지도 플레이스홀더 위 좌표(%). 카카오맵을 못 띄울 때 쓰는 폴백 지도 전용. */
  x: number;
  y: number;
  /** 실 위도(TourAPI `mapy`). 카카오맵 마커용. 좌표 미확보 시 undefined. */
  lat?: number;
  /** 실 경도(TourAPI `mapx`). 카카오맵 마커용. 좌표 미확보 시 undefined. */
  lng?: number;
  tags: string[];
  /** 이미지가 없을 때 쓰는 텍스트 라벨(플레이스홀더) */
  img: string;
  /** 실제 대표 이미지 URL(GBC017 `thumbnail`). 없으면 `img` 라벨로 폴백. */
  imageUrl?: string;
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

/** 위·경도 한 쌍. 장소명으로 찾은 좌표(F5) 등 좌표만 주고받는 자리에 쓴다. */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 코스 항목의 사용자 지정 시간(F1). 지정하지 않은 필드는 서버 원본(`baseSchedule`)·기본값을 쓴다.
 * 코스 저장(GBC020) 페이로드에서 방문 시각·체류시간의 최우선 근거가 된다.
 */
export interface PlaceTimeEdit {
  /** 방문 시각 'HH:mm'. 미지정이면 undefined. */
  time?: string;
  /** 체류 시간(분). 미지정이면 undefined. */
  durationMinutes?: number;
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
