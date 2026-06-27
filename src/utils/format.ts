/** 금액을 원화 표기로 포맷. 예: 13000 → "₩13,000" */
export const won = (n: number): string =>
  '₩' + Math.round(n).toLocaleString('ko-KR');
