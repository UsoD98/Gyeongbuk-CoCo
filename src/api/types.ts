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

/**
 * "그 리소스는 더 이상 내 것이 아니다" — 404(삭제됨) 또는 403(소유자 아님).
 * 둘을 한 판정으로 묶는 이유는 **호출부가 할 일이 같기 때문**이다: 들고 있던 로컬 사본을
 * 버리고 화면을 비운다. 사용자에게도 "삭제됐거나 접근할 수 없는 코스"로 한 번에 안내한다.
 *
 * ⚠️ 401 은 포함하지 않는다 — 그건 "세션이 만료됐다"는 뜻이고, `client.ts` 인터셉터가
 *    재발급·로그인 리다이렉트로 따로 처리한다. 여기서 같이 묶으면 세션 만료 때
 *    멀쩡한 코스를 지우게 된다.
 */
export function isResourceGone(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 403;
}
