import { useCallback, useEffect, useState } from 'react';

import { assignCourse } from '@/api/tourCourse.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * 코스 저장(= 소유권 이전, GBC016) 흐름을 캡슐화한 훅.
 *
 * 게스트가 만든 코스를 "저장"하려면 로그인이 필요하다. 흐름:
 *   1. 게스트가 저장 클릭 → 대상 courseId 를 세션에 stash + 로그인 게이트 오픈.
 *   2. 로그인 성공 → /planner 로 복귀(클라이언트 내비게이션이라 스토어는 유지되나,
 *      하드 리다이렉트 대비로 courseId 는 sessionStorage 에도 남긴다).
 *   3. 복귀 후 이 훅의 effect 가 대기 중 저장을 감지 → 자동으로 assign 실행.
 * 로그인 상태에서 저장 클릭 시엔 게이트 없이 즉시 assign 한다.
 *
 * 중복 저장 방지: 백엔드는 이미 소유자가 있는 코스에 403 을 반환하므로
 * `saved`/`saving` 가드로 재발사를 막는다.
 */

// 로그인 왕복 동안 유지할 "저장 대기" courseId. accessToken 과 달리 민감정보가 아니다.
const PENDING_SAVE_KEY = 'gb-coco.pendingCourseSave';

function readPending(): number | null {
  const raw = sessionStorage.getItem(PENDING_SAVE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function writePending(courseId: number) {
  sessionStorage.setItem(PENDING_SAVE_KEY, String(courseId));
}

function clearPending() {
  sessionStorage.removeItem(PENDING_SAVE_KEY);
}

export interface UseCourseSaveOptions {
  /**
   * assign 성공 직후 1회 호출된다(직접 저장·로그인 왕복 후 재개 모두).
   * 게스트가 편집까지 해 둔 코스를 저장한 경우, 소유권이 생긴 이 시점에 편집분도
   * 이어서 flush 하려고 쓴다(GBC020). **참조가 안정적이어야 한다**(useCallback 등).
   */
  onAssigned?: () => void;
}

export interface CourseSave {
  /** assign 요청 진행 중 */
  saving: boolean;
  /** 이 세션에서 저장(귀속) 완료됨 — 버튼 비활성화·재발사 방지용 */
  saved: boolean;
  /**
   * 저장 시도. 비로그인이면 저장 대기를 stash 하고 `needLogin()`(로그인 게이트 오픈)을 호출한다.
   * 로그인 상태면 즉시 assign 한다.
   */
  save: (needLogin: () => void) => void;
}

export function useCourseSave({
  onAssigned,
}: UseCourseSaveOptions = {}): CourseSave {
  const courseId = usePlannerStore((s) => s.courseId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const runAssign = useCallback(
    async (id: number) => {
      // 시작 시 즉시 대기값을 소비한다 → StrictMode 이중 실행·중복 발사 방지.
      clearPending();
      setSaving(true);
      try {
        await assignCourse(id);
        setSaved(true);
        toast.success('컬렉션에 저장했어요');
        onAssigned?.();
      } catch (error) {
        toast.error(getApiErrorMessage(error, '코스 저장에 실패했어요'));
      } finally {
        setSaving(false);
      }
    },
    [onAssigned],
  );

  // 로그인 왕복 후 복귀 시 대기 중 저장을 자동 실행.
  // 대기값이 현재 스토어 courseId 와 다르면(오래된 값) 폐기한다.
  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = readPending();
    if (pending == null) return;
    if (courseId != null && pending === courseId) {
      // 로그인 왕복 후 복귀 시점의 1회성 재개. assignCourse 는 비동기 액션이고
      // saving/saved 는 그 진행을 표시하는 상태다 — 외부(세션 stash) 신호에 반응해
      // 액션을 발사하는 정당한 effect 사용이라 이 한 줄만 규칙을 해제한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runAssign(pending);
    } else {
      clearPending();
    }
  }, [isAuthenticated, courseId, runAssign]);

  const save = useCallback(
    (needLogin: () => void) => {
      if (courseId == null) {
        toast.error('저장할 코스가 없어요');
        return;
      }
      if (saved || saving) return;
      if (isAuthenticated) {
        runAssign(courseId);
      } else {
        writePending(courseId);
        needLogin();
      }
    },
    [courseId, saved, saving, isAuthenticated, runAssign],
  );

  return { saving, saved, save };
}
