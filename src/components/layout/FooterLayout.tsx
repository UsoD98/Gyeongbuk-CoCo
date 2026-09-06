import { NavLink } from 'react-router-dom';

import { cn } from '@/utils/cn.ts';

export const Footer = () => {
  return (
    <footer className={cn(
        'footer-center footer gap-3 bg-base-300 p-4 text-base-content sm:footer-horizontal',
        // 페이지 최하단 → viewport-fit=cover 에서 홈 인디케이터와 겹친다. p-4(1rem)를 하한으로 둔다(R5).
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
      )}>
      <aside>
        <p>Copyright © {new Date().getFullYear()} 경북 CoCo</p>
      </aside>
      <nav className="sm:ml-auto">
        <NavLink
          to="/about"
          className={({ isActive }) =>
            cn('link link-hover', isActive && 'text-primary')
          }
        >
          서비스 소개
        </NavLink>
      </nav>
    </footer>
  );
};
