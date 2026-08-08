import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Share2, Users } from 'lucide-react';

import { getPublicCourse } from '@/api/tourCourse.ts';
import type { CourseDetail } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import ErrorState from '@/components/common/ErrorState.tsx';
import Loading from '@/components/common/Loading.tsx';
import { useAsync } from '@/hooks/useAsync.ts';
import { cn } from '@/utils/cn.ts';
import {
  formatDate,
  formatTime,
  PLACE_TYPE_LABEL,
  TRANSPORT_LABEL,
  tripDuration,
} from '@/utils/courseFormat.ts';

const CARD = 'rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-200';

/** 하루 일정 카드(읽기 전용). Day 라벨 + 날짜 + 장소 목록. */
function DayCard({
  dayIndex,
  date,
  places,
}: {
  dayIndex: number;
  date: string;
  places: CourseDetail['schedule'][number]['places'];
}) {
  const sorted = [...places].sort((a, b) => a.seq - b.seq);
  return (
    <div className={CARD}>
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="text-lg font-bold text-base-content">Day {dayIndex + 1}</h3>
        <span className="text-sm text-base-content/50">{formatDate(date)}</span>
      </div>
      <ol className="flex flex-col gap-2">
        {sorted.map((place) => {
          const time = formatTime(place.time);
          return (
            <li
              key={`${place.seq}-${place.contentId}`}
              className="flex items-center gap-3 rounded-xl bg-base-200/50 px-3 py-2.5"
            >
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
 */
export default function Share() {
  const { courseId } = useParams();
  const fetcher = useCallback(async (): Promise<CourseDetail> => {
    const id = Number(courseId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('잘못된 공유 주소예요.');
    }
    return getPublicCourse(id);
  }, [courseId]);

  const { data, loading, error, reload } = useAsync(fetcher);

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
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 일정 */}
      <div className="flex flex-col gap-4">
        {data.schedule.map((day, i) => (
          <DayCard
            key={day.date}
            dayIndex={i}
            date={day.date}
            places={day.places}
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
    </section>
  );
}
