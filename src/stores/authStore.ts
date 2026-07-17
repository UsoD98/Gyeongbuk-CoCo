import { create } from 'zustand';

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
 * accessToken과 달리 민감정보가 아니고, 새로고침 후 reissue 응답이 userId를 실어주지 않을
 * 가능성(0-A 계약 미확정)에 대비해 localStorage에도 함께 보관해 세션 복원 시 즉시 사용한다.
 * (accessToken은 보안상 메모리 전용이라는 원칙은 그대로 유지.) docs/FE_계약_추적표.md #userId
 */
const USER_ID_KEY = 'gb-coco.userId';

function readStoredUserId(): number | null {
  const raw = localStorage.getItem(USER_ID_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

interface AuthState {
  accessToken: string | null;
  userId: number | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  /**
   * 로그인/카카오/재발급 성공 시 호출한다(기존 setAccessToken의 확장).
   * userId를 생략하면(undefined) 기존 값을 유지한다 — reissue 응답에 userId가 없을 때 보존용.
   * token이 없으면(로그아웃) userId도 함께 비운다.
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
      // userId: undefined = 기존 유지 / number|null = 갱신. token이 없으면 무조건 null.
      const nextUserId = !token
        ? null
        : userId === undefined
          ? state.userId
          : userId;

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
