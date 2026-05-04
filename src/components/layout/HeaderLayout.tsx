import { cn } from '@/utils/cn.ts';
import { NavLink } from 'react-router-dom';
import ThemeController from '@/components/common/ThemeController.tsx';
import { Bell, User } from 'lucide-react';

export const Header = () => {
  return (
    <div className={cn('navbar')}>
      <div className={cn('navbar-start', 'px-6')}>
        <NavLink to="/Home" className={cn('font-bold', 'text-2xl')}>
          경북 COCO
        </NavLink>
      </div>
      <div className={cn('navbar-center')}>
        <div role="tablist" className={cn('tabs-border', 'tabs', 'gap-6')}>
          <NavLink
            to="/"
            className={({ isActive }) => cn('tab', isActive && 'tab-active')}
          >
            Index
          </NavLink>
          <NavLink
            to="/Home"
            className={({ isActive }) => cn('tab', isActive && 'tab-active')}
          >
            Home
          </NavLink>
          <NavLink
            to="/About"
            className={({ isActive }) => cn('tab', isActive && 'tab-active')}
          >
            About
          </NavLink>
        </div>
      </div>
      <div className={cn('navbar-end', 'px-6', 'gap-2')}>
        <ThemeController />
        <Bell />
        <User />
      </div>
    </div>
  );
};
