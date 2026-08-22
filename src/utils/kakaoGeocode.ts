/**
 * 장소명 → 좌표(카카오 로컬 키워드 검색) **폴백**.
 *
 * 원래는 코스 조회 응답(GBC012·014)에 좌표가 아예 없어(추적표 #8) 컬렉션에서 코스를 열면
 * 지도에 찍을 좌표가 하나도 없었고, 이 모듈이 그 전부를 메웠다. 백엔드 0.6.3(`cd6c7ec`)이
 * `mapx`/`mapy` 를 실어 주기로 해 **정공법으로 대체됐다** → 이제 이 폴백이 도는 대상은
 * 백엔드 POI 캐시 미스로 좌표가 `null` 로 온 장소뿐이다(실측: 같은 코스 안에 섞여 있다).
 * 생성 직후(GBC010) 응답에도 좌표가 없지만 그 화면은 큐레이션 목록(GBC017)이 좌표를 준다.
 *
 * 실패는 전부 `null` 이다(키 없음·도메인 미등록·로컬 API 미활성·무응답·경북 밖 동명 장소).
 * 호출부는 좌표를 못 얻으면 기존과 동일하게 "지도에 표시할 좌표가 없어요"로 남는다.
 */

import { loadKakaoMaps } from '@/utils/kakaoMap.ts';
import type { LatLng } from '@/types/planner.ts';

/** 응답이 오지 않는 환경(도메인 미등록 등)에서 영원히 매달리지 않도록 둔 상한. */
const TIMEOUT_MS = 6000;

/**
 * 경상북도 대략 경계(여유 포함). 동명 장소가 서울·부산에 있을 때 엉뚱한 좌표를 집지 않도록
 * 이 범위 안의 결과만 채택한다. 범위 안에 하나도 없으면 좌표 없음으로 본다.
 */
const GYEONGBUK_BBOX = { minLat: 35.3, maxLat: 37.3, minLng: 127.6, maxLng: 129.7 };

const inBbox = ({ lat, lng }: LatLng): boolean =>
  lat >= GYEONGBUK_BBOX.minLat &&
  lat <= GYEONGBUK_BBOX.maxLat &&
  lng >= GYEONGBUK_BBOX.minLng &&
  lng <= GYEONGBUK_BBOX.maxLng;

/**
 * 장소명 → 좌표. 같은 이름은 한 번만 조회한다(결과·실패 모두 캐시 — 실패를 반복 조회하면
 * 지도를 열 때마다 수십 건의 헛요청이 나간다).
 */
const cache = new Map<string, Promise<LatLng | null>>();

export function geocodePlaceName(name: string): Promise<LatLng | null> {
  const keyword = name.trim();
  if (!keyword) return Promise.resolve(null);
  const hit = cache.get(keyword);
  if (hit) return hit;
  const req = search(keyword);
  cache.set(keyword, req);
  return req;
}

async function search(keyword: string): Promise<LatLng | null> {
  const maps = await loadKakaoMaps();
  const services = maps?.services;
  if (!services?.Places) return null;

  return new Promise<LatLng | null>((resolve) => {
    let settled = false;
    const done = (value: LatLng | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => done(null), TIMEOUT_MS);

    try {
      new services.Places().keywordSearch(keyword, (data, status) => {
        if (status !== services.Status.OK || !data?.length) {
          done(null);
          return;
        }
        // 카카오 로컬은 x=경도, y=위도(문자열)로 준다.
        const found = data
          .map((d) => ({ lat: Number(d.y), lng: Number(d.x) }))
          .find(
            (c) => Number.isFinite(c.lat) && Number.isFinite(c.lng) && inBbox(c),
          );
        done(found ?? null);
      });
    } catch {
      done(null);
    }
  });
}
