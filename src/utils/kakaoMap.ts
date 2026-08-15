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
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  getLevel: () => number;
  setLevel: (level: number, options?: { animate?: boolean }) => void;
  setBounds: (bounds: KakaoLatLngBounds, ...padding: number[]) => void;
  relayout: () => void;
}

export interface KakaoOverlay {
  setMap: (map: KakaoMap | null) => void;
  setZIndex: (z: number) => void;
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
}

declare global {
  interface Window {
    kakao?: { maps?: KakaoMaps };
  }
}

/** 경상북도 대략 중심(도청 인근). 표시할 좌표가 하나도 없을 때의 기본 중심. */
export const GYEONGBUK_CENTER = { lat: 36.576, lng: 128.5056 };

const SDK_SRC = (key: string) =>
  `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;

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
