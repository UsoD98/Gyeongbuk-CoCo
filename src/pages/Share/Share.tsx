import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calendar,
  ChevronRight,
  Clock,
  Map as MapIcon,
  MapPin,
  Share2,
  Users,
} from 'lucide-react';

import { getPublicCourse } from '@/api/tourCourse.ts';
import type { CourseDetail } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import ErrorState from '@/components/common/ErrorState.tsx';
import Loading from '@/components/common/Loading.tsx';
import LoginGateModal from '@/components/planner/LoginGateModal.tsx';
import MapCanvas from '@/components/planner/MapCanvas.tsx';
import PoiDrawer from '@/components/planner/PoiDrawer.tsx';
import type { MapMarker } from '@/components/planner/mapModel.ts';
import { useAsync } from '@/hooks/useAsync.ts';
import { useCourseCoords } from '@/hooks/useCourseCoords.ts';
import { useLoginGateStore } from '@/stores/loginGateStore.ts';
import {
  mergePoi,
  synthesizePoi,
  usePlannerStore,
} from '@/stores/plannerStore.ts';
import { useTravelThemeStore } from '@/stores/travelThemeStore.ts';
import { cn } from '@/utils/cn.ts';
import {
  formatDate,
  formatTime,
  PLACE_TYPE_LABEL,
  TRANSPORT_LABEL,
  tripDuration,
} from '@/utils/courseFormat.ts';
import type { Poi } from '@/types/planner.ts';

const CARD = 'rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-200';

/**
 * 하루 일정 카드(읽기 전용). Day 라벨 + 날짜 + 장소 목록.
 * 장소 줄은 버튼이다 — 누르면 그 장소의 상세(GBC018)가 열리고 지도도 그 Day 로 옮겨간다.
 * 줄 앞의 순번은 지도 마커의 순번 배지와 같은 값이라 목록과 지도가 서로를 가리킨다.
 */
