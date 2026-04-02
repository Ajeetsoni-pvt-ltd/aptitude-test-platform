// frontend/src/routes/AppRouter.tsx
// All Routes — Public, Protected, Admin

import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute    from './PublicRoute';

// ── Public pages ──────────────────────────────────────────────────
import LoginPage    from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// ── Protected user pages ──────────────────────────────────────────
import DashboardPage     from '@/pages/DashboardPage';
import TestSetupPage     from '@/pages/TestSetupPage';
import TestPage          from '@/pages/TestPage';
import ResultPage        from '@/pages/ResultPage';
import AnalysisPage      from '@/pages/AnalysisPage';
import ProfilePage       from '@/pages/ProfilePage';
import HistoryPage       from '@/pages/HistoryPage';
import LeaderboardPage   from '@/pages/LeaderboardPage';
import SettingsPage      from '@/pages/SettingsPage';
import ProblemOfDayPage  from '@/pages/ProblemOfDayPage';
import SolutionReviewPage from '@/pages/SolutionReviewPage';
import NotificationsPage from '@/pages/NotificationsPage';

// ── Admin pages ───────────────────────────────────────────────────
import AdminDashboard      from '@/pages/admin/AdminDashboard';
import UploadQuestionsPage from '@/pages/admin/UploadQuestionsPage';
import QuestionsPage       from '@/pages/admin/QuestionsPage';
import UsersPage           from '@/pages/admin/UsersPage';
import CreateTestPage      from '@/pages/admin/CreateTestPage';
import CreateFullLengthTestPage from '@/pages/admin/CreateFullLengthTestPage';
import ManageTestsPage     from '@/pages/admin/ManageTestsPage';

// ── 404 ───────────────────────────────────────────────────────────
import NotFoundPage from '@/pages/NotFoundPage';

const AppRouter = () => {
  return (
    <Routes>

      {/* ── Default redirect ──────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Public Routes (redirect if already logged in) ──────── */}
      <Route element={<PublicRoute />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* ── Protected Routes (login required) ─────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"       element={<DashboardPage />} />
        <Route path="/test-setup"      element={<TestSetupPage />} />
        <Route path="/test"            element={<TestPage />} />
        <Route path="/result"          element={<ResultPage />} />
        <Route path="/analysis"        element={<AnalysisPage />} />
        <Route path="/profile"         element={<ProfilePage />} />
        <Route path="/solutions/:attemptId" element={<SolutionReviewPage />} />
        <Route path="/history"         element={<HistoryPage />} />
        <Route path="/leaderboard"     element={<LeaderboardPage />} />
        <Route path="/settings"        element={<SettingsPage />} />
        <Route path="/problem-of-day"  element={<ProblemOfDayPage />} />
        <Route path="/notifications"   element={<NotificationsPage />} />
      </Route>

      {/* ── Admin Only Routes ──────────────────────────────────── */}
      <Route element={<ProtectedRoute adminOnly={true} />}>
        <Route path="/admin"                     element={<AdminDashboard />} />
        <Route path="/admin/upload"              element={<UploadQuestionsPage />} />
        <Route path="/admin/questions"           element={<QuestionsPage />} />
        <Route path="/admin/users"               element={<UsersPage />} />
        <Route path="/admin/create-test"         element={<CreateTestPage />} />
        <Route path="/admin/manage-tests"        element={<ManageTestsPage />} />
        <Route path="/admin/create-full-length-test" element={<CreateFullLengthTestPage />} />
      </Route>

      {/* ── 404 ─────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
};

export default AppRouter;
