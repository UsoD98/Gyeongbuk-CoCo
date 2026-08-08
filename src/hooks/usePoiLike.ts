import { useCallback, useState } from 'react';

import { togglePoiLike } from '@/api/poi.ts';
import { getApiErrorMessage } from '@/api/types.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { useLoginGateStore } from '@/stores/loginGateStore.ts';
import { usePoiLikeStore } from '@/stores/poiLikeStore.ts';
import { toast } from '@/stores/toastStore.ts';

/**
 * POI 좋아요 토글(GBC019) 흐름을 캡슐화한 훅.
 *
 * 규칙:
 *  - 로그인 필수. 비로그인 상태에서 누르면 서버 호출 없이 로그인 게이트('찜')를 연다.
 *  - 낙관적 업데이트: 클릭 즉시 스토어 상태를 뒤집고, 실패 시 이전 값으로 롤백 + 에러 토스트.
 *  - 서버 호출은 **실 contentId(양수 정수)** 일 때만 한다. 목 POI(슬러그 id)는 실 contentId 가
 *    없어 로컬 상태만 반영한다 — 실동작(서버 반영·재조회 유지) 검증은 POI 실데이터(P2/P3) 이후.
 *
 * 컴포넌트(`LikeButton`)는 `{ liked, pending, toggle }` 만 소비한다.
 */
export interface PoiLike {
  liked: boolean;
  /** 서버 요청 진행 중(버튼 비활성화용) */
  pending: boolean;
  toggle: () => void;
}

export function usePoiLike(poiId: string): PoiLike {
  const liked = usePoiLikeStore((s) => s.liked[poiId] ?? false);
  const setLiked = usePoiLikeStore((s) => s.setLiked);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openGate = useLoginGateStore((s) => s.openGate);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(() => {
    if (!isAuthenticated) {
      // 찜 = 좋아요. LoginGateModal 은 `${label}하려면 로그인` 형태라 '찜'이 자연스럽다.
      openGate('찜');
      return;
    }
    if (pending) return;

    const prev = usePoiLikeStore.getState().liked[poiId] ?? false;
    const next = !prev;
    setLiked(poiId, next); // 낙관적 반영

    const contentId = Number(poiId);
    // 목 POI(슬러그 id) → 실 contentId 없음: 로컬만 반영하고 서버 호출은 건너뛴다(P2/P3 이후 연결).
    if (!Number.isInteger(contentId) || contentId <= 0) return;

    setPending(true);
    void togglePoiLike(contentId)
      .then((res) => {
        setLiked(poiId, res.liked, res.likes); // 서버 진실로 확정
      })
      .catch((error) => {
        setLiked(poiId, prev); // 롤백
        toast.error(getApiErrorMessage(error, '좋아요 처리에 실패했어요'));
      })
      .finally(() => {
        setPending(false);
      });
  }, [isAuthenticated, openGate, pending, poiId, setLiked]);

  return { liked, pending, toggle };
}