function DayCard({
  dayIndex,
  date,
  places,
  openPoiId,
  showMapButton,
  onSelect,
  onShowOnMap,
}: {
  dayIndex: number;
  date: string;
  places: CourseDetail['schedule'][number]['places'];
  openPoiId: string | null;
  /** 여러 날짜일 때만 '지도에서 보기'를 낸다(하루짜리는 지도가 이미 그 Day 다). */
  showMapButton: boolean;
  onSelect: (dayIndex: number, poiId: string) => void;
  onShowOnMap: (dayIndex: number) => void;
}) {
  const sorted = [...places].sort((a, b) => a.seq - b.seq);
  return (
    <div className={CARD}>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-lg font-bold text-base-content">
          Day {dayIndex + 1}
        </h3>
        <span className="text-sm text-base-content/50">{formatDate(date)}</span>
        {showMapButton && (
          <button
            type="button"
            className="btn btn-ghost btn-xs ml-auto gap-1 text-base-content/60"
            onClick={() => onShowOnMap(dayIndex)}
          >
            <MapIcon size={13} aria-hidden="true" />
            지도에서 보기
          </button>
        )}
      </div>
      <ol className="flex flex-col gap-2">
        {sorted.map((place, i) => {
          const time = formatTime(place.time);
          const poiId = String(place.contentId);
          const open = openPoiId === poiId;
          return (
            <li key={`${place.seq}-${place.contentId}`}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onSelect(dayIndex, poiId)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl bg-base-200/50 px-3 py-2.5 text-left',
                  'transition hover:bg-base-200 active:scale-[0.99]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  open && 'ring-2 ring-primary/40',
                )}
              >
                {/* 지도 마커의 순번 배지와 같은 번호 — 목록과 지도가 서로를 가리킨다. */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
                  {i + 1}
                </span>
                <span className="flex w-12 shrink-0 items-center gap-1 text-sm font-semibold text-primary">
                  <Clock size={13} aria-hidden="true" />
                  {time || '—'}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-base-content">
                  {place.placeName?.trim() || `장소 #${place.contentId}`}
                </span>
                <span className="badge badge-sm badge-ghost shrink-0">
                  {PLACE_TYPE_LABEL[place.type] ?? place.type}
                </span>
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-base-content/30"
                />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * 공개 코스 뷰(GBC014) — 카카오 공유 링크 수신자용 읽기 전용 화면.
 * `/share/:courseId`(가드 밖)로 진입하며 `GET /tour-course/{id}/view`(인증 불필요)로 조회한다.
 * 로그아웃 상태에서도 401 없이 코스가 보이는 것이 이 페이지의 핵심이다.
 *
 * 지도(`MapCanvas`)와 장소 상세(`PoiDrawer`)를 플래너와 **같은 컴포넌트로** 보여주되
 * 상태는 이 페이지가 쥔다 — `plannerStore` 에 남의 코스를 실으면 헤더의 `/planner/` 로 들어간
 * 수신자에게 그 코스가 자기 것처럼(저장·편집 버튼까지) 보인다. 그래서 코스 장소는
 * `synthesizePoi` 로 이 화면 안에서만 `Poi` 로 풀고 편집 경로는 전부 닫아 둔다
 * (`dayLabel` 없는 지도 = 마커 토글 없음 · `readOnly` 드로어 = 담기/빼기 없음).
 * POI 상세(GBC018)·찜(GBC019)은 permitAll 이라 비로그인으로도 그대로 동작한다
 * (찜만 로그인 게이트를 연다 → 이 페이지도 `LoginGateModal` 을 건다).
 */
export default function Share() {
  const { courseId } = useParams();
  // 서버는 테마를 코드('003')로 준다 → 홈 검색바와 같은 마스터로 이름을 붙인다.
  // 마스터에 없는 코드는 코드 그대로 보여 준다(빈 칩으로 사라지지 않게).
  const getThemeLabel = useTravelThemeStore((state) => state.getThemeLabel);
  const fetcher = useCallback(async (): Promise<CourseDetail> => {
    const id = Number(courseId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('잘못된 공유 주소예요.');
    }
    return getPublicCourse(id);
  }, [courseId]);

  const { data, loading, error, reload } = useAsync(fetcher);

  /** 지도에 그릴 Day(0-based)와 상세를 연 장소 — 이 페이지만 쥐는 상태다. */
  const [activeDay, setActiveDay] = useState(0);
  const [openPoiId, setOpenPoiId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // 장소명으로 찾은 좌표(F5)는 contentId 별 캐시라 코스와 무관하다 → 스토어 것을 그대로 쓴다.
  const placeCoords = usePlannerStore((s) => s.placeCoords);
  const gateOpen = useLoginGateStore((s) => s.open);
  const gateLabel = useLoginGateStore((s) => s.label);
  const closeGate = useLoginGateStore((s) => s.closeGate);

  /** Day 별 `Poi` 배열. 좌표가 null 로 온 장소엔 이름으로 찾은 좌표(있으면)를 얹는다. */
  const dayPois = useMemo<Poi[][]>(
    () =>
      (data?.schedule ?? []).map((day) =>
        [...day.places]
          .sort((a, b) => a.seq - b.seq)
          // 공개뷰 응답엔 지역 필드가 없어 region 은 빈 문자열(요약은 '경상북도' 고정).
          .map((place) => synthesizePoi(place, ''))
          .map((poi) => mergePoi(poi, undefined, placeCoords[poi.id]) ?? poi),
      ),
    [data, placeCoords],
  );
  const allPois = useMemo(() => dayPois.flat(), [dayPois]);
  // 좌표가 비어 온 장소만 장소명으로 메운다(도착하면 placeCoords 가 바뀌어 지도가 갱신된다).
  useCourseCoords(allPois);

  const route = useMemo(() => dayPois[activeDay] ?? [], [dayPois, activeDay]);
  const markers = useMemo<MapMarker[]>(
    () =>
      route.map((poi, i) => ({
        poi,
        order: i + 1,
        active: openPoiId === poi.id,
      })),
    [route, openPoiId],
  );
  /** 드로어에 넘길 표시용 기본값(스토어에 없는 장소라 직접 넘긴다). */
  const openPoi = useMemo(
    () => allPois.find((p) => p.id === openPoiId),
    [allPois, openPoiId],
  );

  const closeDrawer = useCallback(() => setOpenPoiId(null), []);
  /** 목록에서 장소를 고르면 지도도 그 Day 로 옮기고 상세를 연다. */
  const selectPlace = useCallback((dayIndex: number, poiId: string) => {
    setActiveDay(dayIndex);
    setOpenPoiId(poiId);
  }, []);
  /** '지도에서 보기' — Day 를 바꾸고 지도까지 스크롤한다(모바일은 지도가 화면 밖이다). */
  const showOnMap = useCallback((dayIndex: number) => {
    setActiveDay(dayIndex);
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  if (loading && !data) return <Loading />;

  if (!data) {
    return (
      <ErrorState
        title="코스를 찾을 수 없어요"
        description={getApiErrorMessage(error, '공유된 코스를 불러오지 못했어요')}
        onRetry={reload}
      />
    );
  }

  const nights = tripDuration(data.startDate, data.endDate);
  const multiDay = data.schedule.length > 1;

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* 공유받은 코스임을 알리는 배너 */}
      <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm text-primary">
        <Share2 size={16} aria-hidden="true" />
        공유받은 여행 코스예요
      </div>

      {/* 코스 요약 헤더 */}
      <header className={cn(CARD, 'flex flex-col gap-3')}>
        <h1 className="text-2xl font-bold text-base-content">
          {data.title?.trim() || 'AI 추천 코스'}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-base-content/60">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-primary" />
            경상북도
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} className="text-primary" />
            {formatDate(data.startDate)} ~ {formatDate(data.endDate)} · {nights}
          </span>
          <span className="flex items-center gap-1">
            <Users size={14} className="text-primary" />
            {data.peopleCount}명 · {TRANSPORT_LABEL[data.transport]}
          </span>
        </div>
        {data.theme.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.theme.map((t) => (
              <span key={t} className="badge badge-sm badge-ghost">
                {getThemeLabel(t) ?? t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 코스 지도 — 고른 Day 의 경로를 순번 마커로 그린다(편집 토글 없음). */}
      <section ref={mapRef} className={cn(CARD, 'flex flex-col gap-3')}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-base font-bold text-base-content">
            코스 지도
          </h2>
          {multiDay && (
            <div role="tablist" className="tabs tabs-box tabs-xs">
              {data.schedule.map((day, i) => (
                <button
                  key={day.date}
                  type="button"
                  role="tab"
                  aria-selected={activeDay === i}
                  className={cn('tab', activeDay === i && 'tab-active')}
                  onClick={() => setActiveDay(i)}
                >
                  Day {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 두 지도 렌더러 모두 `absolute inset-0` 이라 부모에 relative + 높이가 필요하다. */}
        <div className="relative h-[320px] overflow-hidden rounded-xl sm:h-[420px]">
          <MapCanvas markers={markers} route={route} onSelect={setOpenPoiId} />
        </div>
        <p className="text-xs text-base-content/50">
          마커를 누르면 장소 상세를 볼 수 있어요.
        </p>
      </section>

      {/* 일정 */}
      <div className="flex flex-col gap-4">
        {data.schedule.map((day, i) => (
          <DayCard
            key={day.date}
            dayIndex={i}
            date={day.date}
            places={day.places}
            openPoiId={openPoiId}
            showMapButton={multiDay}
            onSelect={selectPlace}
            onShowOnMap={showOnMap}
          />
        ))}
      </div>

      {/* 내 코스 만들기 유도 */}
      <div className={cn(CARD, 'flex flex-col items-center gap-3 text-center')}>
        <p className="text-sm text-base-content/60">
          나만의 경북 여행 코스를 만들어보세요.
        </p>
        <Link to="/" className="btn btn-primary btn-sm">
          경북 CoCo에서 코스 만들기
        </Link>
      </div>

      {/* 장소 상세(GBC018) — 읽기 전용(담기/빼기 없음). 찜은 게이트를 거쳐 로그인으로. */}
      <PoiDrawer
        poiId={openPoiId}
        base={openPoi}
        readOnly
        onClose={closeDrawer}
      />
      <LoginGateModal open={gateOpen} label={gateLabel} onClose={closeGate} />
    </section>
  );
}
