import { useCallback, useState } from 'react';

import { updateCourseTitle } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 코스 제목 수정(GBC015) 흐름을 캡슐화한 도메인 훅.
 *
 * 인라인 편집 UI(편집 여부·draft)는 호출부가 들고, 이 훅은 저장 = 낙관적 업데이트 + 롤백 +
 * 진행 상태 + 성공/실패 toast 만 담당한다(useCourseSave·useCourseDelete 와 동일한 결).
 *
 * 낙관적 업데이트: 요청 전 스토어 제목을 먼저 바꿔 UI 를 즉시 반영하고,
 * 실패하면 이전 제목으로 되돌린다(스펙 §Step6 요구).
 */
export interface CourseTitleEdit {
  /** 제목 저장 요청 진행 중 */
  saving: boolean;
  /**
   * 제목 저장 시도. 공백만이거나 기존과 같으면 요청 없이 무시(no-op)한다.
   * 성공 시 낙관적 값을 확정, 실패 시 이전 값으로 롤백한다.
   */
  save: (courseId: number, next: string) => Promise<void>;
}

export function useCourseTitle(): CourseTitleEdit {
  const [saving, setSaving] = useState(false);
  const setTitle = usePlannerStore((s) => s.setTitle);

  const save = useCallback(
    async (courseId: number, next: string) => {
      // 롤백 대비로 요청 직전의 제목을 잡아 둔다(스토어 최신값).
      const prev = usePlannerStore.getState().course.title;
      const trimmed = next.trim();
      // 빈 제목은 스펙상 불가(required), 변화 없으면 요청 낭비 → 둘 다 조용히 무시.
      if (!trimmed || trimmed === prev) return;

      setSaving(true);
      setTitle(trimmed); // 낙관적 반영
      try {
        await updateCourseTitle(courseId, trimmed);
        toast.success('제목을 수정했어요');
      } catch (error) {
        setTitle(prev); // 롤백
        toast.error(getApiErrorMessage(error, '제목 수정에 실패했어요'));
      } finally {
        setSaving(false);
      }
    },
    [setTitle],
  );

  return { saving, save };
}
