import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  BarChart3,
  Bell,
  BookImage,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Radar,
  Settings2,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getMyNotificationsApi } from '@/api/notificationApi';
import { cn } from '@/lib/utils';

type NavTone = 'cyan' | 'violet' | 'magenta' | 'green' | 'amber';

interface NavItem {
  path: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: NavTone;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/admin',
    label: 'Dashboard',
    shortLabel: 'Overview',
    description: 'Realtime platform telemetry',
    icon: LayoutDashboard,
    tone: 'cyan',
    exact: true,
  },
  {
    path: '/admin/questions',
    label: 'Question Bank',
    shortLabel: 'Questions',
    description: 'Search, edit, and review the bank',
    icon: BookImage,
    tone: 'violet',
  },
  {
    path: '/admin/upload',
    label: 'Question Builder',
    shortLabel: 'Builder',
    description: 'Manual and Excel upload workflows',
    icon: Sparkles,
    tone: 'magenta',
  },
  {
    path: '/admin/manage-tests',
    label: 'Manage Tests',
    shortLabel: 'Tests',
    description: 'Create and schedule live exams',
    icon: ClipboardCheck,
    tone: 'green',
  },
  {
    path: '/admin/users',
    label: 'Student Management',
    shortLabel: 'Students',
    description: 'Monitor learners and actions',
    icon: Users,
    tone: 'cyan',
  },
  {
    path: '/admin/monitoring',
    label: 'Live Proctoring',
    shortLabel: 'Monitoring',
    description: 'Watch camera feeds and alerts',
    icon: Radar,
    tone: 'amber',
  },
  {
    path: '/admin/analytics',
    label: 'Analytics',
    shortLabel: 'Analytics',
    description: 'Charts, insights, and solutions',
    icon: BarChart3,
    tone: 'violet',
  },
  {
    path: '/admin/settings',
    label: 'Settings',
    shortLabel: 'Settings',
    description: 'Control enforcement and system UX',
    icon: Settings2,
    tone: 'magenta',
  },
];

const NAV_TONE_CLASSES: Record<NavTone, string> = {
  cyan: 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10 shadow-[0_0_30px_rgba(0,245,255,0.16)]',
  violet:
    'text-neon-violet border-neon-violet/30 bg-neon-violet/10 shadow-[0_0_30px_rgba(157,0,255,0.16)]',
  magenta:
    'text-neon-magenta border-neon-magenta/30 bg-neon-magenta/10 shadow-[0_0_30px_rgba(255,0,170,0.16)]',
  green:
    'text-neon-green border-neon-green/30 bg-neon-green/10 shadow-[0_0_30px_rgba(0,255,136,0.16)]',
  amber:
    'text-neon-amber border-neon-amber/30 bg-neon-amber/10 shadow-[0_0_30px_rgba(255,183,0,0.16)]',
};

const PARTICLES = [
  { left: '10%', top: '18%', size: 4, duration: 8.2, delay: 0 },
  { left: '24%', top: '72%', size: 3, duration: 7.4, delay: 1.2 },
  { left: '34%', top: '10%', size: 5, duration: 9.6, delay: 0.6 },
  { left: '48%', top: '80%', size: 2, duration: 7.8, delay: 0.9 },
  { left: '59%', top: '28%', size: 3, duration: 8.8, delay: 1.4 },
  { left: '70%', top: '64%', size: 5, duration: 9.1, delay: 0.2 },
  { left: '84%', top: '16%', size: 3, duration: 7.2, delay: 1.8 },
  { left: '91%', top: '58%', size: 4, duration: 8.4, delay: 0.3 },
];

