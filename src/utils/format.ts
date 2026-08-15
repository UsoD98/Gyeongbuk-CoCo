/** 금액을 원화 표기로 포맷. 예: 13000 → "₩13,000" */
export const won = (n: number): string =>
  '₩' + Math.round(n).toLocaleString('ko-KR');

/**
 * 외부 이미지 URL을 https 로 승격한다.
 * TourAPI(`tong.visitkorea.or.kr`) 썸네일이 `http://`로 내려와 https 배포 시
 * mixed-content 로 차단되기 때문. 로드에 실패하면 `ImgPlaceholder` 가 폴백한다.
 * 값이 없거나 빈 문자열이면 undefined(이미지 없음).
 */
export function httpsUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith('http://') ? `https://${url.slice(7)}` : url;
}
