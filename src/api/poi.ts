/**
 * POI API 응답/요청 타입 (openapi.yaml GBC017~019 기준).
 *
 * ⚠️ 잠정(provisional) 타입:
 *   GBC017(목록)·GBC018(상세)는 스펙 x-status=`보류`이며 200 응답 스키마가 정의돼 있지 않다.
 *   아래 응답 타입은 TourAPI 공통 필드 관례 + 가이드(§3 GBC017/018)를 근거로 한 잠정안이다.
 *   백엔드 확정 시 P2/P3(섬 P)에서 교정한다. docs/FE_계약_추적표.md 참조.
 */

import { apiClient } from '@/api/client.ts';
import type { ApiResponse } from '@/api/types.ts';
import type { PoiCat } from '@/types/planner.ts';

/**
 * 콘텐츠 유형 (12:관광지 / 14:문화시설 / 32:숙박 / 39:음식점).
 * FE `PoiCat`(4종) 대응값만 정의. 백엔드 `PlaceType`엔 15(축제)/28(레포츠)/38(쇼핑)도 있어
 * POI 목록/상세(P2/P3) 확장 시 넓힌다.
 */
export type ContentTypeId = 12 | 14 | 32 | 39;

/**
 * FE `PoiCat`(sight/culture/stay/food) → 스펙 `contentTypeId`(12/14/32/39).
 * 목→API 전환 시 UI 카테고리 칩·필터를 스펙 파라미터(`contentTypeId`)로 보낼 때 쓴다.
 */
export const CONTENT_TYPE_BY_CAT = {
  sight: 12,
  culture: 14,
  stay: 32,
  food: 39,
} as const satisfies Record<PoiCat, ContentTypeId>;

/**
 * 역방향: 스펙 `contentTypeId`(12/14/32/39) → FE `PoiCat`.
 * P2/P3 응답(`contentTypeId` 포함)을 UI `Poi.cat`으로 변환할 때 쓴다.
 */
export const CAT_BY_CONTENT_TYPE = {
  12: 'sight',
  14: 'culture',
  32: 'stay',
  39: 'food',
} as const satisfies Record<ContentTypeId, PoiCat>;

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

/**
 * POI 좋아요 토글 응답 (GBC019 POST /poi/{contentId}/like).
 * 백엔드 `PoiLikeResponseDto`와 일치(실측). GBC019는 스펙 `완료`라 잠정 아님.
 */
export interface TogglePoiLikeResponse {
  liked: boolean;
  /** 해당 POI의 총 좋아요 수 */
  likes: number;
}

// ── API 함수 ───────────────────────────────────────────────

/**
 * POST /poi/{contentId}/like — POI 좋아요 토글 (GBC019). 로그인 필수(Bearer).
 * 응답 data 는 `{ liked, likes }`(백엔드 `PoiLikeResponseDto` 실측). 스펙 `완료`.
 * ⚠️ `contentId` 는 실 TourAPI 콘텐츠 id(양수). 목 POI(슬러그 id)에는 실 contentId 가 없어
 *    호출부(`usePoiLike`)에서 서버 호출을 건너뛴다 — 실동작은 POI 실데이터(P2/P3) 이후 완결.
 */
export async function togglePoiLike(
  contentId: number,
): Promise<TogglePoiLikeResponse> {
  const { data } = await apiClient.post<ApiResponse<TogglePoiLikeResponse>>(
    `/poi/${contentId}/like`,
  );
  return data.data;
}
