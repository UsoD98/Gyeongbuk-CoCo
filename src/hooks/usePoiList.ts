import { useCallback, useEffect, useMemo } from 'react';

import { catOfContentType, getPois } from '@/api/poi.ts';
import type { PoiListResponse, PoiSummary } from '@/api/poi.ts';
import { useAsync } from '@/hooks/useAsync.ts';
import { CATEGORIES } from '@/mocks/planner.ts';
import { useAuthStore, authSessionKey } from '@/stores/authStore.ts';
import { usePlannerStore } from '@/stores/plannerStore.ts';
import { usePoiLikeStore } from '@/stores/poiLikeStore.ts';
import { useSigunguStore } from '@/stores/sigunguStore.ts';
import { isValidTourCoord as validCoord } from '@/utils/coords.ts';
import { httpsUrl } from '@/utils/format.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 큐레이션 POI 목록(GBC017)의 데이터 소스를 캡슐화한 훅.
 *
 * ▷ P0: 목 데이터를 동기 필터 → ▷ **P2(현재): `GET /poi` 실데이터**.
 *   소비처(`ResultsPanel`)는 P0에서 맞춰 둔 `{pois, ready, loading, error, reload}` 3-상태를
 *   그대로 소비하므로 훅 내부만 교체됐다.
 *
 * ⚠️ 백엔드 `GET /poi`는 `sigunguCode`가 **단수·필수**다. 검색은 시군구 복수 선택을 허용하므로
 *    선택 지역마다 병렬 호출(`Promise.all`)해 결과를 합친다(정책: 사용자가 고른 지역 전부 노출).
 * ⚠️ 백엔드에 `theme` 파라미터가 없어 **테마 필터/정렬은 불가**(P0의 목 기반 테마 우선정렬 제거).
 * ⚠️ `avgPrice`는 백엔드가 항상 null(BOQ14) → 가격은 0("무료"가 아닌 '정보 준비 중'으로 표기).
 * ▷ 백엔드 0.6.4/0.6.7 로 항목에 `liked`(로그인 사용자 찜 여부)·`stars`(별점)가 실린다.
 *   `liked` 는 `poiLikeStore` 에 싣고(하트가 새로고침 후에도 서버 상태로 보인다), `stars` 는
 *   `Poi.rating` 으로 옮긴다. 총 좋아요 수(`totalLiked`)는 **목록엔 없다** — 상세(GBC018)에만 있다.
 */
export interface UsePoiListArgs {
  /** 시군구 코드 배열(3자리 bare, `sigunguStore.value`). 비어 있으면 조회하지 않는다. */
  dests: string[];
  pax: number;
}

export interface PoiListState {
  pois: Poi[];
  /**
   * 큐레이션 데이터 제공 지역 여부 = 선택 지역 중 하나라도 서버 `available:true`.
   * 데이터 없는 시군구는 200 + `{available:false, items:[]}`로 온다.
   */
  ready: boolean;
  loading: boolean;
  error: unknown;
  reload: () => void;
}

/** 지역별 응답을 지역코드와 짝지어 평탄화한 중간 표현. */
interface FlatItem {
  item: PoiSummary;
  sigunguCode: string;
}

/**
 * 진행 중인 동일 요청 공유(in-flight dedup).
 * Planner 는 데스크톱·모바일 ResultsPanel 을 **동시에 마운트**하고 dev StrictMode 는 effect 를
 * 두 번 돌린다 → 같은 (지역, 인원) 조회가 동시에 2~4회 나간다. `GET /poi` 는 TourAPI 라이브
 * 조회라 동시 호출이 겹치면 503 이 나기도 해서(실측), 아직 끝나지 않은 동일 요청은 공유한다.
 * 완료 즉시 항목을 지우므로 캐시가 아니다(재조회는 항상 새 요청).
 */
const inflight = new Map<string, Promise<PoiListResponse>>();

function fetchPoisShared(
  sigunguCode: string,
  peopleCount: number,
  session: string,
): Promise<PoiListResponse> {
  // 세션까지 키에 넣는다 — 응답의 `liked` 는 사용자별 값이라 로그인 전후 요청을 공유하면 안 된다.
  const key = `${sigunguCode}|${peopleCount}|${session}`;
  const pending = inflight.get(key);
  if (pending) return pending;
  const req = getPois({ sigunguCode, peopleCount }).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, req);
  return req;
}

/**
 * 실좌표(경도/위도)를 플레이스홀더 지도의 % 좌표로 투영한다.
 * 결과 집합의 bounding box를 10~90% 범위에 맞춰 정규화(위도는 위쪽이 커야 하므로 반전).
 * 좌표가 없거나 bbox가 한 점이면 중앙(50)에 둔다. 실지도(P3, 카카오맵) 도입 시 불필요해진다.
 */
