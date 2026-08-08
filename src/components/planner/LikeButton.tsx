import { Heart } from 'lucide-react';

import { usePoiLike } from '@/hooks/usePoiLike.ts';
import { cn } from '@/utils/cn.ts';

/**
 * POI 찜(좋아요) 하트 버튼 (GBC019).
 * 카드(`POICard`)·드로어(`PoiDrawer`)에서 재사용. 상태·토글·로그인 게이트는 `usePoiLike` 가 담당한다.
 * 카드 전체가 클릭 대상이므로 `stopPropagation` 으로 상세 열림/드래그와 분리한다.
 */
export default function LikeButton({
  poiId,
  className,
  size = 16,
}: {
  poiId: string;
  className?: string;
  size?: number;
}) {
  const { liked, pending, toggle } = usePoiLike(poiId);

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? '찜 취소' : '찜하기'}
      title={liked ? '찜 취소' : '찜하기'}
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className={cn(
        // 버튼 크기(btn-sm/btn-xs 등)는 호출부에서 className 으로 지정한다(사이즈 클래스 충돌 방지).
        'btn btn-circle border-none bg-base-100/90 shadow',
        liked ? 'text-error' : 'text-base-content/60',
        className,
      )}
    >
      <Heart size={size} className={cn(liked && 'fill-current')} />
    </button>
  );
}
