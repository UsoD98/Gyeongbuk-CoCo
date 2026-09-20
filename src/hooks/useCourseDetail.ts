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
 *   이미 사라진 코스를 계속 그린다 — 저장분에서 복원된 경우엔 그 잔상이 영구히 남는다.
 * - 같은 코스에 미저장 편집분(`dirty`)이 있으면 응답으로 **덮어쓰지 않는다**(아래 주석).
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
      const current = usePlannerStore.getState();
      // 같은 코스를 이미 들고 있고 **아직 저장하지 않은 편집분**이 있으면 덮지 않는다.
      // `loadDetail` 은 스토어를 통째로 갈아끼우므로, 새로고침으로 복원한 편집분이 이
      // 재조회 한 번에 사라진다 — 영속화를 넣은 목적(새로고침해도 내용이 남는다)이
      // 무색해진다. 조회 자체는 그대로 수행하므로 삭제(404/403) 감지는 유지된다.
      if (current.courseId === id && current.dirty) return detail;
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
