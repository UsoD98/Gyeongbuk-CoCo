import { useEffect } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  Globe,
  Map as MapIcon,
  MapPin,
  Phone,
  Plus,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import Skeleton from '@/components/common/Skeleton.tsx';
import CatBadge from '@/components/planner/parts/CatBadge.tsx';
import ImgPlaceholder from '@/components/planner/parts/ImgPlaceholder.tsx';
import LikeButton from '@/components/planner/LikeButton.tsx';
import Stars from '@/components/planner/parts/Stars.tsx';
import { getApiErrorMessage } from '@/api/types.ts';
import { usePoi } from '@/hooks/usePoi.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { kakaoMapPlaceUrl } from '@/utils/kakaoMap.ts';
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
  // POI 데이터 소스는 usePoi 훅으로 캡슐화(P0). P3(GBC018)에서 실상세 조회로 교체 —
  // 목록/코스로 이미 아는 값은 즉시 그리고 상세(소개·연락처·부가정보)는 도착하는 대로 채운다.
  // 훅은 조건부 호출 불가 → 최상단에서 호출(poiId 없으면 조회하지 않는다).
  const { poi, detail, loading, error, reload } = usePoi(drawer.poiId);

  useEffect(() => {
    if (!drawer.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, closeDrawer]);

  if (!drawer.open || !drawer.poiId || !poi) return null;

  const day = course.days[activeDay];
  const inDay = day?.items.includes(poi.id) ?? false;
  // 가격 0 은 '무료'일 수도, 데이터 미제공(GBC017 avgPrice=null)일 수도 있다 → priceNote 가 구분한다.
  const priceText =
    poi.price === 0
      ? poi.priceNote
      : poi.cat === 'stay'
        ? `${won(poi.price)} / 1박 · ${poi.priceNote}`
        : `${won(poi.price)} / 1인 · ${poi.priceNote}`;

  const info: [LucideIcon, string, string][] = [
    [Clock, '운영시간', poi.hours || '정보 준비 중'],
    [Wallet, poi.cat === 'stay' ? '객실 요금' : '예상 객단가', priceText],
    [
      Users,
      '적합 인원',
      poi.buckets.map((b) => (b === '3-4' ? '3~4인' : `${b}인`)).join(', '),
    ],
  ];

  // 상세(GBC018)로만 오는 값들. 없으면 행 자체를 만들지 않는다(빈 값 나열 방지).
  const address = [detail?.addr1, detail?.addr2]
    .map((v) => v?.trim())
    .filter(Boolean)
    .join(' ');
  const tel = detail?.tel?.trim();
  const homepage = detail?.homepage?.trim();
  // 백엔드가 HTML 을 제거해 주므로 홈페이지는 URL 텍스트로 온다(여러 개면 첫 번째만 링크).
  // 프로토콜 없는 표기(`www.…`)나 안내문이 섞여 오면 링크 대신 텍스트로 보여준다.
  const homepageUrl = homepage?.match(/https?:\/\/\S+/)?.[0];
  const overview = detail?.overview?.trim();
  // 부가정보는 이름·내용이 모두 있는 행만 쓴다(백엔드가 한쪽만 있는 행도 담는다).
  // 위 정보 카드의 '운영시간' 으로 이미 쓴 항목은 같은 값을 두 번 보여주지 않도록 제외한다.
  const extras = (detail?.infoList ?? []).filter(
    (i) =>
      i.infoname?.trim() &&
      i.infotext?.trim() &&
      i.infotext.trim() !== poi.hours,
  );

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
          <ImgPlaceholder
            label={poi.img}
            src={poi.imageUrl}
            alt={poi.name}
            className="h-[240px] w-full"
          />
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
          <div className="absolute bottom-3 right-3.5">
            {/* 상세 응답이 총 좋아요 수(`totalLiked`)를 주므로 하트 옆에 함께 보여 준다. */}
            <LikeButton poiId={poi.id} size={18} className="btn-sm" showCount />
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

          {/* 소개 — 상세(GBC018)가 오면 overview, 아직/없으면 기존 한 줄(지역명 등)로 폴백. */}
          {loading && !overview ? (
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          ) : overview ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/70">
              {overview}
            </p>
          ) : (
            poi.desc && (
              <p className="text-sm leading-relaxed text-base-content/70">
                {poi.desc}
              </p>
            )
          )}

          {/* 상세 조회 실패 — 이미 보이는 정보는 유지하고 재시도만 제공한다. */}
          {!!error && !detail && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-error/30 bg-error/5 px-3.5 py-3"
            >
              <span className="text-sm text-base-content/70">
                {getApiErrorMessage(error, '상세 정보를 불러오지 못했어요')}
              </span>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={reload}
              >
                다시 시도
              </button>
            </div>
          )}

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

          {(address || tel || homepage) && (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-base-200 p-3.5">
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-base-content/60"
                  />
                  <span className="text-sm">{address}</span>
                </div>
              )}
              {tel && (
                <div className="flex items-start gap-2">
                  <Phone
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-base-content/60"
                  />
                  <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} className="text-sm link link-hover">
                    {tel}
                  </a>
                </div>
              )}
              {homepage && (
                <div className="flex items-start gap-2">
                  <Globe
                    size={15}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-base-content/60"
                  />
                  {homepageUrl ? (
                    <a
                      href={homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-hover break-all text-sm"
                    >
                      {homepageUrl}
                    </a>
                  ) : (
                    <span className="break-all text-sm">{homepage}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 부가정보(TourAPI detailInfo) — 유형마다 항목이 다르다(이용시간·주차·대표메뉴 …). */}
          {extras.length > 0 && (
            <dl className="flex flex-col gap-2.5 rounded-2xl border border-base-200 p-3.5">
              {extras.map((item, i) => (
                <div
                  key={`${item.infoname}-${i}`}
                  className="flex flex-col gap-0.5"
                >
                  <dt className="text-xs font-bold text-base-content/60">
                    {item.infoname}
                  </dt>
                  <dd className="whitespace-pre-line text-sm leading-relaxed">
                    {item.infotext}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* 좌표가 있으면 해당 지점, 없으면 이름 검색으로 카카오맵을 새 탭에 연다. */}
          <a
            href={kakaoMapPlaceUrl(poi)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-2xl border border-base-200 px-3.5 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <MapIcon size={16} className="text-cat-culture" />
              카카오맵에서 보기
            </span>
            <ArrowRight size={16} className="text-base-content/50" />
          </a>
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