interface SidebarContentProps {
  collapsed: boolean;
  currentPath: string;
  onNavigate: () => void;
  navigate: ReturnType<typeof useNavigate>;
  handleLogout: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return 'AX';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const isNavItemActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.path : pathname.startsWith(item.path);

const SidebarContent = ({
  collapsed,
  currentPath,
  onNavigate,
  navigate,
  handleLogout,
}: SidebarContentProps) => {
  const { user } = useAuthStore();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-neon-cyan/30 bg-neon-cyan/12 text-neon-cyan shadow-[0_0_24px_rgba(0,245,255,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-orbitron text-sm tracking-[0.24em] text-white">AetherExam</p>
              <p className="truncate text-[11px] uppercase tracking-[0.28em] text-white/35">
                Admin Command Grid
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-2 pt-4">
        {!collapsed && (
          <p className="px-2 pb-3 text-[11px] uppercase tracking-[0.34em] text-white/25">
            Navigation
          </p>
        )}
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(currentPath, item);
            const Icon = item.icon;
            return (
              <motion.div key={item.path} whileHover={{ x: collapsed ? 0 : 4 }} transition={{ duration: 0.2 }}>
                <NavLink
                  to={item.path}
                  end={item.exact}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-300',
                    active
                      ? NAV_TONE_CLASSES[item.tone]
                      : 'border-transparent bg-white/[0.02] text-white/55 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  <div
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-2xl border transition-colors duration-300',
                      active
                        ? 'border-current/30 bg-current/10'
                        : 'border-white/8 bg-white/[0.03] text-white/45 group-hover:border-white/15 group-hover:text-white/70'
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-inter text-sm font-medium">{item.label}</p>
                      <p className="truncate text-xs text-white/35">{item.description}</p>
                    </div>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-3 border-t border-white/8 px-3 py-4">
        <button
          type="button"
          onClick={() => {
            onNavigate();
            navigate('/dashboard');
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left text-white/60 transition-all hover:border-white/14 hover:bg-white/[0.05] hover:text-white"
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium">Student View</p>
              <p className="text-xs text-white/35">Return to the learner dashboard</p>
            </div>
          )}
        </button>

        <div className="rounded-3xl border border-white/8 bg-white/[0.04] px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-neon-magenta/20 bg-neon-magenta/10 font-orbitron text-sm tracking-[0.18em] text-neon-magenta">
              {getInitials(user?.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'Administrator'}</p>
                <p className="truncate text-xs uppercase tracking-[0.24em] text-white/30">Aether Admin</p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-neon-red/20 bg-neon-red/10 text-neon-red transition-all hover:scale-105 hover:shadow-[0_0_24px_rgba(255,51,102,0.2)]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 grid h-10 w-full place-items-center rounded-2xl border border-neon-red/20 bg-neon-red/10 text-neon-red transition-all hover:shadow-[0_0_24px_rgba(255,51,102,0.2)]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('aetherexam-admin-collapsed') === '1';
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('aetherexam-admin-collapsed', collapsed ? '1' : '0');
    }
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    getMyNotificationsApi()
      .then((response) => {
        if (!mounted || !response?.success) return;
        const notifications = response.data?.notifications || [];
        setUnreadCount(
          notifications.filter((notification: { isRead?: boolean }) => !notification.isRead).length
        );
      })
      .catch(() => {
        if (mounted) setUnreadCount(0);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activeItem = useMemo(
    () => NAV_ITEMS.find((item) => isNavItemActive(location.pathname, item)) ?? NAV_ITEMS[0],
    [location.pathname]
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-surface min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.03)_1px,transparent_1px)] bg-[size:90px_90px] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_44%)] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.28))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/70 to-transparent opacity-35" />
        <div className="absolute left-0 right-0 top-0 h-16 animate-[admin-scanline_8s_linear_infinite] bg-gradient-to-b from-neon-cyan/0 via-neon-cyan/12 to-neon-cyan/0 opacity-20" />
        {PARTICLES.map((particle, index) => (
          <motion.span
            key={`${particle.left}-${particle.top}-${index}`}
            className="absolute rounded-full bg-neon-cyan/70 blur-[1px]"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={{ y: [0, -22, 0], opacity: [0.2, 0.95, 0.25] }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-[#02040d]/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="fixed inset-y-4 left-4 z-50 w-[18rem] lg:hidden"
            >
              <div className="admin-panel h-full border-neon-cyan/18 p-0">
                <div className="flex items-center justify-end border-b border-white/8 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/65 transition-all hover:border-white/18 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <SidebarContent
                  collapsed={false}
                  currentPath={location.pathname}
                  onNavigate={() => setMobileOpen(false)}
                  navigate={navigate}
                  handleLogout={handleLogout}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 96 : 280 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-y-4 left-4 z-40 hidden lg:block"
      >
        <div className="admin-panel h-full p-0">
          <SidebarContent
            collapsed={collapsed}
            currentPath={location.pathname}
            onNavigate={() => undefined}
            navigate={navigate}
            handleLogout={handleLogout}
          />
        </div>
      </motion.aside>

      <div
        className={cn(
          'relative z-10 min-h-screen transition-[padding] duration-300',
          collapsed ? 'lg:pl-[7rem]' : 'lg:pl-[18.5rem]'
        )}
      >
        <header className="sticky top-0 z-30 px-4 pt-4 sm:px-5 lg:px-8">
          <div className="admin-panel flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition-all hover:border-white/18 hover:text-white lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition-all hover:border-white/18 hover:text-white lg:grid"
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <div className="min-w-0">
                <p className="truncate text-[11px] uppercase tracking-[0.36em] text-white/32">
                  {activeItem.shortLabel}
                </p>
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="truncate font-orbitron text-base tracking-[0.16em] text-white sm:text-lg">
                    {activeItem.label}
                  </h1>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-neon-green shadow-[0_0_14px_rgba(0,255,136,0.6)] sm:block" />
                  <p className="hidden truncate text-sm text-white/38 xl:block">
                    {activeItem.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition-all hover:border-neon-cyan/24 hover:text-neon-cyan"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 inline-flex min-w-[18px] items-center justify-center rounded-full border border-neon-magenta/30 bg-neon-magenta/90 px-1.5 text-[10px] font-bold text-white">
                    {Math.min(unreadCount, 9)}
                  </span>
                )}
              </button>

              <div className="hidden items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-3 py-2 sm:flex">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-neon-cyan/24 bg-neon-cyan/10 font-orbitron text-sm tracking-[0.16em] text-neon-cyan">
                  {getInitials(user?.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{user?.name || 'Admin User'}</p>
                  <p className="truncate text-[11px] uppercase tracking-[0.26em] text-white/32">
                    AetherExam Admin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
