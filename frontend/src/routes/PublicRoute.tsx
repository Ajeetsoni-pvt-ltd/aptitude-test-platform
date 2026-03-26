// frontend/src/routes/PublicRoute.tsx
// ─────────────────────────────────────────────────────────────
// Public Route Guard — Login/Register pages ke liye
// Logic:
//   Already logged in → /dashboard pe bhejo (login page dobara kyun?)
//   Not logged in → Page dikhao ✅
// ─────────────────────────────────────────────────────────────

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();

  // Pehle se logged in hai → Dashboard pe bhejo
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Logged in nahi → Login/Register page dikhao
  return <Outlet />;
};

export default PublicRoute;
