/**
 * POI API 응답/요청 타입 (openapi.yaml GBC017~019 기준).
 *
 * ⚠️ 잠정(provisional) 타입:
 *   GBC017(목록)·GBC018(상세)는 스펙 x-status=`보류`이며 200 응답 스키마가 정의돼 있지 않다.
 *   아래 응답 타입은 TourAPI 공통 필드 관례 + 가이드(§3 GBC017/018)를 근거로 한 잠정안이다.
 *   백엔드 확정 시 P2/P3(섬 P)에서 교정한다. docs/FE_계약_추적표.md 참조.
 */

/** 콘텐츠 유형 (12:관광지 / 14:문화시설 / 32:숙박 / 39:음식점) */
export type ContentTypeId = 12 | 14 | 32 | 39;

/**
 * 목업 POI 카테고리(@/types/planner.ts `PoiCat`) ↔ 스펙 `contentTypeId` 매핑.
 * P0에서 목→API 전환 시 이 표로 양방향 변환한다.
 */
export const CONTENT_TYPE_BY_CAT = {
  sight: 12,
  culture: 14,
  stay: 32,
  food: 39,
} as const satisfies Record<string, ContentTypeId>;

/** GET /poi 쿼리 파라미터 (GBC017) */
export interface PoiListParams {
  sigunguCode: string; // 예: '35130'
  peopleCount: number; // 1 / 2 / 3 이상
  /** 콤마 구분 테마 문자열(예: '자연,맛집'). 스펙 선택 파라미터. */
  theme?: string;
  contentTypeId?: ContentTypeId;
}

/**
 * POI 목록 항목 (GBC017) — ⚠️ 잠정: 스펙 응답 스키마 미정의.
 */
export interface PoiSummary {
  contentId: number;
  contentTypeId: ContentTypeId;
  title: string;
  addr?: string;
  /** TourAPI mapx = 경도(lng) */
  mapX?: number;
  /** TourAPI mapy = 위도(lat) */
  mapY?: number;
  /** TourAPI firstimage */
  imageUrl?: string;
  /** 좋아요 상태. 응답 포함 여부 미확정(GBC019 참조). */
  liked?: boolean;
}

/** POI 상세 통합 (GBC018) — ⚠️ 잠정: 스펙 응답 스키마 미정의. */
export interface PoiDetail extends PoiSummary {
  tel?: string;
  /** 소개(overview) */
  overview?: string;
  homepage?: string;
}

/** POI 좋아요 토글 응답 (GBC019 POST /poi/{contentId}/like) — ⚠️ 잠정. */
export interface TogglePoiLikeResponse {
  liked: boolean;
}
