import { useState } from 'react';
import {
  Bookmark,
  Car,
  Home,
  Pencil,
  Share2,
  Ticket,
  Users,
  Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { usePoiResolver } from '@/hooks/usePoiResolver.ts';
import { nightsFromRange } from '@/mocks/planner.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { BCATS, computeBudget, transportRateNote } from '@/utils/budget.ts';
import { TRANSPORT_LABEL, TRANSPORT_ORDER } from '@/utils/courseFormat.ts';
import { won } from '@/utils/format.ts';
import { cn } from '@/utils/cn.ts';
import type { Transport } from '@/api/tourCourse.ts';
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
  /** 코스 저장(GBC016 소유권 이전 / GBC020 편집 저장) 진행·완료 상태 — 버튼 비활성화용 */
  saving?: boolean;
  saved?: boolean;
  /** 저장 버튼 라벨. 호출부가 코스 상태에 맞춰 '저장'/'변경 저장'/'저장됨'을 넘긴다. */
  saveLabel?: string;
}

/** 예산 대시보드 (bars 변형). 입력은 store 의 course+pax+overrides 에서 파생 계산. */
export default function BudgetDashboard({
  compact = false,
  onSave,
  onShare,
  saving = false,
  saved = false,
  saveLabel,
}: Props) {
  const course = usePlannerStore((s) => s.course);
  const search = usePlannerStore((s) => s.search);
  const overrides = usePlannerStore((s) => s.overrides);
  const transport = usePlannerStore((s) => s.transport);
  const transportOverride = usePlannerStore((s) => s.transportOverride);
  const setTransport = usePlannerStore((s) => s.setTransport);
  const setTransportOverride = usePlannerStore((s) => s.setTransportOverride);
  const resetTransportOverride = usePlannerStore(
    (s) => s.resetTransportOverride,
  );
  const resolvePoi = usePoiResolver();

  // 교통비 직접 입력 중인지 (표시 전용 상태라 스토어에 두지 않는다).
  const [editingTransport, setEditingTransport] = useState(false);

  const nights = nightsFromRange(search.start, search.end);
  const { byCat, total, perPerson, n } = computeBudget({
    course,
    n: search.pax,
    overrides,
    days: nights + 1,
    resolve: resolvePoi,
    transport,
    transportOverride,
  });
  const cats = BCATS.map((c) => ({ ...c, value: byCat[c.key] }));
  const max = Math.max(total, 1);
  const transportEdited = transportOverride != null;

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
                disabled={saving || saved}
              >
                {saving ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Bookmark size={16} />
                )}
                {saveLabel ?? (saved ? '저장됨' : '저장')}
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
          const isTransport = c.key === 'transport';
          return (
            <div
              key={c.key}
              // 교통 행은 (수단 셀렉트 + 배지 + 금액 + 되돌리기)라 좁은 폭에서 한 줄에 다 안 들어간다
              // → 가로 스크롤 대신 줄바꿈으로 흘린다.
              className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white',
                    CAT_BG[c.key],
                  )}
                >
                  <Icon size={13} />
                </span>
                {c.label}
                {/* 이동수단 선택(F2) — 바꾸면 교통비 추정이 즉시 재계산된다. */}
                {isTransport && (
                  <select
                    aria-label="이동수단"
                    className="select select-xs w-[92px] rounded-lg font-semibold"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value as Transport)}
                  >
                    {/*
                      도보로 저장된 과거 코스를 열면 현재 값이 선택지에 없어 빈칸으로
                      보이므로, 그때만 그 값을 폴백 항목으로 덧붙인다.
                    */}
                    {(TRANSPORT_ORDER.includes(transport)
                      ? TRANSPORT_ORDER
                      : [...TRANSPORT_ORDER, transport]
                    ).map((t) => (
                      <option key={t} value={t}>
                        {TRANSPORT_LABEL[t]}
                      </option>
                    ))}
                  </select>
                )}
                {isTransport && !transportEdited && (
                  <span className="badge badge-xs badge-ghost shrink-0">
                    자동 추정
                  </span>
                )}
              </span>
              {isTransport ? (
                <span className="flex shrink-0 items-center gap-1.5">
                  {editingTransport ? (
                    <span className="flex h-7 items-center gap-1 rounded-lg border border-base-300 px-1.5">
                      <span className="text-xs text-base-content/50">₩</span>
                      <input
                        type="number"
                        aria-label="교통비"
                        min={0}
                        step={1000}
                        autoFocus
                        defaultValue={c.value}
                        className="w-20 bg-transparent text-right text-sm font-bold outline-none"
                        onBlur={(e) => {
                          setTransportOverride(Number(e.target.value));
                          setEditingTransport(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter')
                            (e.target as HTMLInputElement).blur();
                        }}
                      />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1"
                      onClick={() => setEditingTransport(true)}
                      title="교통비 직접 입력"
                    >
                      <span className="text-sm font-bold">{won(c.value)}</span>
                      <Pencil size={12} className="text-base-content/50" />
                      {transportEdited && (
                        <span className="badge badge-xs text-primary">
                          수정됨
                        </span>
                      )}
                    </button>
                  )}
                  {transportEdited && (
                    <button
                      type="button"
                      className="text-xs text-base-content/50"
                      onClick={resetTransportOverride}
                    >
                      되돌리기
                    </button>
                  )}
                </span>
              ) : (
                <span className="text-sm font-bold">{won(c.value)}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 교통비 근거·한계 안내. 이동수단·교통비는 서버에 저장되지 않으므로 그 사실도 밝힌다. */}
      <div className="rounded-xl bg-base-200 p-3 text-xs text-base-content/60">
        {transportEdited
          ? `교통비는 직접 입력한 금액이에요. 되돌리기를 누르면 ${transportRateNote(transport)}.`
          : `교통비는 ${transportRateNote(transport)}. 금액을 눌러 직접 고칠 수 있어요.`}{' '}
        이동수단·교통비 변경은 아직 코스에 저장되지 않아요(장소별 금액은 저장돼요).
      </div>
    </div>
  );
}
