/**
 * 예산 계산 엔진. `docs/sample.html`의 coco/budget.jsx 를 순수 함수로 이식.
 * course + pax + overrides 에서 예산을 파생 계산한다(상태로 저장하지 않음).
 */
import { poiById } from '@/mocks/planner.ts';
import type {
  Budget,
  BudgetCatKey,
  BudgetItem,
  Course,
  Poi,
  PoiCat,
} from '@/types/planner.ts';

export interface BudgetCatMeta {
  key: BudgetCatKey;
  label: string;
}

/** 예산 카테고리 메타 (표시 순서) */
export const BCATS: BudgetCatMeta[] = [
  { key: 'stay', label: '숙박' },
  { key: 'food', label: '식비' },
  { key: 'entry', label: '입장·관람' },
  { key: 'transport', label: '교통' },
];

/** POI 카테고리 → 예산 항목 */
export const catOf = (poiCat: PoiCat): BudgetCatKey =>
  poiCat === 'stay' ? 'stay' : poiCat === 'food' ? 'food' : 'entry';

/** override 없을 때 기본 비용: stay = 1박 객실 총액, 그 외 = 1인단가 × 인원 */
export function defaultCost(poi: Poi, n: number): number {
  if (poi.price === 0) return 0;
  if (poi.cat === 'stay') return poi.price;
  return poi.price * n;
}

/**
 * course(days[].items[poiId]) + pax + overrides + days → 예산.
 * 교통비는 좌표 기반 추정 자리(프로토타입과 동일): 8500 × max(1,days) × ceil(n/4).
 *
 * `resolve`: poiId → Poi 해석기. 기본은 목 데이터(poiById)지만, API 생성 코스의
 * 합성 POI까지 포함하려면 호출부가 plannerStore.resolvePoi 를 넘긴다.
 */
export function computeBudget(
  course: Course | undefined,
  n: number,
  overrides: Record<string, number> = {},
  days = 3,
  resolve: (id: string) => Poi | undefined = poiById,
): Budget {
  const items: BudgetItem[] = [];
  const byCat: Record<BudgetCatKey, number> = {
    stay: 0,
    food: 0,
    entry: 0,
    transport: 0,
  };

  (course?.days ?? []).forEach((day) => {
    (day.items ?? []).forEach((id) => {
      const poi = resolve(id);
      if (!poi) return;
      const bcat = catOf(poi.cat);
      const edited = overrides[id] != null;
      const cost = edited ? overrides[id] : defaultCost(poi, n);
      byCat[bcat] += cost;
      items.push({ poiId: id, poi, bcat, cost, edited });
    });
  });

  byCat.transport = 8500 * Math.max(1, days) * Math.ceil(n / 4 || 1);
  const total = byCat.stay + byCat.food + byCat.entry + byCat.transport;
  return { items, byCat, total, perPerson: n > 0 ? total / n : 0, n };
}
