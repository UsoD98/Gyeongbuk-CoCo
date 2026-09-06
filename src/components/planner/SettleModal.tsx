import { useEffect, useState } from 'react';
import { Check, Copy, HandCoins, Users, X } from 'lucide-react';

import { useBodyScrollLock } from '@/hooks/useBodyScrollLock.ts';
import { toast } from '@/stores/toastStore.ts';
import { won } from '@/utils/format.ts';
import { KAKAO_PAY_URI, perPersonAmount } from '@/utils/kakaoPay.ts';
import { copyToClipboard } from '@/utils/kakaoShare.ts';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 총 예상 예산 */
  total: number;
  /** 1인당 분담액(computeBudget 결과) */
  perPerson: number;
  /** 인원 */
  n: number;
}

/**
 * 1/N 정산 모달.
 *
 * 카카오페이 정산하기 링크는 금액을 넘겨받지 못한다(`utils/kakaoPay.ts` 참고).
 * 그래서 이 모달이 그 공백을 메운다 — 1인당 금액을 크게 보여주고 클립보드에 쥐여준 뒤
 * 카카오페이로 보낸다. 사용자는 카카오페이 입력창에 붙여넣기만 하면 된다.
 *
 * 링크가 없으면(`VITE_KAKAO_PAY_URI` 미설정) 호출부가 아예 열지 않지만,
 * 방어적으로 금액 복사까지는 동작하게 두고 카카오페이 버튼만 감춘다.
 */
export default function SettleModal({ open, ...rest }: Props) {
  // 닫힌 동안 언마운트한다 → 다시 열 때 '복사됨' 표시가 자연스럽게 초기화된다
  // (effect 로 setState 해서 되돌리는 것보다 싸고, 렌더 연쇄도 없다).
  if (!open) return null;
  return <SettleDialog {...rest} />;
}

function SettleDialog({ onClose, total, perPerson, n }: Omit<Props, 'open'>) {
  const [copied, setCopied] = useState(false);

  // 이 컴포넌트는 열렸을 때만 마운트된다 → 사는 동안 계속 잠근다(R5).
  useBodyScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const amount = perPersonAmount(perPerson);

  // 카카오페이 입력창에 그대로 붙여넣도록 숫자만 복사한다(₩·쉼표 제외).
  const copyAmount = async () => {
    const ok = await copyToClipboard(String(amount));
    if (ok) {
      setCopied(true);
      toast.success('1인당 금액을 복사했어요');
    } else {
      toast.error('금액을 복사하지 못했어요');
    }
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
          aria-label="1/N 정산"
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
              <HandCoins size={26} />
            </span>

            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-extrabold">1/N 정산</h3>
              <p className="flex items-center justify-center gap-1 text-sm text-base-content/60">
                <Users size={14} />
                {n}명이 {won(total)}을 나눠요
              </p>
            </div>

            {/* 1인당 금액 — 이 모달의 본론. 복사 후 카카오페이에 붙여넣는 값이다. */}
            <div className="flex w-full flex-col gap-1 rounded-2xl bg-base-200 p-4">
              <span className="text-xs font-semibold text-base-content/60">
                1인당 보낼 금액
              </span>
              <span className="text-3xl font-extrabold tracking-tight text-primary">
                {won(amount)}
              </span>
            </div>

            <div className="flex w-full flex-col gap-2">
              <button
                type="button"
                className="btn btn-outline btn-block gap-1"
                onClick={() => void copyAmount()}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '복사됨' : '금액 복사'}
              </button>

              {/*
                카카오페이 정산하기 링크로 이동. 새 탭으로 여는 이유는 두 가지다 —
                작성 중인 코스 상태를 잃지 않고, 모바일에서 카카오톡 앱 전환이 실패해도
                플래너로 되돌아올 수 있다.

                TODO(브랜드): 카카오페이 가이드는 개발자센터가 배포하는 공식
                [카카오페이 1/N 정산] 버튼 이미지만 쓰도록 요구한다
                (docs: moneytransfer/splitbills.link/splitbills-link-hands-on).
                이미지를 내려받아 public/ 에 두고 이 버튼의 라벨을 <img> 로 교체할 것.
              */}
              {KAKAO_PAY_URI && (
                <a
                  href={KAKAO_PAY_URI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-block gap-1"
                  onClick={onClose}
                >
                  카카오페이로 정산하기
                </a>
              )}
            </div>

            <p className="text-xs leading-relaxed text-base-content/50">
              카카오페이 화면에서 금액을 직접 입력해야 해요.
              <br />
              복사한 금액을 붙여넣으면 됩니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
