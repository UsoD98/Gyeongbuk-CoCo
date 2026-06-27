import { useEffect } from 'react';
import { Bookmark, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 저장/공유 게이트. 게스트가 저장/공유를 누르면 열린다.
 * 라우트는 게스트 허용이고, 인증은 이 액션 시점에서만 요구한다.
 * "로그인하러 가기" → /auth/login (현재 위치를 state.from 으로 넘겨 복귀).
 */
export default function LoginGateModal({
  open,
  label,
  onClose,
}: {
  open: boolean;
  label: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const goLogin = () => {
    onClose();
    navigate('/auth/login', { state: { from: location } });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 motion-safe:animate-[coco-fade_0.2s_ease-out]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label ? `${label}하려면 로그인` : '로그인'}
          className="relative w-full max-w-[360px] rounded-3xl bg-base-100 p-6 shadow-2xl motion-safe:animate-[coco-pop_0.2s_ease-out]"
        >
          <button
            type="button"
            aria-label="닫기"
            className="btn btn-ghost btn-sm btn-square absolute right-3 top-3"
            onClick={onClose}
          >
            <X size={18} />
          </button>
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <Bookmark size={26} />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-extrabold">
                {label ? `${label}하려면 로그인` : '로그인'}
              </h3>
              <p className="text-sm text-base-content/60">
                카카오로 로그인하면 코스를 저장하고
                <br />
                친구와 비용 분담 내역까지 공유할 수 있어요.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={goLogin}
            >
              로그인하러 가기
            </button>
            <p className="text-xs text-base-content/50">
              탐색과 코스 짜기는 로그인 없이도 가능해요.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
