import { useCallback, useEffect, useState } from 'react';

/**
 * 비동기 로딩 3-상태(loading / error / data) + 재조회를 캡슐화한 훅.
 *
 * 도메인 훅(`useCourseList`, `useCourse` 등)이 이 훅을 감싸 API 세부를 숨긴다.
 * 컴포넌트는 `{ data, loading, error, reload }`만 소비하면 되고,
 * 로딩·빈·에러 렌더는 공용 `Skeleton`/`EmptyState`/`ErrorState`로 처리한다.
 *
 * 동작:
 * - 최초 마운트: `loading=true`로 시작 → fetch 완료 시 data/error 확정.
 * - `reload()`(예: `ErrorState onRetry`): 즉시 `loading=true`로 되돌린 뒤 재요청.
 * - `fetcher` 참조 변경(파라미터 변경)에 의한 재요청: 이전 data/error를 유지한 채 갱신
 *   (stale-while-revalidate) — 재요청이 실패해도 직전 data는 보존한다. 즉시 로딩 표시나
 *   에러 초기화가 필요하면(예: 에러 후 재시도) 호출부에서 `reload()`를 쓴다.
 *
 * ⚠️ `fetcher`는 안정적인 참조여야 한다(호출부에서 `useCallback`으로 감쌀 것).
 *    매 렌더 새 함수를 넘기면 무한 재호출된다.
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  /** 수동 재조회. 에러 상태의 `ErrorState onRetry`에 연결한다. */
  reload: () => void;
}

interface InternalState<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
}

export function useAsync<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<InternalState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  // reload용 nonce — 증가시키면 아래 effect가 재실행된다.
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    // 이벤트 핸들러에서 호출된다(effect 밖) → 로딩 표시로 되돌린 뒤 재요청 트리거.
    setState((s) => ({ ...s, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    // 언마운트/재요청 시 이전 응답이 상태를 덮어쓰지 않도록 가드.
    // setState는 동기 호출을 피해 비동기 콜백(.then/.catch)에서만 수행한다.
    let active = true;
    fetcher()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        // 재요청(revalidation) 실패 시 이전 data는 보존한다(stale-while-revalidate). loading만 종료.
        if (active) setState((s) => ({ ...s, loading: false, error }));
      });
    return () => {
      active = false;
    };
  }, [fetcher, nonce]);

  return { ...state, reload };
}
