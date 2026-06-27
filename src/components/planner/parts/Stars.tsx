import { Star } from 'lucide-react';

/** 평점 + (선택) 리뷰 수 표시 */
export default function Stars({
  value,
  reviews,
}: {
  value: number;
  reviews?: number;
}) {
  return (
    <span className="flex items-center gap-1 text-sm text-base-content/60">
      <Star size={13} className="fill-amber-400 text-amber-400" />
      <b className="text-base-content">{value}</b>
      {reviews != null && (
        <span className="text-xs text-base-content/50">
          ({reviews.toLocaleString('ko-KR')})
        </span>
      )}
    </span>
  );
}
