import { Link } from 'react-router-dom';
import { Bookmark, Calendar, Users } from 'lucide-react';

import type { CourseSummary, Transport } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import EmptyState from '@/components/common/EmptyState.tsx';
import ErrorState from '@/components/common/ErrorState.tsx';
import Skeleton from '@/components/common/Skeleton.tsx';
import { useCourseList } from '@/hooks/useCourseList.ts';
import { cn } from '@/utils/cn.ts';

/** 이동수단 표시 라벨(백엔드 enum → 한국어). Index.tsx TRANSPORT_OPTIONS와 동일. */
const TRANSPORT_LABEL: Record<Transport, string> = {
  CAR: '자동차',
  PUBLIC_TRANSPORT: '대중교통',
  WALK: '도보',
};

/** 'yyyy-MM-dd' → 'yyyy.MM.dd'. 파싱 없이 구분자만 치환(타임존 영향 없음). */
function formatDate(ymd: string): string {
  return ymd.replaceAll('-', '.');
}

/** ISO datetime('2026-06-27T10:00:00') → 'yyyy.MM.dd'. 날짜 파트만 사용. */
function formatCreatedAt(iso: string): string {
  return formatDate(iso.slice(0, 10));
}

/** 'yyyy-MM-dd' 두 날짜의 숙박 일수 → 'N박 M일'(당일이면 '당일'). */
function tripDuration(startYmd: string, endYmd: string): string {
  const start = new Date(`${startYmd}T00:00:00`);
  const end = new Date(`${endYmd}T00:00:00`);
  const nights = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (!Number.isFinite(nights) || nights <= 0) return '당일';
  return `${nights}박 ${nights + 1}일`;
}

/** 코스 요약 카드. 클릭 시 상세(GBC012, Step 4에서 라우트 추가)로 이동. */
function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      to={`/planner/${course.courseId}`}
      className={cn(
        'card rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-200',
        'transition hover:-translate-y-0.5 hover:shadow-md',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-lg font-bold text-base-content">
            {course.title}
          </h3>
          <span className="shrink-0 text-xs text-base-content/50">
            {formatCreatedAt(course.createdAt)}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-base-content/70">
          <span className="flex items-center gap-1.5">
            <Calendar size={15} className="text-base-content/40" />
            {formatDate(course.startDate)} ~ {formatDate(course.endDate)}
            <span className="text-base-content/50">
              · {tripDuration(course.startDate, course.endDate)}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={15} className="text-base-content/40" />
            {course.peopleCount}명 · {TRANSPORT_LABEL[course.transport]}
          </span>
        </div>

        {course.theme.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.theme.map((t) => (
              <span key={t} className="badge badge-sm badge-ghost">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export default function Collection() {
  const { data, loading, error, reload } = useCourseList();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-base-content">내 코스</h1>
          <p className="text-sm text-base-content/60">
            저장한 여행 코스를 모아봤어요.
          </p>
        </div>
        {data && data.length > 0 && (
          <span className="text-sm font-semibold text-base-content/60">
            {data.length}개
          </span>
        )}
      </header>

      {/* 최초 로딩(직전 데이터 없음): 스켈레톤 그리드 */}
      {loading && !data && (
        <div className={GRID} aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* 에러(보존된 데이터도 없을 때): 재시도 가능한 에러 상태 */}
      {!loading && !!error && !data && (
        <ErrorState
          description={getApiErrorMessage(error, '코스 목록을 불러오지 못했어요')}
          onRetry={reload}
        />
      )}

      {/* 빈 목록: 코스 만들기로 유도 */}
      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="저장한 코스가 없어요"
          sub="홈에서 여행 조건을 입력해 AI 코스를 만들고 저장해보세요."
          action={
            <Link to="/" className="btn btn-primary btn-sm">
              코스 만들러 가기
            </Link>
          }
        />
      )}

      {/* 데이터: 코스 카드 그리드 */}
      {data && data.length > 0 && (
        <div className={GRID}>
          {data.map((course) => (
            <CourseCard key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
