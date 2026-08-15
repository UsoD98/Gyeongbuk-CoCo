/**
 * POI API 응답/요청 타입 (openapi.yaml GBC017~019 기준).
 *
 * - GBC017(목록): 백엔드 v0.5.1에서 구현됨. 아래 타입은 `PoiCurationResponseDto`/
 *   `PoiCurationItemDto` 실측 1:1(P2에서 잠정안 교체).
 * - GBC018(상세)은 여전히 미구현(`GET /poi/{contentId}` 없음) → `PoiDetail`은 잠정 유지, P3에서 교정.
 *   docs/FE_계약_추적표.md 참조.
 */

import { apiClient } from '@/api/client.ts';
import type { ApiResponse } from '@/api/types.ts';
import type { PoiCat } from '@/types/planner.ts';

/**
 * TourAPI 콘텐츠 유형.
 * 12:관광지 / 14:문화시설 / 15:축제공연행사 / 25:여행코스 / 28:레포츠 / 32:숙박 / 38:쇼핑 / 39:음식점.
 * GBC017 응답에 8종이 모두 등장한다(경주 실측) → UI 4종(`PoiCat`)으로 접어서 쓴다.
 */
export type ContentTypeId = 12 | 14 | 15 | 25 | 28 | 32 | 38 | 39;

/**
 * FE `PoiCat`(sight/culture/stay/food) → 스펙 `contentTypeId`.
 * UI 카테고리 칩·필터를 서버 파라미터(`contentTypeId`)로 보낼 때 쓴다(대표값 1개씩).
 */
export const CONTENT_TYPE_BY_CAT = {
  sight: 12,
  culture: 14,
  stay: 32,
  food: 39,
} as const satisfies Record<PoiCat, ContentTypeId>;

/**
 * 역방향: 스펙 `contentTypeId` → FE `PoiCat`(4종).
 * 4종에 없는 유형은 백엔드 `PlaceType`→cat 규칙(plannerStore)과 같은 기준으로 접는다:
 * 레포츠·쇼핑·여행코스=관광(sight), 축제=문화(culture).
 */
export const CAT_BY_CONTENT_TYPE = {
  12: 'sight',
  14: 'culture',
  15: 'culture',
  25: 'sight',
  28: 'sight',
  32: 'stay',
  38: 'sight',
  39: 'food',
} as const satisfies Record<ContentTypeId, PoiCat>;

/** 알 수 없는 `contentTypeId`도 안전하게 접는다(신규 유형 대비). 기본 'sight'. */
export function catOfContentType(contentTypeId: number | null): PoiCat {
  return (
    CAT_BY_CONTENT_TYPE[contentTypeId as ContentTypeId] ?? ('sight' as PoiCat)
  );
}

/**
 * GET /poi 쿼리 파라미터 (GBC017) — 백엔드 `PoiController.getPoiList` 실측.
 * ⚠️ `sigunguCode`는 **단수·필수**(코스 생성의 복수 `sigunguCodes`와 다름).
 *    값은 3자리 bare 코드(예 경주 `130`). 백엔드가 `35`(TourAPI areaCode) 접두 5자리도 정규화하지만
 *    FE는 `sigunguStore.value`(bare)를 그대로 보낸다.
 * ⚠️ `theme` 파라미터는 **백엔드에 없다**(가이드 §3 문구와 차이) → 테마 필터는 서버에서 불가.
 */
export interface PoiListParams {
  sigunguCode: string;
  /** 필수. 현재 백엔드는 검증만 하고 필터에는 쓰지 않는다. */
  peopleCount: number;
  contentTypeId?: ContentTypeId;
}

/** POI 목록 항목 (GBC017) — 백엔드 `PoiCurationItemDto` 1:1. */
export interface PoiSummary {
  contentId: number;
  contentTypeId: number;
  title: string;
  /** TourAPI mapx = 경도(lng). 없으면 null. */
  mapx: number | null;
  /** TourAPI mapy = 위도(lat). 없으면 null. */
  mapy: number | null;
  /** TourAPI firstimage URL. 없으면 null/빈 문자열. */
  thumbnail: string | null;
  /** 1인 평균 가격. ⚠️ 현재 백엔드가 항상 null(근거 테이블 소실, BOQ14). */
  avgPrice: number | null;
}

/** GET /poi 응답 봉투 안쪽 (GBC017) — 백엔드 `PoiCurationResponseDto` 1:1. */
export interface PoiListResponse {
  /** 해당 시군구에 큐레이션 데이터가 있는지. false면 `items`는 빈 배열. */
  available: boolean;
  items: PoiSummary[];
}

/** POI 상세 통합 (GBC018) — ⚠️ 잠정: 백엔드 미구현(P3 대기). */
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
 * GET /poi — 큐레이션 POI 목록 (GBC017). 인증 불필요(`SecurityConfig` permitAll).
 * 데이터 없는 시군구는 200 + `{available:false, items:[]}`, 필수 파라미터 누락은 400.
 */
export async function getPois(params: PoiListParams): Promise<PoiListResponse> {
  const { data } = await apiClient.get<ApiResponse<PoiListResponse>>('/poi', {
    params,
  });
  return data.data;
}

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
