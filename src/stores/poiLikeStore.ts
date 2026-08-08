import { create } from 'zustand';

/**
 * POI 좋아요(찜) 상태(GBC019).
 * 결과 카드(`POICard`)와 상세 드로어(`PoiDrawer`)가 같은 POI 의 찜 상태를 공유하므로 스토어로 둔다.
 * key 는 `Poi.id`(문자열) — 실 POI 는 `String(contentId)`, 목 POI 는 슬러그.
 *
 * 서버 진실은 `usePoiLike` 가 토글 응답으로 확정하고, 여기엔 표시용 상태만 보관한다.
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
}));
