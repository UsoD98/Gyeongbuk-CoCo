import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { ApiResponse } from '@/api/types.ts';
import { useAuthStore } from '@/stores/authStore.ts';

const baseURL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`;

/**
 * 세션 만료로 하드 리다이렉트할 때 넘기는 1회용 메시지.
 * window.location.assign은 풀 리로드라 메모리의 toast 상태가 날아가므로,
 * sessionStorage에 담아 두고 로그인 페이지 마운트 시 소비한다.
 */
export const SESSION_FLASH_KEY = 'gb-coco.sessionFlash';

export interface SessionFlash {
  message: string;
  returnTo?: string;
}

/** 백엔드 공용 axios 인스턴스. refreshToken 쿠키 전송을 위해 withCredentials 필수. */
export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 요청마다 메모리의 accessToken을 Authorization 헤더로 첨부
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 동시 401 발생 시 재발급을 1회로 합치기 위한 공유 Promise
let refreshPromise: Promise<string> | null = null;

// 인터셉터 루프를 피하려고 재발급은 별도의 axios로 호출한다.
// 앱 부팅 시 세션 복원에도 재사용한다(App.tsx).
export async function reissueAccessToken(): Promise<string> {
  const { data } = await axios.post<
    ApiResponse<{ accessToken: string; userId?: number }>
  >(`${baseURL}/auth/reissue`, null, { withCredentials: true });
  const { accessToken, userId } = data.data;
  // reissue 응답에 userId가 없으면(undefined) authStore가 기존/저장된 값을 유지한다.
  useAuthStore.getState().setAuth(accessToken, userId);
  return accessToken;
}

// 401 → refreshToken 쿠키로 1회 재발급 후 원요청 재시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    // 재발급/로그인 요청 자체는 재시도하지 않는다(무한 루프 방지).
    const isAuthRetryPath =
      url.includes('/auth/reissue') || url.includes('/auth/login');

    if (status === 401 && original && !original._retried && !isAuthRetryPath) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise ?? reissueAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (reissueError) {
        refreshPromise = null;
        // 재발급 최종 실패 = 세션 만료. 전역에서 한 번만 로그아웃 처리 후 로그인 페이지로.
        useAuthStore.getState().clear();
        // 컴포넌트 밖이라 라우터 대신 하드 이동(메모리 상태도 함께 초기화).
        // 하드 이동은 toast 상태를 날리므로 안내·복귀경로를 sessionStorage에 넘긴다.
        const { pathname, search, hash } = window.location;
        if (pathname !== '/auth/login') {
          const flash: SessionFlash = {
            message: '세션이 만료되었습니다. 다시 로그인해 주세요.',
            // auth 경로로는 되돌리지 않는다(로그인→로그인 루프 방지).
            returnTo: pathname.startsWith('/auth')
              ? undefined
              : pathname + search + hash,
          };
          sessionStorage.setItem(SESSION_FLASH_KEY, JSON.stringify(flash));
          window.location.assign('/auth/login');
        }
        return Promise.reject(reissueError);
      }
    }

    return Promise.reject(error);
  },
);
