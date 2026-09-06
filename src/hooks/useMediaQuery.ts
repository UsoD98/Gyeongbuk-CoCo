import { useCallback, useSyncExternalStore } from 'react';

/**
 * 미디어 쿼리 구독 훅.
 *
 * CSS(`hidden lg:flex`)로만 감추면 **감춰진 쪽 트리도 그대로 마운트되어 살아 있다** —
 * 플래너는 그 탓에 모바일에서도 데스크톱 `ResultsPanel`·`MapView` 가 동작해 KakaoMap
 * 인스턴스가 2개 생기고 `GET /poi` 가 중복으로 나갔다(R2). 어느 한쪽만 **마운트**해야
 * 하는 자리에서는 이 훅으로 폭을 읽어 렌더 자체를 가른다.
 *
 * `matchMedia` 구독을 `useSyncExternalStore` 로 감싸 tearing 없이 읽는다. SSR 이 없으므로
 * 초기값은 즉시 평가하며(서버 스냅샷도 같은 함수), `MediaQueryList` 는 쿼리별로 캐시해
 * `subscribe`/`getSnapshot` 참조가 매 렌더 흔들리지 않게 한다.
 */

/**
 * Tailwind `lg` 브레이크포인트(1024px). **`src/index.css` 의 daisyUI/Tailwind 기본값과
 * 반드시 일치해야 한다** — 클래스(`lg:`)와 이 값이 어긋나면 JS 가 고른 트리와 CSS 가
 * 기대하는 레이아웃이 서로 다른 폭에서 갈린다. 데스크톱 판정은 여기 한 곳에서만 정의한다.
 */
export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

const cache = new Map<string, MediaQueryList>();

function listOf(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  let list = cache.get(query);
  if (!list) {
    list = window.matchMedia(query);
    cache.set(query, list);
  }
  return list;
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = listOf(query);
      if (!list) return () => {};
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => listOf(query)?.matches ?? false, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 데스크톱(≥1024px) 여부. `lg:` 클래스와 같은 경계를 쓴다. */
export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_MEDIA_QUERY);
}
