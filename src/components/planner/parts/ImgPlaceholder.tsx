import { useState } from 'react';

import { cn } from '@/utils/cn.ts';

/**
 * POI 대표 이미지. `src`(GBC017 `thumbnail`)가 있으면 실제 이미지를,
 * 없거나 로드에 실패하면 텍스트 플레이스홀더를 보여준다.
 * 크기/모서리는 className 으로 지정한다.
 */
export default function ImgPlaceholder({
  label,
  src,
  alt,
  className,
}: {
  label: string;
  src?: string;
  /** 실제 이미지일 때의 대체 텍스트(보통 POI 이름). 없으면 `label`. */
  alt?: string;
  className?: string;
}) {
  // 실패한 URL 자체를 기억한다 — 같은 자리에 다른 POI 가 렌더되면(src 변경)
  // 자동으로 실패 상태가 풀린다(effect 로 초기화할 필요 없음).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = src != null && failedSrc === src;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt ?? label}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={cn('bg-base-200 object-cover', className)}
      />
    );
  }

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
