/**
 * 카카오맵(Kakao Maps JavaScript SDK) 온디맨드 로더 + 링크 헬퍼.
 *
 * 공유용 `utils/kakaoShare.ts`(=`window.Kakao`, kakao.min.js)와 **다른 SDK**다.
 * 지도는 `dapi.kakao.com/v2/maps/sdk.js`가 `window.kakao.maps`(소문자 k)를 만든다.
 * 두 전역은 이름이 달라 공존하며, 서로의 초기화(`Kakao.init`)와도 무관하다.
 *
 * ⚠️ 카카오맵은 개발자 콘솔의 **Web 플랫폼 사이트 도메인에 등록된 오리진**에서만 뜬다
 *    (`http://localhost:5173` 미등록 시 401로 실패). 키가 없거나 로드가 실패하면
 *    `loadKakaoMaps()`가 `null`을 돌려주고, 호출부(`MapView`)는 기존 플레이스홀더 지도로 폴백한다.
 *    → 지도 영역이 비어 보이는 일은 없다.
 *
 * 사용 키(VITE_KAKAO_JAVASCRIPT_KEY)는 클라이언트 공개 JS 키다(민감정보 아님).
 */

// ── 최소 타입 정의 ────────────────────────────────────────────
// SDK 타입 패키지를 추가하지 않고, 실제로 쓰는 API만 좁게 선언한다.

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoLatLngBounds {
  extend: (latlng: KakaoLatLng) => void;
  isEmpty: () => boolean;
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  getLevel: () => number;
  setLevel: (level: number, options?: { animate?: boolean }) => void;
  setBounds: (bounds: KakaoLatLngBounds, ...padding: number[]) => void;
  /** 현재 보이는 영역. 화면 1도당 픽셀(마커 클러스터링 배율) 계산에 쓴다. */
  getBounds: () => KakaoLatLngBounds;
  relayout: () => void;
}

/**
 * SDK 이벤트 바인딩(`kakao.maps.event`). 줌이 바뀌면 마커 겹침이 달라져 클러스터를
 * 다시 계산해야 하므로 `zoom_changed`·`idle` 을 듣는다.
 * ⚠️ 구버전·부분 로드에서 없을 수 있어 호출부는 optional 로 다룬다.
 */
export interface KakaoEvent {
  addListener: (target: unknown, type: string, handler: () => void) => void;
  removeListener: (target: unknown, type: string, handler: () => void) => void;
}

export interface KakaoOverlay {
  setMap: (map: KakaoMap | null) => void;
  setZIndex: (z: number) => void;
  /** 겹침 해소로 마커를 밀어낼 때 위치를 갱신한다(`CustomOverlay` 전용). */
  setPosition?: (latlng: KakaoLatLng) => void;
}

/** 카카오 로컬 키워드 검색 결과(쓰는 필드만). `x`=경도, `y`=위도, 둘 다 문자열. */
export interface KakaoPlacesItem {
  x: string;
  y: string;
  place_name?: string;
}

/** `libraries=services` 로 함께 받는 로컬 검색 모듈(쓰는 API 만 좁게 선언). */
export interface KakaoServices {
  Places: new () => {
    keywordSearch: (
      keyword: string,
      callback: (data: KakaoPlacesItem[], status: string) => void,
    ) => void;
  };
  Status: { OK: string; ZERO_RESULT: string; ERROR: string };
}

export interface KakaoMaps {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  CustomOverlay: new (options: {
    position: KakaoLatLng;
    content: HTMLElement | string;
    xAnchor?: number;
    yAnchor?: number;
    clickable?: boolean;
    zIndex?: number;
  }) => KakaoOverlay;
  Polyline: new (options: {
    path: KakaoLatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
  }) => KakaoOverlay;
  load: (callback: () => void) => void;
  /** 이벤트 바인딩. 없으면 클러스터를 줌 변화에 맞춰 다시 계산하지 않는다(마커는 그대로 뜬다). */
  event?: KakaoEvent;
  /**
   * 로컬 검색(장소명→좌표). `libraries=services` 로 SDK 를 받아야 존재한다.
   * 앱에 '로컬' API 가 비활성이면 호출 시 status 가 ERROR 로 떨어진다(예외는 아님).
   */
  services?: KakaoServices;
}

declare global {
  interface Window {
    kakao?: { maps?: KakaoMaps };
  }
}

/** 경상북도 대략 중심(도청 인근). 표시할 좌표가 하나도 없을 때의 기본 중심. */
export const GYEONGBUK_CENTER = { lat: 36.576, lng: 128.5056 };

// `libraries=services` = 로컬 검색 모듈. 코스 장소는 응답에 좌표가 없어(GBC012) 이름으로
// 좌표를 찾아야 하고(F5 · utils/kakaoGeocode), 그 모듈이 이 파라미터로만 딸려 온다.
// 지도 자체는 이 파라미터와 무관하게 동작한다(로컬 미활성이어도 지도는 그대로 뜬다).
const SDK_SRC = (key: string) =>
  `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;

// 로드를 1회로 합친다(데스크톱·모바일 ResultsPanel 이 지도를 동시에 마운트한다).
let sdkPromise: Promise<KakaoMaps | null> | null = null;

/**
 * 카카오맵 SDK를 필요 시 주입하고 `kakao.maps` 네임스페이스를 돌려준다.
 * 키 없음·스크립트 로드 실패·`maps` 미노출(도메인 미등록) 등 어떤 실패든 `null`(예외 없음).
 */
export function loadKakaoMaps(): Promise<KakaoMaps | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao.maps);
  if (sdkPromise) return sdkPromise;

  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
  if (!key) return Promise.resolve(null);

  sdkPromise = new Promise((resolve) => {
    // autoload=false 라 스크립트 로드 후 `kakao.maps.load()`로 실제 모듈을 받아야 한다.
    const boot = () => {
      const maps = window.kakao?.maps;
      if (!maps?.load) {
        resolve(null);
        return;
      }
      try {
        maps.load(() => resolve(window.kakao?.maps ?? null));
      } catch {
        resolve(null);
      }
    };

    const src = SDK_SRC(key);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      if (window.kakao?.maps) boot();
      else existing.addEventListener('load', boot, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', boot, { once: true });
    script.addEventListener('error', () => resolve(null), { once: true });
    document.head.appendChild(script);
  });
  return sdkPromise;
}

/**
 * 카카오맵 웹/앱으로 여는 링크.
 * 좌표가 있으면 해당 지점 핀(`link/map`), 없으면 이름 검색(`link/search`)으로 폴백한다.
 */
export function kakaoMapPlaceUrl(place: {
  name: string;
  lat?: number;
  lng?: number;
}): string {
  const name = encodeURIComponent(place.name);
  if (place.lat != null && place.lng != null) {
    return `https://map.kakao.com/link/map/${name},${place.lat},${place.lng}`;
  }
  return `https://map.kakao.com/link/search/${name}`;
}
