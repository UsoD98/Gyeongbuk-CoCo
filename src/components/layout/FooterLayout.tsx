import { NavLink } from 'react-router-dom';
import { MapPin } from 'lucide-react';

import { cn } from '@/utils/cn.ts';

/** 푸터 내비게이션 — Layout 안에서 도달 가능한 실제 라우트만(죽은 링크 방지). */
const NAV_LINKS = [
  { to: '/', label: '홈' },
  { to: '/planner/', label: '플래너' },
  { to: '/collection/', label: '컬렉션' },
  { to: '/about', label: '서비스 소개' },
] as const;

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-base-300 text-base-content">
      {/* 상단: 브랜드 소개 + 둘러보기. 콘텐츠 폭은 main(max-w-360)과 정렬. */}
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8 px-4 py-10 sm:flex-row sm:justify-between lg:px-10">
        <div className="flex max-w-sm flex-col gap-3">
          <span className="flex items-center gap-2 text-lg font-bold text-primary">
            <MapPin size={20} aria-hidden="true" />
            경북 CoCo
          </span>
          <p className="text-sm leading-relaxed text-base-content/60">
            경상북도 여행 일정과 예산을 AI로 계획하고, 나만의 코스를 컬렉션으로
            관리하세요.
          </p>
        </div>

        <nav className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold text-base-content/50">둘러보기</h2>
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'w-fit text-sm text-base-content/70 transition hover:text-primary',
                  isActive && 'font-medium text-primary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* 하단: 카피라이트 바 */}
      <div className="border-t border-base-content/10">
        <div className="mx-auto flex w-full max-w-360 flex-col items-center gap-1 px-4 py-4 text-xs text-base-content/50 sm:flex-row sm:justify-between lg:px-10">
          <p>© {year} 경북 CoCo. All rights reserved.</p>
          <p>경상북도 여행 플래너 · AI 코스 추천</p>
        </div>
      </div>
    </footer>
  );
};
