import { useCallback, useState } from 'react';

import { deleteCourse } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 코스 삭제(GBC013) 흐름을 캡슐화한 도메인 훅.
 *
 * 삭제 확인 UI(어떤 코스를 지울지)는 호출부(Collection)가 들고, 이 훅은
 * 서버 요청 + 진행 상태 + 성공/실패 toast 만 담당한다(useCourseSave 와 동일한 결).
 * 성공 시 `onDeleted` 콜백으로 목록 재조회를 트리거한다(서버 진실 기준).
 *
 * 성공 시 플래너 스토어도 함께 정리한다(`forgetCourse`). 헤더의 '플래너' 탭은
 * `/planner/`(index 라우트, courseId 없음)로 가고 그 경로는 **서버 검증 없이 스토어를
 * 그대로 그리므로**, 여기서 비우지 않으면 방금 지운 코스가 멀쩡히 보이고 '변경 저장'이
 * 404 를 맞는다.
 */
export interface CourseDelete {
  /** 삭제 요청 진행 중 */
  deleting: boolean;
  /** 삭제 시도. 성공하면 `onDeleted`(예: 목록 reload)를 호출한다. */
  remove: (courseId: number, onDeleted?: () => void) => Promise<void>;
}

export function useCourseDelete(): CourseDelete {
  const [deleting, setDeleting] = useState(false);

  const remove = useCallback(
    async (courseId: number, onDeleted?: () => void) => {
      // 중복 발사 방지: 진행 중이면 무시.
      if (deleting) return;
      setDeleting(true);
      try {
        await deleteCourse(courseId);
        // 플래너가 이 코스를 들고 있을 때만 비운다(다른 코스를 보고 있었다면 그대로 둔다).
        usePlannerStore.getState().forgetCourse(courseId);
        toast.success('코스를 삭제했어요');
        onDeleted?.();
      } catch (error) {
        toast.error(getApiErrorMessage(error, '코스 삭제에 실패했어요'));
      } finally {
        setDeleting(false);
      }
    },
    [deleting],
  );

  return { deleting, remove };
}
