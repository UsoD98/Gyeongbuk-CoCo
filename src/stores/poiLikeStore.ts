import { create } from 'zustand';

import { useAuthStore } from '@/stores/authStore.ts';

/**
 * POI 좋아요(찜) 상태(GBC019).
 * 결과 카드(`POICard`)와 상세 드로어(`PoiDrawer`)가 같은 POI 의 찜 상태를 공유하므로 스토어로 둔다.
 * key 는 `Poi.id`(문자열) — 실 POI 는 `String(contentId)`, 목 POI 는 슬러그.
 *
 * 서버 진실은 `usePoiLike` 가 토글 응답으로 확정하고, 여기엔 표시용 상태만 보관한다.
 *
 * ⚠️ 이 스토어는 **메모리 전용이고 시작값이 항상 빈 객체**다. 찜 상태를 되돌려주는 조회 API 가
 * 없어(백엔드에 `GET /poi/likes` 류 없음 — 계약 추적표 #9) 새로고침하면 서버에 남은 찜도
 * 미찜으로 보인다. localStorage 로 흉내내면 서버 진실과 어긋나므로 채택하지 않는다.
 */
interface PoiLikeState {
  /** poiId → 찜 여부 */
  liked: Record<string, boolean>;
  /** poiId → 총 좋아요 수(서버 응답이 있을 때만). 표시는 선택. */
  likes: Record<string, number>;
  /**
   * 찜 상태 세팅(낙관적 업데이트·롤백·서버 확정에 공용).
   * `count` 를 주면 개수도 갱신하고, 생략하면 개수는 건드리지 않는다.
   */
  setLiked: (poiId: string, liked: boolean, count?: number) => void;
  /** 세션이 바뀌면 호출. 찜은 사용자별 서버 상태라 이전 세션 값을 남기면 거짓 표시가 된다. */
  reset: () => void;
}

export const usePoiLikeStore = create<PoiLikeState>((set) => ({
  liked: {},
  likes: {},
  setLiked: (poiId, liked, count) =>
    set((s) => ({
      liked: { ...s.liked, [poiId]: liked },
      likes:
        count === undefined ? s.likes : { ...s.likes, [poiId]: count },
    })),
  reset: () => set({ liked: {}, likes: {} }),
}));

/**
 * 세션 식별 키. 로그아웃(`guest`)·다른 계정 로그인에서 값이 바뀐다.
 * 401 재발급(`setAuth(token)` 으로 userId 유지)은 키가 그대로라 찜 상태를 날리지 않는다.
 */
function sessionKey(): string {
  const { isAuthenticated, userId } = useAuthStore.getState();
  return isAuthenticated ? `u${userId ?? '?'}` : 'guest';
}

/**
 * 세션이 바뀌면 찜 상태를 비운다.
 * 없으면 로그아웃 후에도 이전 사용자의 하트가 채워진 채 남는다(F4 에서 발견).
 */
let lastSession = sessionKey();
useAuthStore.subscribe(() => {
  const next = sessionKey();
  if (next === lastSession) return;
  lastSession = next;
  usePoiLikeStore.getState().reset();
});
