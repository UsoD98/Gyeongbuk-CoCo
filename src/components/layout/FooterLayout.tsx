import { NavLink } from 'react-router-dom';

import { cn } from '@/utils/cn.ts';

export const Footer = () => {
  return (
    <footer className="footer-center footer gap-3 bg-base-300 p-4 text-base-content sm:footer-horizontal">
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
