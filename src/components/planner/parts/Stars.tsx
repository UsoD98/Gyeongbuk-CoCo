import { Star } from 'lucide-react';

/**
 * 평점 + (선택) 리뷰 수 표시.
 *
 * 값의 출처는 GBC017/018 의 `stars`(`poi_rating.stars`)다. 평점 행이 없는 POI 가 실제로 많아
 * **0(= 평점 없음)이면 아무것도 그리지 않는다** — 실측 데이터가 없는 곳에 `★ 0` 이 붙으면
 * 최저 평점처럼 읽힌다. 리뷰 수도 같은 이유로 0이면 생략한다.
 */
export default function Stars({
  value,
  reviews,
}: {
  value: number;
  reviews?: number;
}) {
  if (!value) return null;

  return (
    <span className="flex items-center gap-1 text-sm text-base-content/60">
      <Star size={13} className="fill-amber-400 text-amber-400" />
      <b className="text-base-content">{value.toFixed(1)}</b>
      {!!reviews && (
        <span className="text-xs text-base-content/50">
          ({reviews.toLocaleString('ko-KR')})
        </span>
      )}
    </span>
  );
}
