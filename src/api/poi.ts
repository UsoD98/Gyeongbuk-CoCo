/**
 * POI API 응답/요청 타입 (openapi.yaml GBC017~019 기준).
 *
 * - GBC017(목록): 백엔드 v0.5.1에서 구현됨. 아래 타입은 `PoiCurationResponseDto`/
 *   `PoiCurationItemDto` 실측 1:1(P2에서 잠정안 교체).
 * - GBC018(상세): 백엔드 구현 확인(2026-08-22, `PoiController.getPoiDetail` + `PoiDetailServiceImpl`)
 *   → `PoiDetail`을 `PoiDetailResponseDto` 실측 1:1로 교체(P3에서 잠정안 폐기).
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
  /**
   * 로그인 사용자의 찜 여부(백엔드 0.6.4, `user_poi_like` 기준).
   * 이 API 는 permitAll 이라 **비로그인·탈퇴 사용자면 예외 없이 `false`** 로 온다.
   * ⚠️ 목록에는 총 좋아요 수(`totalLiked`)가 **없다** — 상세(GBC018)에만 있다.
   */
  liked: boolean;
  /**
   * 별점(백엔드 0.6.7, `poi_rating.stars` = `DECIMAL(3,1)`).
   * 평점 행이 없거나 아직 입력되지 않은 POI 는 `null`(에러 아님).
   */
  stars: number | null;
}

/** GET /poi 응답 봉투 안쪽 (GBC017) — 백엔드 `PoiCurationResponseDto` 1:1. */
export interface PoiListResponse {
  /** 해당 시군구에 큐레이션 데이터가 있는지. false면 `items`는 빈 배열. */
  available: boolean;
  items: PoiSummary[];
}

/**
 * POI 부가정보 한 줄 (GBC018 `infoList`) — TourAPI `detailInfo` 의 이름/내용 쌍.
 * contentTypeId 마다 항목이 다르다(관광지=이용시간·주차·문의, 음식점=대표메뉴·영업시간 …).
 * 백엔드가 `infoname`/`infotext` 중 **하나만 있는 행도 담는다** → 각각 null 가능.
 */
export interface PoiInfoItem {
  infoname: string | null;
  infotext: string | null;
}

/**
 * POI 상세 통합 (GBC018 GET /poi/{contentId}) — 백엔드 `PoiDetailResponseDto` 실측 1:1.
 * 인증 불필요(`SecurityConfig` 의 `/api/v1/poi/**` permitAll).
 *
 * ⚠️ 목록(`PoiSummary`)과 필드명이 다르다 — 썸네일이 `thumbnail` 이 아니라 `firstimage`(대표)·
 *    `firstimage2`(보조)이고 좌표는 목록과 같은 `mapx`(경도)/`mapy`(위도)다.
 * ⚠️ `overview`·`homepage`·`infotext` 는 **백엔드가 HTML 을 이미 제거**해서 준다
 *    (`stripHtml`: `<br>` → 줄바꿈, 나머지 태그 제거) → FE 는 그대로 텍스트로 렌더한다.
 *    줄바꿈이 살아 있으므로 `whitespace-pre-line` 이 필요하다.
 * ⚠️ `avgPrice` 는 **항상 null**(백엔드가 명시적으로 null 고정, TODO BOQ14) → 목록과 동일.
 * ⚠️ 없는 contentId 는 404 + `{code:404, msg:'존재하지 않는 POI입니다'}`(공통 봉투).
 */
export interface PoiDetail {
  contentId: number;
  contentTypeId: number | null;
  /** 제목. 백엔드가 없을 때 '(제목없음)' 으로 채워 항상 문자열이다. */
  title: string;
  tel: string | null;
  homepage: string | null;
  /** 소개글. 여러 줄일 수 있다(백엔드가 `<br>` 을 `
` 으로 바꿔 준다). */
  overview: string | null;
  /** 대표 이미지 URL(TourAPI `firstimage`). */
  firstimage: string | null;
  /** 보조 이미지 URL(TourAPI `firstimage2`). */
  firstimage2: string | null;
  addr1: string | null;
  addr2: string | null;
  /** TourAPI mapx = 경도(lng). */
  mapx: number | null;
  /** TourAPI mapy = 위도(lat). */
  mapy: number | null;
  /** ⚠️ 항상 null(BOQ14). */
  avgPrice: number | null;
  /** 부가정보 쌍. 없으면 빈 배열(백엔드가 `List.of()` 로 보장). */
  infoList: PoiInfoItem[];
  /** 로그인 사용자의 찜 여부(백엔드 0.6.4). 비로그인이면 `false`. */
  liked: boolean;
  /** 총 좋아요 수(백엔드 0.6.4, `poi_rating.likes`). 평점 행이 없으면 `0`. */
  totalLiked: number;
  /** 별점(백엔드 0.6.7). 데이터가 없으면 `null`. */
  stars: number | null;
}

/**
 * POI 좋아요 토글 응답 (GBC019 POST /poi/{contentId}/like).
 * 백엔드 `PoiLikeResponseDto` 와 일치(실측).
 * ⚠️ 백엔드 0.6.5 에서 총개수 필드명이 `likes` → **`totalLiked`** 로 바뀌었다(조회 응답과 통일).
 *    필드명이 같아져 **재조회 없이** 이 응답으로 목록·상세의 `liked`/`totalLiked` 를 그대로 갱신한다.
 */
export interface TogglePoiLikeResponse {
  liked: boolean;
  /** 해당 POI 의 총 좋아요 수(`poi_rating.likes`). */
  totalLiked: number;
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
 * GET /poi/{contentId} — POI 상세 통합 (GBC018). 인증 불필요(`SecurityConfig` permitAll).
 * TourAPI 라이브 조회라 응답이 느릴 수 있고, 없는 contentId 는 404 다.
 */
export async function getPoi(contentId: number): Promise<PoiDetail> {
  const { data } = await apiClient.get<ApiResponse<PoiDetail>>(
    `/poi/${contentId}`,
  );
  return data.data;
}

/**
 * POST /poi/{contentId}/like — POI 좋아요 토글 (GBC019). 로그인 필수(Bearer).
 * 응답 data 는 `{ liked, totalLiked }`(백엔드 0.6.5 실측). 스펙 `완료`.
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
