import { cn } from '@/utils/cn.ts';

/**
 * 실제 이미지 도입 전까지 쓰는 텍스트 플레이스홀더.
 * 크기/모서리는 className 으로 지정한다.
 */
export default function ImgPlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex select-none items-center justify-center bg-gradient-to-br from-primary-100 to-base-200 text-center',
        className,
      )}
    >
      <span className="line-clamp-2 px-2 text-xs font-medium text-primary-700/70">
        {label}
      </span>
    </div>
  );
}
