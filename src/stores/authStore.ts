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

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  status: AuthStatus;
  setAccessToken: (token: string | null) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  status: 'idle',

  setAccessToken: (token) => {
    if (token) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
    set({
      accessToken: token,
      isAuthenticated: Boolean(token),
      status: token ? 'authenticated' : 'guest',
    });
  },

  setStatus: (status) => set({ status }),

  clear: () => {
    localStorage.removeItem(SESSION_HINT_KEY);
    set({ accessToken: null, isAuthenticated: false, status: 'guest' });
  },
}));
