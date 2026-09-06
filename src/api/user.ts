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

/**
 * 회원 정보(GBC006 응답). 백엔드 `UserInfoResponseDto`와 1:1.
 * 프로필 확장 필드(address·birthDate·gender·travelType)는 아직 수정 API가 없어
 * 표시 전용이며, 미입력이면 null로 온다.
 */
export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  address: string | null;
  /** 'yyyy-MM-dd' (백엔드 LocalDate 직렬화). */
  birthDate: string | null;
  /** 백엔드 Byte — 코드값이라 라벨 매핑 없이 그대로는 노출하지 않는다. */
  gender: number | null;
  travelType: string | null;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** GET /user/{userId} — 회원 정보 조회(GBC006). 본인 정보 조회용. */
export async function getUser(userId: number): Promise<UserInfo> {
  const { data } = await apiClient.get<ApiResponse<UserInfo>>(
    `/user/${userId}`,
  );
  return data.data;
}

/** PATCH /user/{userId}/nickname — 닉네임 수정(GBC007). 2자 이상 100자 이하. */
export async function updateNickname(
  userId: number,
  nickname: string,
): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/user/${userId}/nickname`, {
    nickname,
  });
}

/**
 * PATCH /user/{userId}/password — 비밀번호 변경(GBC008).
 * 서버가 currentPassword를 검증한 뒤 교체한다(새 비번 8자 이상).
 */
export async function updatePassword(
  userId: number,
  request: UpdatePasswordRequest,
): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/user/${userId}/password`, request);
}

/** DELETE /user/{userId} — 회원 탈퇴(GBC009). 서버는 소프트 삭제(deletedAt)한다. */
export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/user/${userId}`);
}
