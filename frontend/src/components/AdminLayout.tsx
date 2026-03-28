// frontend/src/components/AdminLayout.tsx
// ─────────────────────────────────────────────────────────────
// Common Layout for all Admin pages — Sidebar + Top Navbar
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Badge  } from '@/components/ui/badge';

// ─── Sidebar Nav Items ─────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/admin',           icon: '📊', label: 'Dashboard'         },
  { path: '/admin/questions', icon: '❓', label: 'Questions'          },
  { path: '/admin/upload',    icon: '📤', label: 'Upload Questions'   },
  { path: '/admin/users',     icon: '👥', label: 'Users'              },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate         = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ═══ SIDEBAR ════════════════════════════════════════ */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 bg-gray-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-bold text-white leading-tight">Aptitude Platform</p>
              <Badge className="bg-purple-600 text-white text-xs mt-0.5">
                👑 Admin Panel
              </Badge>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Back to Student View */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={() => navigate('/dashboard')}
          >
            🎓 Student View
          </Button>
          <Button
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ MAIN CONTENT ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navbar */}
        <header className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              ☰
            </button>
            <h1 className="font-bold text-gray-800 text-lg">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            <Badge className="bg-purple-100 text-purple-700 border-purple-300">
              👑 Admin
            </Badge>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;