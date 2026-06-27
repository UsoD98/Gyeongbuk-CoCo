import type { KeyboardEvent } from 'react';
import { Check, Plus } from 'lucide-react';

import CatBadge from '@/components/planner/parts/CatBadge.tsx';
import ImgPlaceholder from '@/components/planner/parts/ImgPlaceholder.tsx';
import Stars from '@/components/planner/parts/Stars.tsx';
import { won } from '@/utils/format.ts';
import { cn } from '@/utils/cn.ts';
import type { Poi } from '@/types/planner.ts';

interface Props {
  poi: Poi;
  variant?: 'stacked' | 'horizontal';
  inCourse?: boolean;
  onOpen?: () => void;
  onAdd?: () => void;
}

function priceText(poi: Poi): string {
  if (poi.price === 0) return '무료';
  return poi.cat === 'stay' ? `${won(poi.price)} /박` : `${won(poi.price)} /인`;
}

export default function POICard({
  poi,
  variant = 'stacked',
  inCourse = false,
  onOpen,
  onAdd,
}: Props) {
  // 카드 전체가 클릭 대상이므로 키보드(Enter/Space)로도 열 수 있게 한다.
  const openProps = onOpen && {
    role: 'button',
    tabIndex: 0,
    'aria-label': `${poi.name} 상세 보기`,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    },
  };

  const addBtn = (square: boolean) => (
    <button
      type="button"
      title={inCourse ? '코스에 추가됨' : '내 코스에 추가'}
      className={cn(
        'btn btn-sm gap-1',
        square && 'btn-square',
        inCourse ? 'btn-soft' : 'btn-primary',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onAdd?.();
      }}
    >
      {inCourse ? <Check size={16} /> : <Plus size={16} />}
      {!square && (inCourse ? '추가됨' : '코스 추가')}
    </button>
  );

  if (variant === 'horizontal') {
    return (
      <div
        {...openProps}
        className="card flex cursor-pointer gap-3 rounded-2xl bg-base-100 p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <ImgPlaceholder
          label={poi.img}
          className="h-[92px] w-[92px] shrink-0 rounded-xl"
        />
        <div className="flex min-w-0 grow flex-col justify-center gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <CatBadge cat={poi.cat} />
            <Stars value={poi.rating} />
          </div>
          <div className="font-bold leading-tight">{poi.name}</div>
          <div className="line-clamp-1 text-sm text-base-content/60">{poi.desc}</div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-primary">{priceText(poi)}</span>
            {onAdd && addBtn(true)}
          </div>
        </div>
      </div>
    );
  }

  // stacked (기본)
  return (
    <div
      {...openProps}
      className="card flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative">
        <ImgPlaceholder label={poi.img} className="aspect-[16/10] w-full" />
        <div className="absolute left-2 top-2">
          <CatBadge cat={poi.cat} />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="grow font-bold leading-tight">{poi.name}</div>
          <Stars value={poi.rating} />
        </div>
        <div className="line-clamp-2 min-h-[38px] text-sm text-base-content/60">
          {poi.desc}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {poi.tags.slice(0, 2).map((t) => (
            <span key={t} className="badge badge-sm badge-ghost">
              {t}
            </span>
          ))}
        </div>
        <hr className="border-base-200" />
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-primary">{priceText(poi)}</span>
          {onAdd && addBtn(false)}
        </div>
      </div>
    </div>
  );
}
