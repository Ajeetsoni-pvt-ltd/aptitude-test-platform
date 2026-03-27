// frontend/src/routes/AppRouter.tsx
// ─────────────────────────────────────────────────────────────
// React Router v6 — All Routes Defined Here
// Structure:
//   Public Routes   → /login, /register
//   Protected Routes → /dashboard
//   Admin Routes    → /admin/*
//   Catch-all       → 404
// ─────────────────────────────────────────────────────────────

import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Pages
import LoginPage      from '@/pages/LoginPage';
import RegisterPage   from '@/pages/RegisterPage';
import DashboardPage  from '@/pages/DashboardPage';
import NotFoundPage   from '@/pages/NotFoundPage';
import TestSetupPage from '@/pages/TestSetupPage';
import TestPage      from '@/pages/TestPage';
import ResultPage    from '@/pages/ResultPage';

const AppRouter = () => {
  return (
    <Routes>

      {/* ─── Default: "/" → "/login" pe redirect ─────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ─── Public Routes ────────────────────────────────── */}
      {/* Already logged in? → /dashboard pe jaao             */}
      <Route element={<PublicRoute />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* ─── Protected Routes (Login required) ───────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/test-setup" element={<TestSetupPage />} />   {/* ✅ Naya */}
        <Route path="/test"       element={<TestPage />} />        {/* ✅ Naya */}
        <Route path="/result"     element={<ResultPage />} />      {/* ✅ Naya */}
        {/* Phase 7-8 mein aur routes add honge yahan */}
      </Route>

      {/* ─── Admin Only Routes ────────────────────────────── */}
      <Route element={<ProtectedRoute adminOnly={true} />}>
        {/* Phase 4/5 mein admin pages add honge */}
        {/* <Route path="/admin" element={<AdminPage />} /> */}
      </Route>

      {/* ─── 404 Catch-all ────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
};

export default AppRouter;
