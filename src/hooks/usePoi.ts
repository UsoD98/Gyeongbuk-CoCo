import { useCallback, useEffect, useMemo } from 'react';

import { getPoi } from '@/api/poi.ts';
import type { PoiDetail } from '@/api/poi.ts';
import { useAsync } from '@/hooks/useAsync.ts';
import { usePoiResolver } from '@/hooks/usePoiResolver.ts';
import { authSessionKey, useAuthStore } from '@/stores/authStore.ts';
import { usePoiLikeStore } from '@/stores/poiLikeStore.ts';
import { withDetail } from '@/utils/poiDetail.ts';
import type { Poi } from '@/types/planner.ts';

/**
 * 단일 POI(상세 드로어용, GBC018)의 데이터 소스를 캡슐화한 훅.
 *
 * ▷ P0: 목 데이터 → ▷ P2: 코스 장소(`apiPois`) + 큐레이션 카탈로그(`poiCatalog`) 병합
 * → ▷ **P3(현재): 위 병합 결과에 `GET /poi/{contentId}` 실상세를 얹는다.**
 *
 * ▷ 백엔드 0.6.4/0.6.7 로 상세에 `liked`·`totalLiked`·`stars` 가 실린다. 앞의 둘은
 *   `poiLikeStore` 로 넘겨(하트·좋아요 수의 출처를 한 곳으로 유지) 토글 응답과 같은 자리에서
 *   갱신되게 하고, `stars` 는 `withDetail` 이 `Poi.rating` 으로 옮긴다.
 *
 * 표시 전략은 **점진적 보강**이다: 이미 손에 있는 목록/코스 데이터로 즉시 그리고(이름·썸네일·
 * 분류), 상세가 도착하면 소개·전화·주소·홈페이지·부가정보를 채운다. 상세를 기다리며 빈 화면을
 * 보여주지 않는다 — GBC018 은 TourAPI 라이브 조회라 느릴 수 있다.
 *
 * ⚠️ 훅이므로 조건부로 호출하지 말 것(컴포넌트 최상단에서 호출). `poiId` 가 null 이면 조회하지 않는다.
 * ⚠️ 목 POI(슬러그 id)·실 contentId 가 아닌 값은 서버 조회를 건너뛴다(`poi` 만 돌려준다).
 */
export interface PoiView {
  /** 표시용 POI(기존 소스 + 상세 보강). 아직 아무 소스도 없으면 undefined. */
  poi: Poi | undefined;
  /** 상세 원문 — 소개·연락처·부가정보처럼 `Poi` 에 자리가 없는 값. */
  detail: PoiDetail | null;
  /** 상세 조회 진행 중(기존 데이터는 이미 `poi` 로 나가 있다). */
  loading: boolean;
  error: unknown;
  reload: () => void;
}

/**
 * 상세 응답 캐시(contentId → 응답)와 진행 중 요청 공유.
 *
 * 드로어를 닫았다 다시 열거나 같은 POI 를 카드→마커로 다시 열 때 재요청하지 않는다. 상세는
 * TourAPI 라이브 조회라 왕복이 비싸고 내용은 거의 변하지 않는다. 세션 동안만 유지(메모리).
 */
const cache = new Map<string, PoiDetail>();
const inflight = new Map<string, Promise<PoiDetail>>();

/**
 * 캐시 키에 **세션**을 넣는다 — 응답의 `liked`·`totalLiked` 는 사용자별 값이라, 로그아웃
 * 후에도 이전 사용자의 응답을 재사용하면 하트가 거짓으로 보인다(`poiLikeStore.reset` 과 같은 이유).
 * 세션이 바뀌면 열려 있는 드로어도 `session` 변화로 다시 조회한다.
 */
function detailKey(contentId: number, session: string): string {
  return `${session}|${contentId}`;
}

function fetchDetailShared(
  contentId: number,
  session: string,
): Promise<PoiDetail> {
  const key = detailKey(contentId, session);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;
  const req = getPoi(contentId)
    .then((detail) => {
      cache.set(key, detail);
      return detail;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, req);
  return req;
}

/** 실 contentId(양수 정수)만 서버 조회 대상. 목 POI 슬러그는 null. */
function contentIdOf(poiId: string | null): number | null {
  if (!poiId) return null;
  const n = Number(poiId);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function usePoi(poiId: string | null): PoiView {
  const resolvePoi = usePoiResolver();
  const base = poiId ? resolvePoi(poiId) : undefined;
  const contentId = contentIdOf(poiId);
  const hydrateLikes = usePoiLikeStore((s) => s.hydrate);
  // 세션 키 — 값이 바뀌면(로그인/로그아웃) fetcher 참조가 바뀌어 상세를 다시 조회한다.
  const session = useAuthStore(() => authSessionKey());

  const fetcher = useCallback(async (): Promise<PoiDetail | null> => {
    if (contentId == null) return null;
    return fetchDetailShared(contentId, session);
  }, [contentId, session]);

  const { data, loading, error, reload } = useAsync(fetcher);
  // 이미 받아 둔 상세는 동기로 꺼낸다 — 드로어를 다시 열 때 스켈레톤이 한 프레임 깜빡이지 않게.
  const cached =
    contentId != null ? (cache.get(detailKey(contentId, session)) ?? null) : null;
  // `useAsync` 는 파라미터가 바뀌어도 이전 data 를 유지한다(stale-while-revalidate).
  // 다른 POI 로 갈아탄 직후 이전 POI 의 소개가 새 제목 아래 보이면 안 되므로 id 를 대조한다.
  // 조회 대상이 아니면(드로어 닫힘·목 POI) 로딩·에러로도 보이지 않게 한다.
  const fresh = contentId != null && data?.contentId === contentId ? data : null;
  const detail = fresh ?? cached;

  const poi = useMemo(() => withDetail(base, detail), [base, detail]);

  // 찜 여부·총 좋아요 수를 스토어로 넘긴다 — 하트와 개수는 카드·드로어가 같은 출처를 봐야 하고,
  // 토글 응답(`{liked,totalLiked}`)이 같은 자리에 확정된다. 이미 아는 값은 덮지 않는다.
  useEffect(() => {
    if (!detail) return;
    hydrateLikes([
      {
        poiId: String(detail.contentId),
        liked: detail.liked,
        totalLiked: detail.totalLiked,
      },
    ]);
  }, [detail, hydrateLikes]);

  return {
    poi,
    detail,
    loading: contentId != null && loading && !detail,
    error: contentId != null && !detail ? error : null,
    reload,
  };
}
