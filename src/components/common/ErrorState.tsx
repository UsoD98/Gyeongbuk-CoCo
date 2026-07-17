import { cn } from '@/utils/cn.ts';

/**
 * 목록·상세 공용 에러 상태.
 * `description`에는 보통 `getApiErrorMessage(err)` 결과를 넘긴다.
 * `onRetry`를 주면 '다시 시도' 버튼이 노출된다(`useAsync().reload` 연결용).
 */
export default function ErrorState({
  title = '문제가 발생했어요',
  description,
  onRetry,
  retryLabel = '다시 시도',
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 text-2xl font-black text-error"
      >
        !
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-bold text-base-content">{title}</p>
        {description && (
          <p className="max-w-80 text-sm text-base-content/60">{description}</p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
