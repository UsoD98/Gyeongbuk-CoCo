import { useCallback } from 'react';

import { getMyCourses } from '@/api/tourCourse.ts';
import type { CourseSummary } from '@/api/tourCourse.ts';
import { useAsync } from '@/hooks/useAsync.ts';
import type { AsyncState } from '@/hooks/useAsync.ts';

/**
 * 내 코스 목록(GBC011) 로딩/에러/데이터 + 재조회를 캡슐화한 도메인 훅.
 *
 * 컴포넌트(`Collection`)는 API 세부를 모른 채 `{ data, loading, error, reload }`만
 * 소비하고, 상태 렌더는 공용 `Skeleton`/`EmptyState`/`ErrorState`로 처리한다.
 * fetcher 는 `useCallback` 으로 안정 참조를 유지한다(useAsync 무한 재호출 방지).
 */
export function useCourseList(): AsyncState<CourseSummary[]> {
  const fetcher = useCallback(() => getMyCourses(), []);
  return useAsync(fetcher);
}
