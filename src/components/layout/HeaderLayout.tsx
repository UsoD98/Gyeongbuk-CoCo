import { cn } from '@/utils/cn.ts';
import { NavLink } from 'react-router-dom';
import ThemeController from '@/components/common/ThemeController.tsx';
import { Bell, User } from 'lucide-react';

export const Header = () => {
  return (
    <div className={cn('navbar', 'bg-primary')}>
      <div className={cn('navbar-start', 'px-6')}>
        <NavLink
          to="/"
          className={cn('font-bold', 'text-2xl', 'text-primary-50')}
        >
          경북 CoCo
        </NavLink>
      </div>
      <div className={cn('navbar-center')}>
        <div role="tablist" className={cn('tabs-border', 'tabs', 'gap-4')}>
          <NavLink
            to="/planner/"
            className={({ isActive }) =>
              cn(
                'tab text-primary-200', 'text-lg',
                isActive && 'tab-active text-primary-50',
                'hover:text-primary-100',
              )
            }
          >
            플래너
          </NavLink>
          <NavLink
            to="/collection/"
            className={({ isActive }) =>
              cn(
                'tab text-primary-200', 'text-lg',
                isActive && 'tab-active text-primary-50',
                'hover:text-primary-100',
              )
            }
          >
            컬렉션
          </NavLink>
        </div>
      </div>
      <div className={cn('navbar-end', 'px-4', 'gap-2')}>
        <div role="button" className="text-primary-50 btn-ghost btn-sm">
          <ThemeController />
        </div>
        <div
          role="button"
          className="cursor-pointer text-primary-50 btn-ghost btn-sm"
        >
          <Bell />
        </div>
        <div className="dropdown dropdown-end dropdown-bottom">
          <div
            tabIndex={0}
            role="button"
            className="cursor-pointer text-primary-50 btn-ghost btn-sm"
          >
            <User />
          </div>
          <ul
            tabIndex={-1}
            className="dropdown-content menu z-1 mt-4 w-24 rounded-box bg-base-100 p-2 shadow-lg"
          >
            <li>
              <NavLink to="/auth/login">로그인</NavLink>
            </li>
            <li>
              <NavLink to="/auth/register">회원가입</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
