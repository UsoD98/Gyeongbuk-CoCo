import { create } from 'zustand';

import { readUserIdFromToken } from '@/utils/jwt.ts';

/**
 * 인증 상태.
 * accessToken은 보안상 메모리에만 보관한다(localStorage 미사용).
 * 새로고침으로 사라지면 앱 부팅 시 /auth/reissue(HttpOnly refreshToken 쿠키)로 1회 복원한다.
 *
 * status — 라우트 가드가 "판단 보류"와 "확정"을 구분하기 위한 부팅 상태.
 *   idle          : 아직 복원 시도 전(초기값)
 *   loading       : 복원(reissue) 진행 중
 *   authenticated : 로그인 확정
 *   guest         : 복원 실패/로그아웃 = 비로그인 확정
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

/**
 * "이전에 로그인한 적이 있다"는 힌트.
 * refreshToken은 HttpOnly라 FE가 읽을 수 없으므로, 부팅 시 reissue를 시도할지
 * 판단하기 위한 읽기 가능한 플래그를 별도로 둔다(토큰 자체는 여기 저장하지 않는다).
 * 이 플래그가 없으면 한 번도 로그인하지 않은 게스트로 보고 reissue를 건너뛴다.
 */
const SESSION_HINT_KEY = 'gb-coco.hasSession';

export function hasSessionHint(): boolean {
  return localStorage.getItem(SESSION_HINT_KEY) === '1';
}

/**
 * 로그인 사용자 id. `{userId}` path 파라미터를 쓰는 회원 API(GBC006~009)의 선결값이다.
 * 정본은 accessToken의 `userId` 클레임이지만(`readUserIdFromToken`), 새로고침 직후
 * 재발급이 끝나기 전 잠깐 토큰이 없는 구간이 있어 localStorage에도 함께 보관한다.
 * (accessToken은 보안상 메모리 전용이라는 원칙은 그대로 유지.) docs/FE_계약_추적표.md #userId
 */
const USER_ID_KEY = 'gb-coco.userId';

function readStoredUserId(): number | null {
  const raw = localStorage.getItem(USER_ID_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 세션 식별 키. 로그아웃(`guest`)·다른 계정 로그인에서 값이 바뀐다.
 * 401 재발급(`setAuth(token)` 으로 userId 유지)은 키가 그대로다.
 *
 * 사용자별 서버 값을 캐시하는 쪽(찜 상태·POI 상세)이 "세션이 바뀌었는가"를 판단하는 기준이라
 * 여기(인증 상태의 주인)에 둔다 — 각자 authStore 를 들여다보며 같은 규칙을 복제하지 않도록.
 */
export function authSessionKey(): string {
  const { isAuthenticated, userId } = useAuthStore.getState();
  return isAuthenticated ? `u${userId ?? '?'}` : 'guest';
}

interface AuthState {
  accessToken: string | null;
  userId: number | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  /**
   * 로그인/카카오/재발급 성공 시 호출한다(기존 setAccessToken의 확장).
   * userId를 생략하면(undefined) **토큰 클레임에서 스스로 꺼낸다** — 응답 바디에 userId가
   * 없어도 세 인증 경로(로그인·재발급·카카오)가 모두 채워지도록.
   * 클레임도 없으면 기존 값을 유지하고, token이 없으면(로그아웃) userId도 함께 비운다.
   */
  setAuth: (token: string | null, userId?: number | null) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: readStoredUserId(),
  isAuthenticated: false,
  status: 'idle',

  setAuth: (token, userId) => {
    if (token) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);

    set((state) => {
      // userId 우선순위: 인자(명시) > 토큰 클레임 > 기존 값. token이 없으면 무조건 null.
      // 인자를 남겨 둔 건 백엔드가 나중에 응답 바디로도 내려줄 때 그 값을 우선하기 위해서다.
      const nextUserId = !token
        ? null
        : userId !== undefined
          ? userId
          : (readUserIdFromToken(token) ?? state.userId);

      if (nextUserId != null) {
        localStorage.setItem(USER_ID_KEY, String(nextUserId));
      } else {
        localStorage.removeItem(USER_ID_KEY);
      }

      return {
        accessToken: token,
        userId: nextUserId,
        isAuthenticated: Boolean(token),
        status: token ? 'authenticated' : 'guest',
      };
    });
  },

  setStatus: (status) => set({ status }),

  clear: () => {
    localStorage.removeItem(SESSION_HINT_KEY);
    localStorage.removeItem(USER_ID_KEY);
    set({
      accessToken: null,
      userId: null,
      isAuthenticated: false,
      status: 'guest',
    });
  },
}));
