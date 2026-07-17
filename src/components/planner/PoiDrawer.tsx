import { useEffect } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Map as MapIcon,
  Plus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import CatBadge from '@/components/planner/parts/CatBadge.tsx';
import ImgPlaceholder from '@/components/planner/parts/ImgPlaceholder.tsx';
import Stars from '@/components/planner/parts/Stars.tsx';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';
import { won } from '@/utils/format.ts';
import { cn } from '@/utils/cn.ts';

/**
 * POI 상세. 데스크톱은 우측 420px 패널, 모바일은 바텀시트.
 * 표준 Layout 위에 떠야 하므로 fixed + 높은 z-index.
 */
export default function PoiDrawer() {
  const drawer = usePlannerStore((s) => s.drawer);
  const course = usePlannerStore((s) => s.course);
  const activeDay = usePlannerStore((s) => s.activeDay);
  const closeDrawer = usePlannerStore((s) => s.closeDrawer);
  const addPoi = usePlannerStore((s) => s.addPoi);
  const resolvePoi = usePlannerStore((s) => s.resolvePoi);

  useEffect(() => {
    if (!drawer.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, closeDrawer]);

  if (!drawer.open || !drawer.poiId) return null;
  const poi = resolvePoi(drawer.poiId);
  if (!poi) return null;

  const day = course.days[activeDay];
  const inDay = day?.items.includes(poi.id) ?? false;
  const priceText =
    poi.price === 0
      ? '무료'
      : poi.cat === 'stay'
        ? `${won(poi.price)} / 1박`
        : `${won(poi.price)} / 1인`;

  const info: [LucideIcon, string, string][] = [
    [Clock, '운영시간', poi.hours],
    [
      Wallet,
      poi.cat === 'stay' ? '객실 요금' : '예상 객단가',
      `${priceText} · ${poi.priceNote}`,
    ],
    [
      Users,
      '적합 인원',
      poi.buckets.map((b) => (b === '3-4' ? '3~4인' : `${b}인`)).join(', '),
    ],
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 motion-safe:animate-[coco-fade_0.2s_ease-out]"
        onClick={closeDrawer}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={poi.name}
        className={cn(
          'fixed z-50 flex flex-col bg-base-100 shadow-2xl',
          // 모바일: 바텀시트
          'inset-x-0 bottom-0 top-20 rounded-t-3xl',
          // 데스크톱: 우측 패널
          'lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[420px] lg:rounded-none lg:border-l lg:border-base-200',
          // 등장 모션 (모바일 슬라이드업 → 데스크톱 우측 슬라이드인)
          'motion-safe:animate-[coco-slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)]',
          'lg:motion-safe:animate-[coco-slide-in-right_0.3s_cubic-bezier(0.16,1,0.3,1)]',
        )}
      >
        <div className="relative shrink-0">
          <ImgPlaceholder label={poi.img} className="h-[240px] w-full" />
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="닫기"
            className="btn btn-sm btn-square absolute right-3 top-3 bg-base-100 shadow"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-3 left-3.5">
            <CatBadge cat={poi.cat} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-extrabold">{poi.name}</h3>
              <Stars value={poi.rating} reviews={poi.reviews} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {poi.tags.map((t) => (
                <span key={t} className="badge badge-sm badge-ghost">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-base-content/70">{poi.desc}</p>

          <div className="flex flex-col gap-2.5 rounded-2xl border border-base-200 p-3.5">
            {info.map(([Icon, k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-sm text-base-content/60">
                  <Icon size={15} />
                  {k}
                </span>
                <span className="text-right text-sm font-bold">{v}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => toast.info('카카오맵으로 연결 (데모)')}
            className="flex items-center justify-between gap-2 rounded-2xl border border-base-200 px-3.5 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <MapIcon size={16} className="text-cat-culture" />
              카카오맵에서 보기
            </span>
            <ArrowRight size={16} className="text-base-content/50" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-base-200 p-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={closeDrawer}
          >
            닫기
          </button>
          <button
            type="button"
            className={cn('btn grow gap-1', inDay ? 'btn-soft' : 'btn-primary')}
            onClick={() => addPoi(poi.id)}
          >
            {inDay ? <Check size={18} /> : <Plus size={18} />}
            {inDay ? `${day?.label}에 추가됨` : `${day?.label}에 추가`}
          </button>
        </div>
      </div>
    </>
  );
}
