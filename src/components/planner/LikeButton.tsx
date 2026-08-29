import { Heart } from 'lucide-react';

import { usePoiLike } from '@/hooks/usePoiLike.ts';
import { cn } from '@/utils/cn.ts';

/**
 * POI 찜(좋아요) 하트 버튼 (GBC019).
 * 카드(`POICard`)·드로어(`PoiDrawer`)에서 재사용. 상태·토글·로그인 게이트는 `usePoiLike` 가 담당한다.
 * 카드 전체가 클릭 대상이므로 `stopPropagation` 으로 상세 열림/드래그와 분리한다.
 *
 * `showCount` 는 총 좋아요 수(`totalLiked`)를 하트 옆에 함께 보여 준다. 총개수는 **상세
 * (GBC018)·토글(GBC019) 응답에만** 있어(목록 응답엔 없다) 아직 모르는 POI 는 하트만 그린다 —
 * 목록 카드에 개수가 들쭉날쭉 나오지 않도록 켜는 곳(드로어)에서만 쓴다.
 */
export default function LikeButton({
  poiId,
  className,
  size = 16,
  showCount = false,
}: {
  poiId: string;
  className?: string;
  size?: number;
  showCount?: boolean;
}) {
  const { liked, totalLiked, pending, toggle } = usePoiLike(poiId);
  const count = showCount ? totalLiked : undefined;
  const label = liked ? '찜 취소' : '찜하기';

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={count === undefined ? label : `${label} (좋아요 ${count}개)`}
      title={label}
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className={cn(
        // 버튼 크기(btn-sm/btn-xs 등)는 호출부에서 className 으로 지정한다(사이즈 클래스 충돌 방지).
        'btn border-none bg-base-100/90 shadow',
        // 개수를 같이 보여줄 때만 가로로 늘린다(그 외엔 종전대로 원형 하트).
        count === undefined ? 'btn-circle' : 'gap-1.5 px-3',
        liked ? 'text-error' : 'text-base-content/60',
        className,
      )}
    >
      <Heart size={size} className={cn(liked && 'fill-current')} />
      {count !== undefined && (
        <span className="text-xs font-bold tabular-nums text-base-content">
          {count.toLocaleString('ko-KR')}
        </span>
      )}
    </button>
  );
}
