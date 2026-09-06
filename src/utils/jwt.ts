/**
 * JWT accessToken 페이로드 읽기.
 *
 * 백엔드가 accessToken 클레임에 `userId`(+ `role`)를 실어 준다(추적표 #4 안 ③).
 * `{userId}` 경로변수를 쓰는 회원 API(GBC006~009)는 이 값이 있어야 호출된다.
 *
 * ⚠️ 여기서 하는 건 **디코딩일 뿐 검증이 아니다**. 서명은 백엔드만 검증할 수 있으므로
 *    이 값은 "화면에 무엇을 그릴지" 판단에만 쓰고, 권한 판단의 근거로 삼지 않는다
 *    (실제 권한은 매 요청마다 서버가 토큰 서명으로 다시 확인한다).
 */

export interface JwtPayload {
  /** 로그인 사용자 id. 백엔드 미반영 구버전 토큰에는 없다(undefined). */
  userId?: number | string;
  role?: string;
  /** 백엔드 JWT의 subject = email. */
  sub?: string;
  exp?: number;
}

/** base64url(JWT 세그먼트) → UTF-8 문자열. 손상된 입력이면 null. */
function decodeBase64Url(segment: string): string | null {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    // base64url은 패딩('=')을 생략하므로 4의 배수로 되채운다.
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    // 한글 닉네임 등 비ASCII 클레임이 깨지지 않게 바이트 → UTF-8로 디코드한다.
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** JWT의 payload(2번째 세그먼트)를 파싱한다. 형식이 어긋나면 null. */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;

  const json = decodeBase64Url(segments[1]);
  if (!json) return null;

  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * accessToken에서 userId를 꺼낸다. 토큰이 없거나 클레임이 없으면 null.
 * 클레임이 문자열('1')로 와도 숫자로 정규화한다(Long 직렬화 방식이 바뀌어도 견디게).
 */
export function readUserIdFromToken(token: string | null): number | null {
  if (!token) return null;

  const claim = decodeJwtPayload(token)?.userId;
  if (claim == null) return null;

  const parsed = Number(claim);
  return Number.isFinite(parsed) ? parsed : null;
}
