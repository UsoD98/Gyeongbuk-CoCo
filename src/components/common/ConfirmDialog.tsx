import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import { cn } from '@/utils/cn.ts';

/**
 * 재사용 확인 다이얼로그. 되돌릴 수 없는 액션(예: 코스 삭제) 직전에 띄운다.
 *
 * a11y: `role="dialog"` + `aria-modal` + Escape 닫기 + 오버레이 클릭 닫기
 * (LoginGateModal 패턴과 동일). `busy` 중에는 Escape·오버레이·버튼을 모두 잠가
 * 진행 중 요청이 중복·취소되지 않게 한다.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 파괴적 액션이면 확인 버튼을 error 색으로 강조한다. */
  danger?: boolean;
  /** 확인 요청 진행 중 — 버튼 비활성화 + 스피너. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 motion-safe:animate-[coco-fade_0.2s_ease-out]"
        onClick={busy ? undefined : onCancel}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative w-full max-w-[360px] rounded-3xl bg-base-100 p-6 shadow-2xl motion-safe:animate-[coco-pop_0.2s_ease-out]"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <span
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl',
                danger
                  ? 'bg-error/10 text-error'
                  : 'bg-primary-50 text-primary',
              )}
            >
              <AlertTriangle size={26} />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-extrabold text-base-content">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-base-content/60">{description}</p>
              )}
            </div>
            <div className="flex w-full gap-2">
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={onCancel}
                disabled={busy}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={cn('btn flex-1', danger ? 'btn-error' : 'btn-primary')}
                onClick={onConfirm}
                disabled={busy}
              >
                {busy && <span className="loading loading-spinner loading-sm" />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
