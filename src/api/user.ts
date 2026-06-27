import { apiClient } from '@/api/client.ts';
import type { ApiResponse } from '@/api/types.ts';

// ── 요청/응답 타입 (백엔드 DTO와 1:1) ──────────────────────
export interface UserJoinRequest {
  email: string;
  nickname: string;
  password: string;
}

export interface UserJoinResponse {
  id: number;
  email: string;
  nickname: string;
}

// ── API 함수 ───────────────────────────────────────────────

/** POST /user/join — 회원가입. 토큰은 발급되지 않는다(가입 후 별도 로그인). */
export async function join(
  request: UserJoinRequest,
): Promise<UserJoinResponse> {
  const { data } = await apiClient.post<ApiResponse<UserJoinResponse>>(
    '/user/join',
    request,
  );
  return data.data;
}
