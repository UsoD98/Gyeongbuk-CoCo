/**
 * 예산 계산 엔진. `docs/sample.html`의 coco/budget.jsx 를 순수 함수로 이식.
 * course + pax + overrides 에서 예산을 파생 계산한다(상태로 저장하지 않음).
 */
import type { Transport } from '@/api/tourCourse.ts';
import { TRANSPORT_LABEL } from '@/utils/courseFormat.ts';
import { won } from '@/utils/format.ts';
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

/** 자차 1대 정원(명). 인원이 넘으면 대수를 늘려 계산한다. */
export const CAR_CAPACITY = 4;

/**
 * 이동수단별 교통비 추정 계수(F2).
 *
 * ⚠️ **추정치다** — 백엔드는 교통비를 산정하지 않는다(0.5.9 에서 BU3 취소, 이동 비용은 FE 전담).
 * 근거: 대중교통 = 시군 간 시외버스·무궁화 편도 + 시내버스 몇 회를 1인 1일로 뭉친 값,
 * 자차 = 1일 100km 주행(연비 12km/L · 1,700원/L) + 통행료 + 주차를 1대 1일로 뭉친 값.
 * `unit` 이 과금 단위다 — 대중교통은 인원수, 자차는 대수(정원 4명)에 비례한다.
 */
export const TRANSPORT_RATE: Record<
  Transport,
  { perDay: number; unit: 'person' | 'vehicle' }
> = {
  WALK: { perDay: 0, unit: 'person' },
  PUBLIC_TRANSPORT: { perDay: 9_000, unit: 'person' },
  CAR: { perDay: 22_000, unit: 'vehicle' },
};

/** 이동수단·일수·인원 → 교통비 추정액. 미지의 수단은 자차 기준으로 폴백한다. */
export function estimateTransportCost(
  transport: Transport,
  days: number,
  n: number,
): number {
  const rate = TRANSPORT_RATE[transport] ?? TRANSPORT_RATE.CAR;
  const units =
    rate.unit === 'vehicle'
      ? Math.max(1, Math.ceil(Math.max(1, n) / CAR_CAPACITY))
      : Math.max(1, n);
  return rate.perDay * Math.max(1, days) * units;
}

/**
 * 교통비 추정 근거를 사용자에게 한 줄로 설명한다(F2 예산 탭 안내문).
 * 문구가 계수와 어긋나지 않게 `TRANSPORT_RATE` 에서 직접 만든다.
 */
export function transportRateNote(transport: Transport): string {
  const rate = TRANSPORT_RATE[transport] ?? TRANSPORT_RATE.CAR;
  const label = TRANSPORT_LABEL[transport] ?? TRANSPORT_LABEL.CAR;
  if (rate.perDay === 0) return `${label} 이동 기준이라 0원으로 잡아요`;
  const unit = rate.unit === 'vehicle' ? `1대(${CAR_CAPACITY}인)` : '1인';
  return `${label} ${unit} 1일 ${won(rate.perDay)} 기준 추정이에요`;
}

export interface BudgetArgs {
  course: Course | undefined;
  /** 인원 */
  n: number;
  /** poiId → 사용자가 고친 금액(총액) */
  overrides?: Record<string, number>;
  /** 여행 일수(밤 수 + 1) */
  days?: number;
  /**
   * poiId → Poi 해석기. 호출부(`BudgetDashboard`)가 `hooks/usePoiResolver` 를 넘긴다
   * (코스 장소 + 큐레이션 카탈로그). 넘기지 않으면 해석 불가 → 빈 예산.
   */
  resolve?: (id: string) => Poi | undefined;
  /** 이동수단(F2). 교통비 추정 계수를 고른다. 없으면 자차 기준. */
  transport?: Transport;
  /** 사용자가 직접 입력한 교통비(총액). null/undefined 면 추정치를 쓴다. */
  transportOverride?: number | null;
}

/**
 * course(days[].items[poiId]) + pax + overrides + days → 예산.
 * 교통비는 이동수단별 추정치(`estimateTransportCost`)이고, 사용자가 직접 입력한
 * `transportOverride` 가 있으면 그 값이 이긴다(F2).
 */
export function computeBudget({
  course,
  n,
  overrides = {},
  days = 3,
  resolve = () => undefined,
  transport = 'CAR',
  transportOverride = null,
}: BudgetArgs): Budget {
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

  byCat.transport =
    transportOverride != null
      ? Math.max(0, transportOverride)
      : estimateTransportCost(transport, days, n);
  const total = byCat.stay + byCat.food + byCat.entry + byCat.transport;
  return { items, byCat, total, perPerson: n > 0 ? total / n : 0, n };
}
