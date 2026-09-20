import { useEffect, useRef } from 'react';

import { getCourse } from '@/api/tourCourse.ts';
import { isResourceGone } from '@/api/types.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 스토어가 들고 있는 코스가 **서버에 아직 있는지** 한 번 확인하고, 사라졌으면 비운다.
 *
 * `/planner/`(index 라우트)를 위한 훅이다. 그 경로는 URL 에 courseId 가 없어
 * `useCourseDetail` 이 아무것도 조회하지 않고, 스토어 내용을 그대로 그린다 — 다른 탭·다른
 * 기기에서 코스를 지웠다면 삭제된 코스가 멀쩡히 보인다. 같은 세션에서의 삭제는
 * `useCourseDelete` 가 이미 즉시 정리하므로, 여기는 그 바깥(원격 삭제)을 덮는 방어선이다.
 *
 * ⚠️ **소유 코스에만 건다.** 게스트가 만든 코스(주인 없음)는 GBC012 로 조회하면 401 이 오고,
 *    `client.ts` 인터셉터가 재발급 실패로 보아 **로그인 페이지로 하드 리다이렉트**한다 —
 *    플래너 탭을 눌렀을 뿐인 게스트가 로그인 화면으로 튕긴다. 게스트 코스는 서버에 물어볼
 *    방법 자체가 없으니 검증 대상이 아니다.
 *
 * ⚠️ 응답 본문은 **버린다**(`loadDetail` 호출 안 함). 존재 확인이 목적인데 여기서 코스를
 *    다시 실으면 아직 저장하지 않은 편집분(dirty)을 서버 값으로 덮어쓴다.
 *
 * courseId 당 1회만 확인한다 — 탭을 오가며 리렌더될 때마다 GET 이 나가지 않도록.
 */
export function useCourseAlive(enabled: boolean): void {
  const courseId = usePlannerStore((s) => s.courseId);
  const owned = usePlannerStore((s) => s.owned);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const checkedId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !owned || courseId == null) return;
    if (checkedId.current === courseId) return;
    checkedId.current = courseId;

    let active = true;
    // 존재 확인은 화면 상태를 바꾸지 않는 백그라운드 작업이라 로딩 표시를 걸지 않는다
    // (useAsync 를 쓰지 않는 이유). 실패해도 사라짐이 확정된 경우에만 손을 댄다.
    getCourse(courseId).catch((error) => {
      if (!active || !isResourceGone(error)) return;
      usePlannerStore.getState().forgetCourse(courseId);
      toast.info('삭제된 코스라 플래너를 비웠어요');
    });
    return () => {
      active = false;
    };
  }, [enabled, isAuthenticated, owned, courseId]);
}
