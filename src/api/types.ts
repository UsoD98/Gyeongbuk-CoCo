import axios from 'axios';

/** 백엔드 공통 응답 봉투 — { code, msg, data } */
export interface ApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}

/**
 * 백엔드 에러는 GlobalExceptionHandler가 모두 ApiResponse 봉투로 내려준다.
 * axios 에러에서 사용자에게 보여줄 메시지를 추출한다.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = '요청을 처리하지 못했습니다.',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.msg) return data.msg;
  }
  return fallback;
}
