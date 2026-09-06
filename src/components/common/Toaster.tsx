import { useToastStore, type ToastType } from '@/stores/toastStore.ts';
import { cn } from '@/utils/cn.ts';

const alertClass: Record<ToastType, string> = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
};

/**
 * 동시에 보여 줄 최대 개수(R9).
 * 토스트는 3초 뒤 자동으로 사라지지만, 짧은 시간에 여러 개가 밀려오면 모바일 하단의
 * 액션 바(예: POI 드로어의 '닫기'·'코스에 담기')를 그만큼 오래 덮는다. 가장 최근 것만
 * 남겨 스택 높이를 묶는다. 넘친 토스트도 스토어의 타이머로 정상 제거된다.
 */
const VISIBLE_LIMIT = 3;

/** 전역 toast 렌더러. Layout에 한 번만 마운트해 라우트 전환에도 알림이 유지되게 한다. */
export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const remove = useToastStore((state) => state.remove);

  return (
    <div
      className={cn(
        /*
          R9 · 폭에 따라 자리를 바꾼다.
          모바일은 하단 중앙 — 종전의 우상단 고정은 헤더의 계정 메뉴·테마 토글을 덮었고,
          토스트가 탭으로 닫히는 <button> 이라 엄지에서 가장 먼 자리이기도 했다.
          sm(640px) 이상은 종전대로 우상단(본문을 가장 덜 가린다).
        */
        'toast toast-center toast-bottom',
        'sm:toast-end sm:toast-top',
        // z 사다리(index.css): 본문 0~10 · 헤더 30 · 드로어 40/50 · 토스트 50 · 모달 60/70
        'z-50',
        /*
          하단에 있는 동안만 홈 인디케이터를 피한다(R5 와 같은 규칙).
          컨테이너가 `bottom: 1rem` 으로 고정돼 있어 padding-bottom 만큼 내용이 위로 밀린다.
          상단으로 올라가는 sm: 이상에서는 되돌린다.
        */
        'pb-[env(safe-area-inset-bottom)] sm:pb-0',
      )}
    >
      {toasts.slice(-VISIBLE_LIMIT).map((t) => (
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
