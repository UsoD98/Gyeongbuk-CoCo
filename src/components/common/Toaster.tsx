import { useToastStore, type ToastType } from '@/stores/toastStore.ts';
import { cn } from '@/utils/cn.ts';

const alertClass: Record<ToastType, string> = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
};

/** 전역 toast 렌더러. Layout에 한 번만 마운트해 라우트 전환에도 알림이 유지되게 한다. */
export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.remove);

  return (
    <div className="toast toast-top toast-end z-50">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          role="alert"
          className={cn('alert', alertClass[t.type], 'text-sm shadow-lg')}
          onClick={() => remove(t.id)}
        >
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
