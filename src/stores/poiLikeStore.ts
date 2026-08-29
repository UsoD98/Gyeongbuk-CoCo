import { create } from 'zustand';

import { authSessionKey, useAuthStore } from '@/stores/authStore.ts';

/**
 * POI 좋아요(찜) 상태(GBC019).
 * 결과 카드(`POICard`)와 상세 드로어(`PoiDrawer`)가 같은 POI 의 찜 상태를 공유하므로 스토어로 둔다.
 * key 는 `Poi.id`(문자열) — 실 POI 는 `String(contentId)`, 목 POI 는 슬러그.
 *
 * 값의 출처는 두 곳이고 **둘 다 서버 진실**이다(백엔드 0.6.4~0.6.5, 계약 추적표 #9 해결):
 *  - 조회: `GET /poi`(`liked`) · `GET /poi/{contentId}`(`liked`,`totalLiked`) → `hydrate()`
 *  - 토글: `POST /poi/{contentId}/like`(`liked`,`totalLiked`) → `setLiked()`
 * 화면(하트·좋아요 수)은 항상 이 스토어만 본다 — 카드와 드로어가 같은 값을 보여야 하고,
 * 토글 결과가 목록·상세 어느 쪽에서도 즉시 반영돼야 하기 때문이다.
 *
 * ⚠️ 메모리 전용이다. 새로고침하면 비지만, 조회 응답이 `liked` 를 실어 주므로 목록·상세를
 *    부르는 순간 서버 상태로 복구된다(예전처럼 항상 미찜으로 보이지 않는다).
 */
interface PoiLikeState {
  /** poiId → 찜 여부 */
  liked: Record<string, boolean>;
  /** poiId → 총 좋아요 수. 목록 응답엔 없어 상세를 열었거나 토글한 POI 만 값이 있다. */
  totalLiked: Record<string, number>;
  /**
   * 찜 상태 세팅(낙관적 업데이트·롤백·서버 확정에 공용).
   * `count` 를 주면 개수도 갱신하고, 생략하면 개수는 건드리지 않는다.
   */
  setLiked: (poiId: string, liked: boolean, count?: number) => void;
  /**
   * 조회 응답(GBC017/018)의 찜 정보를 싣는다. **이미 아는 값은 덮지 않는다** —
   * 상세 응답은 세션 캐시라(그리고 목록도 재조회 없이 오래 머문다) 방금 토글한 결과를
   * 낡은 응답이 되돌리는 사고를 막는다. 세션이 바뀌면 `reset()` 이 비우므로 다시 채워진다.
   * 필드 단위로 판단한다 — 목록(`liked` 만)이 먼저 와도 상세의 `totalLiked` 는 채워진다.
   */
  hydrate: (
    entries: { poiId: string; liked: boolean; totalLiked?: number }[],
  ) => void;
  /** 세션이 바뀌면 호출. 찜은 사용자별 서버 상태라 이전 세션 값을 남기면 거짓 표시가 된다. */
  reset: () => void;
}

export const usePoiLikeStore = create<PoiLikeState>((set) => ({
  liked: {},
  totalLiked: {},
  setLiked: (poiId, liked, count) =>
    set((s) => ({
      liked: { ...s.liked, [poiId]: liked },
      totalLiked:
        count === undefined
          ? s.totalLiked
          : { ...s.totalLiked, [poiId]: count },
    })),
  hydrate: (entries) =>
    set((s) => {
      const liked = { ...s.liked };
      const totalLiked = { ...s.totalLiked };
      let changed = false;
      entries.forEach((e) => {
        if (!(e.poiId in liked)) {
          liked[e.poiId] = e.liked;
          changed = true;
        }
        if (e.totalLiked !== undefined && !(e.poiId in totalLiked)) {
          totalLiked[e.poiId] = e.totalLiked;
          changed = true;
        }
      });
      // 새로 채운 값이 없으면 참조를 유지한다 — 목록 렌더마다 구독자를 깨우지 않도록.
      return changed ? { liked, totalLiked } : s;
    }),
  reset: () => set({ liked: {}, totalLiked: {} }),
}));

/**
 * 세션이 바뀌면 찜 상태를 비운다.
 * 없으면 로그아웃 후에도 이전 사용자의 하트가 채워진 채 남는다(F4 에서 발견).
 */
let lastSession = authSessionKey();
useAuthStore.subscribe(() => {
  const next = authSessionKey();
  if (next === lastSession) return;
  lastSession = next;
  usePoiLikeStore.getState().reset();
});
