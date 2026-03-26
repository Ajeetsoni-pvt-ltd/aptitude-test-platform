// frontend/src/routes/ProtectedRoute.tsx
// ─────────────────────────────────────────────────────────────
// Protected Route Guard — Private pages ke liye
// Logic:
//   Logged in → Page dikhao ✅
//   Not logged in → /login pe bhejo ❌
//   Admin required + not admin → /dashboard pe bhejo ❌
// ─────────────────────────────────────────────────────────────

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  adminOnly?: boolean; // Sirf admin ke liye? (default: false)
}

const ProtectedRoute = ({ adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  // ─── Case 1: Login nahi hai ────────────────────────────────
  // /login pe redirect karo
  // replace → history mein protected route save nahi hoga
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ─── Case 2: Admin route but user admin nahi hai ───────────
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // ─── Case 3: Sab theek hai → Page dikhao ──────────────────
  // <Outlet /> → Nested child route render karta hai [web:133]
  return <Outlet />;
};

export default ProtectedRoute;
