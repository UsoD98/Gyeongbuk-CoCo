import { useCallback } from 'react';

import { getCourse } from '@/api/tourCourse.ts';
import type { CourseDetail } from '@/api/tourCourse.ts';
import { isResourceGone } from '@/api/types.ts';
import { useAsync } from '@/hooks/useAsync.ts';
import type { AsyncState } from '@/hooks/useAsync.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';

/**
 * 코스 상세(GBC012)를 불러와 `plannerStore`에 주입하는 도메인 훅.
 *
 * `/planner/:courseId` 진입(목록 카드 클릭·URL 재진입) 시 사용한다. URL 파라미터(string)를
 * 받아 유효성을 검사하고, `getCourse` 결과를 `loadDetail`로 스토어에 싣는다. 플래너는 늘
 * 스토어를 단일 출처로 읽으므로, 여기선 주입만 하고 반환 data 는 로딩/에러 판별용이다.
 *
 * - `courseId` 미지정(index 라우트)이면 fetch 없이 idle(data=null)로 즉시 종료한다.
 * - 잘못된 파라미터(정수 아님·0 이하)는 즉시 에러로 처리한다.
 * - fetcher 는 `useCallback`으로 안정 참조를 유지한다(useAsync 무한 재호출 방지).
 * - 404/403(삭제됨·소유자 아님)이면 스토어에 남은 그 코스를 **비우고** 에러를 그대로 던진다.
 *   비우지 않으면 `Planner` 가 "스토어에 있으니 보여 준다"고 판단해(`hasParamCourse`)
 *   이미 사라진 코스를 계속 그린다.
 */
export function useCourseDetail(
  courseId: string | undefined,
): AsyncState<CourseDetail | null> {
  const loadDetail = usePlannerStore((s) => s.loadDetail);
  const fetcher = useCallback(async (): Promise<CourseDetail | null> => {
    if (courseId == null) return null;
    const id = Number(courseId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('잘못된 코스 주소예요.');
    }
    try {
      const detail = await getCourse(id);
      loadDetail(detail);
      return detail;
    } catch (error) {
      if (isResourceGone(error)) {
        usePlannerStore.getState().forgetCourse(id);
      }
      throw error;
    }
  }, [courseId, loadDetail]);
  return useAsync(fetcher);
}
