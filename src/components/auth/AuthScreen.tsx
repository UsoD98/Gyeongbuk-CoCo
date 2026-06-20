import type { ReactNode } from 'react';

import { cn } from '@/utils/cn.ts';

type AuthScreenProps = {
  children: ReactNode;
};

export default function AuthScreen({ children }: AuthScreenProps) {
  return (
    <div className="flex min-h-dvh bg-base-100">
      <div className="relative hidden grow lg:block">
        <div className="absolute inset-0 bg-primary-500" />
        <div className="absolute inset-0">
          <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,.12),transparent_45%),linear-gradient(160deg,rgba(0,128,128,.55),rgba(8,20,26,.8))]" />
        </div>

        <div className="absolute right-12 bottom-12 left-12 flex flex-col gap-3 text-white">
          <span
            className="flex items-center justify-center font-black"
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: 'var(--color-secondary)',
              color: 'var(--color-secondary-content)',
              fontSize: 20,
            }}
          >
            Co
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white xl:text-4xl">
            경북 여행,
            <br />
            계획부터 정산까지 한 번에.
          </h2>
          <p className="max-w-105 text-white/90">
            인원수 맞춤 추천과 실시간 예산 계산으로 가성비 여행을 완성하세요.
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex grow flex-col items-center justify-center bg-base-100 px-6 py-16',
          'lg:grow-0 lg:py-6',
        )}
        style={{ flexBasis: 460 }}
      >
        <div className="flex w-full max-w-85 flex-col gap-5">
          {children}
        </div>
      </div>
    </div>
  );
}
