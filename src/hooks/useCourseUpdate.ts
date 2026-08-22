import { useCallback, useState } from 'react';

import { updateCourse } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';
import { buildSchedulePayload } from '@/utils/coursePayload.ts';

/**
 * 코스 수정 영속화(GBC020) 흐름을 캡슐화한 도메인 훅.
 *
 * 편집 UI(dnd 추가·제거·재정렬, 비용 인라인 수정)는 이미 `plannerStore` 를 인메모리로 고친다.
 * 이 훅은 그 결과를 **명시적 저장 시점에 한 번** 서버로 flush 한다(자동 debounce 저장이 아니다 —
 * 드래그 한 번에 PATCH 가 날아가는 것보다 "변경 저장" 버튼이 사용자 의도에 맞고 요청도 줄어든다).
 *
 * 페이로드는 스토어 최신값에서 조립하므로(`getState()`) `save` 는 참조가 고정된다 —
 * 호출부가 effect·콜백 의존성으로 안전하게 쓸 수 있다.
 */
export interface CourseUpdate {
  /** 수정 요청 진행 중 */
  saving: boolean;
  /** 서버에 반영되지 않은 편집이 있는지 (버튼 활성화 조건) */
  dirty: boolean;
  /** 편집 내용을 서버에 저장. 코스 id 가 없거나 변경이 없으면 요청하지 않는다. */
  save: () => Promise<void>;
}

export function useCourseUpdate(): CourseUpdate {
  const [saving, setSaving] = useState(false);
  const dirty = usePlannerStore((s) => s.dirty);

  const save = useCallback(async () => {
    const state = usePlannerStore.getState();
    if (state.courseId == null) {
      toast.error('저장할 코스가 없어요');
      return;
    }
    if (!state.dirty) return;

    const { schedule, skipped } = buildSchedulePayload({
      course: state.course,
      baseSchedule: state.baseSchedule,
      resolve: state.resolvePoi,
      overrides: state.overrides,
      placeTimes: state.placeTimes,
      startDate: state.search.start,
      pax: state.search.pax,
    });

    // 백엔드는 Day 마다 장소가 최소 1곳이어야 한다(`@NotEmpty` → 400 "일정에 최소 한 개의 장소가 필요합니다").
    // 어느 Day 가 문제인지 알려주지 않으므로 보내기 전에 막고 위치를 짚어 준다.
    const emptyDay = schedule.findIndex((day) => day.places.length === 0);
    if (emptyDay >= 0) {
      toast.error(`Day ${emptyDay + 1}에 장소를 최소 한 곳은 넣어 주세요`);
      return;
    }

    setSaving(true);
    try {
      await updateCourse(state.courseId, schedule);
      // 서버 반영 완료 → 이후 편집이 있어야 다시 dirty 가 된다.
      usePlannerStore.getState().markPristine();
      // 실 contentId 가 없는 장소(목 슬러그 id)는 보낼 수 없어 빠진다 — 조용히 사라지지 않게 알린다.
      if (skipped > 0) {
        toast.info(`장소 ${skipped}곳은 저장하지 못했어요(연동 준비 중인 장소)`);
      }
      toast.success('코스를 저장했어요');
    } catch (error) {
      // 실패해도 편집 내용은 스토어에 그대로 남는다(dirty 유지 → 재시도 가능).
      toast.error(getApiErrorMessage(error, '코스 저장에 실패했어요'));
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, dirty, save };
}
