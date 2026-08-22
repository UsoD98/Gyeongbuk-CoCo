import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Calendar, Trash2, Users } from 'lucide-react';

import type { CourseSummary } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import ConfirmDialog from '@/components/common/ConfirmDialog.tsx';
import EmptyState from '@/components/common/EmptyState.tsx';
import ErrorState from '@/components/common/ErrorState.tsx';
import Skeleton from '@/components/common/Skeleton.tsx';
import { useCourseDelete } from '@/hooks/useCourseDelete.ts';
import { useCourseList } from '@/hooks/useCourseList.ts';
import { useTravelThemeStore } from '@/stores/travelThemeStore.ts';
import { cn } from '@/utils/cn.ts';
import {
  formatDate,
  TRANSPORT_LABEL,
  tripDuration,
} from '@/utils/courseFormat.ts';

/** ISO datetime('2026-06-27T10:00:00') → 'yyyy.MM.dd'. 날짜 파트만 사용. */
function formatCreatedAt(iso: string): string {
  return formatDate(iso.slice(0, 10));
}

/**
 * 코스 요약 카드. 클릭 시 상세(GBC012)로 이동.
 * 삭제 버튼은 Link 의 **형제**로 두어(중첩 금지) 카드 위에 겹쳐 놓는다 —
 * 앵커 안에 버튼을 넣으면 잘못된 마크업이 되고 클릭 이벤트가 얽힌다.
 */
function CourseCard({
  course,
  onDelete,
}: {
  course: CourseSummary;
  onDelete: (course: CourseSummary) => void;
}) {
  // 서버는 테마를 코드('003')로 준다 → 홈 검색바와 같은 마스터로 이름을 붙인다.
  // 마스터에 없는 코드는 코드 그대로 보여 준다(빈 칩으로 사라지지 않게).
  const getThemeLabel = useTravelThemeStore((state) => state.getThemeLabel);
  return (
    <div className="relative">
      <Link
        to={`/planner/${course.courseId}`}
        className={cn(
          'card block rounded-2xl bg-base-100 p-5 shadow-sm ring-1 ring-base-200',
          'transition hover:-translate-y-0.5 hover:shadow-md',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        )}
      >
        <div className="flex flex-col gap-3">
          {/* 우상단 삭제 버튼과 겹치지 않도록 제목에 우측 여백. */}
          <h3 className="line-clamp-2 pr-9 text-lg font-bold text-base-content">
            {/* AI 생성 코스는 제목이 비어 있다(제목 지정=GBC015 이후). 빈 제목 폴백. */}
            {course.title?.trim() || 'AI 추천 코스'}
          </h3>

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
                  {getThemeLabel(t) ?? t}
                </span>
              ))}
            </div>
          )}

          <span className="text-xs text-base-content/50">
            {formatCreatedAt(course.createdAt)} 생성
          </span>
        </div>
      </Link>

      <button
        type="button"
        aria-label={`${course.title?.trim() || 'AI 추천 코스'} 삭제`}
        onClick={() => onDelete(course)}
        className={cn(
          'btn btn-ghost btn-sm btn-square absolute right-2.5 top-2.5 z-10',
          'text-base-content/40 hover:bg-error/10 hover:text-error',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error',
        )}
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

export default function Collection() {
  const { data, loading, error, reload } = useCourseList();
  const { deleting, remove } = useCourseDelete();
  // 삭제 확인 대상(어떤 코스를 지울지) — UI 상태라 페이지가 보유.
  const [pendingDelete, setPendingDelete] = useState<CourseSummary | null>(
    null,
  );

  const confirmDelete = () => {
    if (!pendingDelete) return;
    void remove(pendingDelete.courseId, () => {
      setPendingDelete(null);
      reload();
    });
  };

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
            <CourseCard
              key={course.courseId}
              course={course}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        danger
        busy={deleting}
        title="코스를 삭제할까요?"
        description={`'${
          pendingDelete?.title?.trim() || 'AI 추천 코스'
        }' 코스가 삭제되며 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
