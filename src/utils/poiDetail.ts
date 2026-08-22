/**
 * POI 상세(GBC018)를 UI `Poi` 에 얹는 순수 규칙.
 *
 * 훅(`hooks/usePoi.ts`)은 조회·캐시·React 결선만 담당하고, "어떤 칸을 누가 채우는가"는
 * 여기 모아 둔다(`utils/coursePayload.ts` 와 같은 구성). 순수 함수라 단독 검증이 가능하다.
 */

import type { PoiDetail } from '@/api/poi.ts';
import { placeholderPlaceName } from '@/stores/plannerStore.ts';
import { isValidTourCoord } from '@/utils/coords.ts';
import { httpsUrl } from '@/utils/format.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 부가정보에서 운영시간을 찾는다. TourAPI `infoname` 은 유형마다 달라
 * ('이용시간'·'영업시간'·'관람시간'·'운영시간') 이름에 '시간' 이 들어간 첫 항목을 쓴다.
 * 코스 응답(`operatingHours`)이 이미 있으면 그쪽이 우선이므로 여기 값은 폴백이다.
 */
export function hoursFromInfo(detail: PoiDetail): string {
  const hit = (detail.infoList ?? []).find(
    (i) => i.infoname?.includes('시간') && i.infotext?.trim(),
  );
  return hit?.infotext?.trim() ?? '';
}

/** 상세의 대표 이미지(없으면 보조 이미지). http → https 승격. */
function imageOf(detail: PoiDetail): string | undefined {
  return httpsUrl(detail.firstimage) ?? httpsUrl(detail.firstimage2);
}

/** 상세 좌표(유효할 때만). TourAPI `mapx`=경도 / `mapy`=위도. */
function coordOf(detail: PoiDetail): { lat?: number; lng?: number } {
  if (!isValidTourCoord(detail.mapx, detail.mapy)) return {};
  return { lat: detail.mapy as number, lng: detail.mapx as number };
}

/**
 * 어느 레지스트리에도 없는 POI(카탈로그를 안 불러온 지역의 코스 장소 등)를 상세만으로 그린다.
 * 코스·목록이 채우던 칸(방문 시각·비용·테마·평점)은 알 수 없으므로 기본값이다.
 */
export function poiFromDetail(detail: PoiDetail): Poi {
  const { lat, lng } = coordOf(detail);
  return {
    id: String(detail.contentId),
    region: '',
    name: detail.title,
    cat: 'sight',
    themes: [],
    buckets: [1, 2, '3-4'],
    price: 0,
    priceNote: '가격 미정',
    hours: hoursFromInfo(detail),
    rating: 0,
    reviews: 0,
    x: 50,
    y: 50,
    lat,
    lng,
    tags: [],
    img: detail.title,
    imageUrl: imageOf(detail),
    desc: '',
  };
}

/**
 * 병합 결과(코스 응답 + 큐레이션 목록)에 상세를 얹는다.
 *
 * 규칙: 상세는 **빈 칸만** 채운다. 코스 응답의 방문 시각·1인 비용·운영시간, 목록의 실좌표처럼
 * 이미 확정된 값이 상세로 뒤집히면 안 된다(같은 TourAPI 원본이라도 경로마다 정확도가 다르다).
 * 예외는 이름 — `장소 #id` placeholder 만 상세 제목으로 승격한다.
 */
export function withDetail(
  poi: Poi | undefined,
  detail: PoiDetail | null,
): Poi | undefined {
  if (!detail) return poi;
  if (!poi) return poiFromDetail(detail);

  const { lat, lng } = coordOf(detail);
  const nameIsPlaceholder = poi.name === placeholderPlaceName(poi.id);
  // 좌표는 위/경도 한쪽만 있으면 지도에 찍을 수 없다 → 쌍이 갖춰졌을 때만 기존 값을 지킨다.
  const hasOwnCoord = poi.lat != null && poi.lng != null;
  return {
    ...poi,
    name: nameIsPlaceholder || !poi.name ? detail.title : poi.name,
    hours: poi.hours || hoursFromInfo(detail),
    imageUrl: poi.imageUrl ?? imageOf(detail),
    lat: hasOwnCoord ? poi.lat : lat,
    lng: hasOwnCoord ? poi.lng : lng,
  };
}
