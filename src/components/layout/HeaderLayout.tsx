import { cn } from '@/utils/cn.ts';
import { NavLink, useNavigate } from 'react-router-dom';
import ThemeController from '@/components/common/ThemeController.tsx';
import { Bell, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { logout as logoutApi } from '@/api/auth.ts';
import { useAuthStore } from '@/stores/authStore.ts';
import { toast } from '@/stores/toastStore.ts';

export const Header = () => {
  const navigate = useNavigate();
  // 부팅 복원(idle/loading) 중에는 로그인/로그아웃 메뉴를 둘 다 숨겨 깜빡임을 막는다.
  const status = useAuthStore((state) => state.status);
  const clearAuth = useAuthStore((state) => state.clear);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // 서버 로그아웃이 실패해도 클라이언트 인증 상태는 비운다.
    } finally {
      clearAuth();
      closeDrawer();
      // 드롭다운을 닫기 위해 포커스 해제.
      (document.activeElement as HTMLElement | null)?.blur();
      toast.success('로그아웃되었습니다.');
      navigate('/');
    }
  };

  return (
    <div className={cn('navbar', 'bg-primary', 'px-3 md:px-6', 'py-2 md:py-0')}>
      {/* 모바일 버거 메뉴 */}
      <div className={cn('md:hidden', 'flex', 'items-center')}>
        <button
          onClick={toggleDrawer}
          className="text-primary-50 btn-ghost btn-sm"
          aria-label="메뉴 열기"
        >
          {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 로고 */}
      <div className={cn('navbar-start', 'flex-1 md:flex-none')}>
        <NavLink
          to="/"
          className={cn(
            'font-bold',
            'text-lg md:text-2xl',
            'text-primary-50',
            'whitespace-nowrap'
          )}
          onClick={closeDrawer}
        >
          경북 CoCo
        </NavLink>
      </div>

      {/* 데스크탑 네비게이션 */}
      <div className={cn('navbar-center', 'hidden md:flex')}>
        <div role="tablist" className={cn('tabs-border', 'tabs', 'gap-2 md:gap-4')}>
          <NavLink
            to="/planner/"
            className={({ isActive }) =>
              cn(
                'tab text-primary-200',
                'text-sm md:text-lg',
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
                'tab text-primary-200',
                'text-sm md:text-lg',
                isActive && 'tab-active text-primary-50',
                'hover:text-primary-100',
              )
            }
          >
            컬렉션
          </NavLink>
        </div>
      </div>

      {/* 우측 액션 버튼 */}
      <div className={cn('navbar-end', 'gap-1 md:gap-2', 'ml-auto')}>
        <div role="button" className="text-primary-50 btn-ghost btn-sm">
          <ThemeController />
        </div>
        <div
          role="button"
          className="cursor-pointer text-primary-50 btn-ghost btn-sm"
        >
          <Bell size={20} />
        </div>
        <div className="dropdown dropdown-end dropdown-bottom">
          <div
            tabIndex={0}
            role="button"
            className="cursor-pointer text-primary-50 btn-ghost btn-sm"
          >
            <User size={20} />
          </div>
          <ul
            tabIndex={-1}
            className="dropdown-content menu z-1 mt-4 w-28 rounded-box bg-base-100 p-2 shadow-lg"
          >
            {status === 'authenticated' ? (
              <li>
                <button type="button" onClick={handleLogout}>
                  로그아웃
                </button>
              </li>
            ) : status === 'guest' ? (
              <>
                <li>
                  <NavLink to="/auth/login" onClick={closeDrawer}>
                    로그인
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/auth/register" onClick={closeDrawer}>
                    회원가입
                  </NavLink>
                </li>
              </>
            ) : null}
          </ul>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isDrawerOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden bg-primary border-t border-primary-600">
          <div
            role="tablist"
            className={cn(
              'tabs-border',
              'tabs',
              'gap-2',
              'flex-col',
              'p-4',
              'w-full'
            )}
          >
            <NavLink
              to="/planner/"
              className={({ isActive }) =>
                cn(
                  'tab text-primary-200',
                  'text-base',
                  isActive && 'tab-active text-primary-50',
                  'hover:text-primary-100',
                  'justify-start',
                )
              }
              onClick={closeDrawer}
            >
              플래너
            </NavLink>
            <NavLink
              to="/collection/"
              className={({ isActive }) =>
                cn(
                  'tab text-primary-200',
                  'text-base',
                  isActive && 'tab-active text-primary-50',
                  'hover:text-primary-100',
                  'justify-start',
                )
              }
              onClick={closeDrawer}
            >
              컬렉션
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
};
