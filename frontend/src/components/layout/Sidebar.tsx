// src/components/layout/Sidebar.tsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyNotificationsApi } from '@/api/notificationApi';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FlaskConical, BarChart3, Clock3,
  Trophy, Settings, LogOut, ChevronLeft, ChevronRight,
  User, Bell, Shield, Zap, Plus, Flame, CalendarPlus,
} from 'lucide-react';

interface NavItem {
  label:   string;
  path:    string;
  icon:    React.ReactNode;
  badge?:  string | number | React.ReactNode;
  color?:  string;
}

// ── Build streak badge lazily ─────────────────────────────────────
const getStreakCount = (userId: string) => parseInt(localStorage.getItem(`potd_streak_${userId}`) ?? '0');

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',      path: '/dashboard',      icon: <LayoutDashboard size={18} />  },
  { label: 'New Test',       path: '/test-setup',     icon: <FlaskConical size={18} />,   color: 'text-neon-cyan' },
  { label: 'Daily Challenge', path: '/problem-of-day', icon: <Flame size={18} />,          color: 'text-neon-amber' },
  { label: 'Analysis',       path: '/analysis',       icon: <BarChart3 size={18} />        },
  { label: 'History',        path: '/history',        icon: <Clock3 size={18} />           },
  { label: 'Leaderboard',    path: '/leaderboard',    icon: <Trophy size={18} />           },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: 'Profile',       path: '/profile',   icon: <User size={18} />     },
  { label: 'Notifications', path: '/notifications', icon: <Bell size={18} />, badge: 0 },
  { label: 'Settings',      path: '/settings',  icon: <Settings size={18} />  },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?:  () => void;
}

const Sidebar = ({ isMobile, onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout }          = useAuthStore();
  const navigate                  = useNavigate();
  const location                  = useLocation();
  const streak                    = getStreakCount(user?._id ?? user?.id ?? '');

  useEffect(() => {
    if (user) {
      getMyNotificationsApi().then(res => {
        if (res.success && res.data) {
          setUnreadCount(res.data.unreadCount);
        }
      }).catch(() => null);
    }
  }, [user, location.pathname]); // refetch on navigation changes

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const sidebarWidth = collapsed ? '72px' : '260px';

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen z-40 flex flex-col',
        'border-r border-white/5',
        'transition-all duration-400 ease-in-out',
        'bg-sidebar-gradient',
      )}
      style={{ width: isMobile ? '260px' : sidebarWidth }}
    >
      {/* ── Top: Logo ─────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.4)]">
              <Zap size={16} className="text-cyber-black" />
            </div>
            <div>
              <p className="font-orbitron text-sm font-bold text-white leading-none">NEXUS</p>
              <p className="text-[10px] text-neon-cyan/60 font-inter tracking-widest uppercase">Test Platform</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.4)]">
            <Zap size={16} className="text-cyber-black" />
          </div>
        )}

        {!isMobile && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center',
              'text-white/30 hover:text-white/70 hover:border-white/20 hover:bg-white/5',
              'transition-all duration-200 flex-shrink-0',
              collapsed && 'mx-auto mt-2'
            )}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {isMobile && (
          <button onClick={onClose} className="text-white/40 hover:text-white/70 p-1">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* ── New Test CTA ──────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 py-3 flex-shrink-0">
          <NavLink to="/test-setup" className={({ isActive }) => cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold font-inter',
            'bg-gradient-to-r from-neon-cyan/15 to-neon-violet/15',
            'border border-neon-cyan/25 text-neon-cyan',
            'hover:from-neon-cyan/25 hover:to-neon-violet/25 hover:border-neon-cyan/50',
            'transition-all duration-300',
            'shadow-[0_0_15px_rgba(0,245,255,0.1)]',
            isActive && 'from-neon-cyan/25 to-neon-violet/25 border-neon-cyan/50'
          )}>
            <Plus size={16} className="flex-shrink-0" />
            <span>New Test</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-neon-cyan text-cyber-black rounded font-orbitron animate-neon-pulse">
              GO
            </span>
          </NavLink>
        </div>
      )}

      {/* ── Nav Items ──────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-none">
        {NAV_ITEMS.filter(item => item.path !== '/test-setup').map((item) => {
          const isDaily = item.path === '/problem-of-day';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'nav-item',
                isActive && 'active',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={cn('flex-shrink-0 relative', item.color)}>
                {item.icon}
                {/* Flame pulse for daily challenge when streak active */}
                {isDaily && streak > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neon-amber animate-neon-pulse" />
                )}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
              {/* Streak badge in sidebar */}
              {!collapsed && isDaily && streak > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-neon-amber/20 border border-neon-amber/30 text-neon-amber font-orbitron">
                  {streak}🔥
                </span>
              )}
              {!collapsed && item.badge && !isDaily && (
                <span className="ml-auto text-[10px] bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Admin Section */}
        {user?.role === 'admin' && (
          <>
            <div className="my-3 divider-neon-violet opacity-30" />
            <NavLink
              to="/admin"
              className={({ isActive }) => cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0')}
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <Shield size={18} className="flex-shrink-0 text-neon-violet" />
              {!collapsed && <span>Admin Panel</span>}
            </NavLink>
            <NavLink
              to="/admin/create-test"
              className={({ isActive }) => cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0')}
              title={collapsed ? 'Create Test' : undefined}
            >
              <CalendarPlus size={18} className="flex-shrink-0 text-neon-magenta" />
              {!collapsed && <span>Create Test</span>}
            </NavLink>
          </>
        )}
      </nav>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="mx-4 divider-neon-cyan opacity-20 flex-shrink-0" />

      {/* ── Bottom Nav ────────────────────────────────────────── */}
      <div className="px-3 py-2 space-y-1 flex-shrink-0">
        {BOTTOM_ITEMS.map((item) => {
          const badgeValue = item.label === 'Notifications' ? unreadCount : item.badge;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => cn('nav-item', isActive && 'active', collapsed && 'justify-center px-0')}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0 relative">
                {item.icon}
                {badgeValue ? (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-neon-magenta rounded-full text-[8px] flex items-center justify-center text-white animate-neon-pulse">
                    {badgeValue}
                  </span>
                ) : null}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* ── User Footer ───────────────────────────────────────── */}
      <div className={cn(
        'border-t border-white/5 p-3 flex-shrink-0',
        collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-3'
      )}>
        {user && (
          <>
            <NeuralAvatar
              name={user.name}
              role={user.role}
              size="sm"
              showRing={!collapsed}
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-white/30 capitalize">{user.role}</p>
              </div>
            )}
          </>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'ml-auto flex items-center justify-center text-white/30 hover:text-neon-red transition-all duration-200',
            'w-7 h-7 rounded-lg hover:bg-neon-red/10',
            collapsed && 'ml-0 mt-1'
          )}
          title="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
