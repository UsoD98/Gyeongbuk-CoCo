import { apiClient } from '@/api/client.ts';
import type { ApiResponse } from '@/api/types.ts';

// ── 요청/응답 타입 (백엔드 DTO와 1:1) ──────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface KakaoCallbackRequest {
  kakaoAccessToken: string;
}

// ── API 함수 ───────────────────────────────────────────────

/** POST /auth/login — accessToken은 body, refreshToken은 HttpOnly 쿠키로 내려온다. */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    request,
  );
  return data.data;
}

/** POST /auth/logout — 서버가 refreshToken 쿠키를 만료시킨다. */
export async function logout(): Promise<void> {
  await apiClient.post<ApiResponse<void>>('/auth/logout');
}

/** POST /auth/oauth/kakao/callback — FE가 발급한 카카오 토큰을 자체 JWT로 교환. */
export async function kakaoCallback(
  request: KakaoCallbackRequest,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/oauth/kakao/callback',
    request,
  );
  return data.data;
}