function projectToPercent(flat: FlatItem[]): (item: PoiSummary) => {
  x: number;
  y: number;
} {
  const valid = flat
    .map((f) => f.item)
    .filter((i) => validCoord(i.mapx, i.mapy)) as (PoiSummary & {
    mapx: number;
    mapy: number;
  })[];
  const xs = valid.map((i) => i.mapx);
  const ys = valid.map((i) => i.mapy);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const scale = (v: number, min: number, span: number) =>
    span > 0 ? 10 + ((v - min) / span) * 80 : 50;
  return (item) => {
    if (!valid.length || !validCoord(item.mapx, item.mapy)) {
      return { x: 50, y: 50 };
    }
    return {
      x: scale(item.mapx as number, minX, spanX),
      // 위도는 값이 클수록 북쪽(위) → y(%) 는 위가 0이므로 반전.
      y: 100 - scale(item.mapy as number, minY, spanY),
    };
  };
}

/** GBC017 항목 → UI `Poi`. 이름·좌표·썸네일·별점은 실데이터, 설명·시간은 상세(P3)가 채운다. */
function toPoi(
  { item, sigunguCode }: FlatItem,
  regionName: string | undefined,
  pos: { x: number; y: number },
): Poi {
  const cat = catOfContentType(item.contentTypeId);
  // 카카오맵은 실경위도를 그대로 쓴다(폴백 지도용 %좌표 pos 와 별개).
  const hasCoord = validCoord(item.mapx, item.mapy);
  return {
    id: String(item.contentId),
    region: sigunguCode,
    name: item.title,
    cat,
    themes: [],
    buckets: [1, 2, '3-4'],
    // 백엔드 avgPrice 가 항상 null 이라 0 — priceNote 로 '무료'가 아님을 알린다.
    price: item.avgPrice ?? 0,
    priceNote: item.avgPrice == null ? '가격 미정' : '1인 평균',
    // 목록 응답엔 운영시간이 없다(빈 문자열 = 정보 없음). 코스 응답·POI 상세(P3)가 채운다.
    hours: '',
    // 별점(백엔드 0.6.7). 평점 데이터가 없으면 null → 0(= 평점 없음, 표시 생략).
    rating: item.stars ?? 0,
    reviews: 0,
    x: pos.x,
    y: pos.y,
    lat: hasCoord ? (item.mapy as number) : undefined,
    lng: hasCoord ? (item.mapx as number) : undefined,
    tags: [],
    img: CATEGORIES[cat].label,
    imageUrl: httpsUrl(item.thumbnail),
    // 지역을 여러 곳 고르면 결과가 섞이므로 어느 시군구인지 한 줄로 보여준다.
    desc: regionName ?? '',
  };
}

export function usePoiList({ dests, pax }: UsePoiListArgs): PoiListState {
  const getSigunguLabel = useSigunguStore((s) => s.getSigunguLabel);
  const registerPois = usePlannerStore((s) => s.registerPois);
  const hydrateLikes = usePoiLikeStore((s) => s.hydrate);
  // 세션 키. 응답의 `liked` 가 사용자별 값이라, 로그인/로그아웃하면 값이 바뀌어 재조회된다
  // (로그인 직후에도 하트가 미찜으로 남지 않게). 토큰 자체는 axios 인터셉터가 싣는다.
  const session = useAuthStore(() => authSessionKey());

  // 배열은 매 렌더 새 참조라 fetcher 가 불안정해진다 → 문자열 키로 고정.
  const destKey = dests.join(',');

  const fetcher = useCallback(async (): Promise<PoiListResponse[]> => {
    const codes = destKey ? destKey.split(',') : [];
    if (!codes.length) return [];
    return Promise.all(
      codes.map((sigunguCode) => fetchPoisShared(sigunguCode, pax, session)),
    );
  }, [destKey, pax, session]);

  const { data, loading, error, reload } = useAsync(fetcher);

  const pois = useMemo(() => {
    if (!data?.length) return [];
    const codes = destKey ? destKey.split(',') : [];
    const flat: FlatItem[] = [];
    const seen = new Set<number>();
    data.forEach((res, i) => {
      res.items.forEach((item) => {
        // 지역 경계에 걸친 중복 contentId 제거(React key·DnD id 충돌 방지).
        if (seen.has(item.contentId)) return;
        seen.add(item.contentId);
        flat.push({ item, sigunguCode: codes[i] ?? '' });
      });
    });
    const project = projectToPercent(flat);
    return flat.map((f) =>
      toPoi(f, getSigunguLabel(f.sigunguCode), project(f.item)),
    );
  }, [data, destKey, getSigunguLabel]);

  // 결과 목록에서 담은 장소를 코스·예산·드로어가 해석할 수 있도록 스토어 카탈로그에 등록.
  useEffect(() => {
    if (pois.length) registerPois(pois);
  }, [pois, registerPois]);

  // 찜 여부를 스토어에 싣는다(하트의 초기 상태). 이미 아는 값은 `hydrate` 가 덮지 않으므로
  // 방금 토글한 결과가 낡은 목록 응답으로 되돌아가지 않는다.
  useEffect(() => {
    if (!data?.length) return;
    hydrateLikes(
      data.flatMap((res) =>
        res.items.map((item) => ({
          poiId: String(item.contentId),
          liked: item.liked,
        })),
      ),
    );
  }, [data, hydrateLikes]);

  const ready = useMemo(
    () => (data ?? []).some((res) => res.available),
    [data],
  );

  return { pois, ready, loading, error, reload };
}
