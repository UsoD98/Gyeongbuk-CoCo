import {
  Bookmark,
  Car,
  Home,
  Share2,
  Ticket,
  Users,
  Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { nightsFromRange } from '@/mocks/planner.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { BCATS, computeBudget } from '@/utils/budget.ts';
import { won } from '@/utils/format.ts';
import { cn } from '@/utils/cn.ts';
import type { BudgetCatKey } from '@/types/planner.ts';

const CAT_ICON: Record<BudgetCatKey, LucideIcon> = {
  stay: Home,
  food: Utensils,
  entry: Ticket,
  transport: Car,
};

const CAT_BG: Record<BudgetCatKey, string> = {
  stay: 'bg-cat-stay',
  food: 'bg-cat-food',
  entry: 'bg-cat-culture',
  transport: 'bg-base-content/30',
};

interface Props {
  compact?: boolean;
  onSave?: () => void;
  onShare?: () => void;
}

/** 예산 대시보드 (bars 변형). 입력은 store 의 course+pax+overrides 에서 파생 계산. */
export default function BudgetDashboard({
  compact = false,
  onSave,
  onShare,
}: Props) {
  const course = usePlannerStore((s) => s.course);
  const search = usePlannerStore((s) => s.search);
  const overrides = usePlannerStore((s) => s.overrides);
  const resolvePoi = usePlannerStore((s) => s.resolvePoi);

  const nights = nightsFromRange(search.start, search.end);
  const { byCat, total, perPerson, n } = computeBudget(
    course,
    search.pax,
    overrides,
    nights + 1,
    resolvePoi,
  );
  const cats = BCATS.map((c) => ({ ...c, value: byCat[c.key] }));
  const max = Math.max(total, 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-base-content/60">
              총 예상 예산
            </span>
            <span
              className={cn(
                'font-extrabold tracking-tight',
                compact ? 'text-2xl' : 'text-3xl',
              )}
            >
              {won(total)}
            </span>
          </div>
          <div className="flex flex-col gap-1 pb-0.5">
            <span className="flex items-center gap-1 text-xs font-semibold text-base-content/60">
              <Users size={12} />1인당 ({n}명)
            </span>
            <span
              className={cn(
                'font-extrabold text-primary',
                compact ? 'text-lg' : 'text-xl',
              )}
            >
              {won(perPerson)}
            </span>
          </div>
        </div>
        {(onSave || onShare) && !compact && (
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                type="button"
                className="btn btn-sm btn-outline gap-1"
                onClick={onSave}
              >
                <Bookmark size={16} />저장
              </button>
            )}
            {onShare && (
              <button
                type="button"
                className="btn btn-sm btn-primary gap-1"
                onClick={onShare}
              >
                <Share2 size={16} />공유
              </button>
            )}
          </div>
        )}
      </div>

      {/* 스택 막대 */}
      <div className="flex h-2.5 overflow-hidden rounded-full bg-base-200">
        {cats
          .filter((c) => c.value > 0)
          .map((c) => (
            <span
              key={c.key}
              className={cn('h-full', CAT_BG[c.key])}
              style={{ width: `${(c.value / max) * 100}%` }}
            />
          ))}
      </div>

      {/* 카테고리별 금액 */}
      <div className="flex flex-col gap-2.5">
        {cats.map((c) => {
          const Icon = CAT_ICON[c.key];
          return (
            <div
              key={c.key}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-lg text-white',
                    CAT_BG[c.key],
                  )}
                >
                  <Icon size={13} />
                </span>
                {c.label}
                {c.key === 'transport' && (
                  <span className="badge badge-xs badge-ghost">자동 추정</span>
                )}
              </span>
              <span className="text-sm font-bold">{won(c.value)}</span>
            </div>
          );
        })}
      </div>

      {compact && (
        <div className="rounded-xl bg-base-200 p-3 text-xs text-base-content/60">
          교통비는 평균 객단가 기반 추정치예요. 코스 탭에서 항목별로 직접
          수정할 수 있어요.
        </div>
      )}
    </div>
  );
}
