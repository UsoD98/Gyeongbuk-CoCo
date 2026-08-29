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
 *  - 응답(`{liked, totalLiked}`)을 그대로 스토어에 확정한다 — 조회 응답과 필드가 같아
 *    재조회 없이 그 contentId 의 찜 여부·좋아요 수가 카드·드로어 양쪽에서 갱신된다(백엔드 0.6.5).
 *  - 응답 `liked` 가 낙관적 기대와 다르면 서버 진실을 따르고 그 사실을 toast 로 알린다.
 *    조회가 `liked` 를 실어 주게 됐어도(0.6.4) 목록을 부르지 않은 POI·다른 기기에서 바뀐 경우가
 *    남아 있어, 그 클릭이 실제로는 '해제'였다는 걸 사용자가 알 수 있어야 한다.
 *
 * 컴포넌트(`LikeButton`)는 `{ liked, totalLiked, pending, toggle }` 을 소비한다.
 */
export interface PoiLike {
  liked: boolean;
  /** 총 좋아요 수. 아직 모르면(목록만 본 POI) undefined — 개수 표시를 생략한다. */
  totalLiked: number | undefined;
  /** 서버 요청 진행 중(버튼 비활성화용) */
  pending: boolean;
  toggle: () => void;
}

export function usePoiLike(poiId: string): PoiLike {
  const liked = usePoiLikeStore((s) => s.liked[poiId] ?? false);
  const totalLiked = usePoiLikeStore((s) => s.totalLiked[poiId]);
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
        setLiked(poiId, res.liked, res.totalLiked); // 서버 진실(찜 여부·총 개수)로 확정
        if (res.liked !== next) {
          // 서버가 우리 기대와 반대를 돌려줬다 = 우리가 알던 찜 상태가 낡았다.
          // 조회 응답이 `liked` 를 주게 됐어도(0.6.4) 목록을 거치지 않은 POI·다른 기기에서
          // 바뀐 경우가 남으므로, 그 클릭이 실제로는 '해제'였다는 걸 알려준다.
          toast.info(
            res.liked
              ? '찜에 추가했어요'
              : '이미 찜한 곳이어서 찜을 해제했어요',
          );
        }
      })
      .catch((error) => {
        setLiked(poiId, prev); // 롤백
        toast.error(getApiErrorMessage(error, '좋아요 처리에 실패했어요'));
      })
      .finally(() => {
        setPending(false);
      });
  }, [isAuthenticated, openGate, pending, poiId, setLiked]);

  return { liked, totalLiked, pending, toggle };
}
