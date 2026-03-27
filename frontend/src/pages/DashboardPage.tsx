// frontend/src/pages/DashboardPage.tsx
// ─────────────────────────────────────────────────────────────
// Dashboard — Logged-in user ka home page
// Stats cards + Recent attempts + Quick actions
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyResultsApi } from '@/api/testApi';
import type { TestAttempt } from '@/types';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';

// ─── Stat Card Component (Reusable) ───────────────────────────
interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}
const StatCard = ({ icon, label, value, subtext, color }: StatCardProps) => (
  <Card className={`border-0 shadow-md ${color}`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </CardContent>
  </Card>
);

// ─── Difficulty Badge ──────────────────────────────────────────
const DifficultyBadge = ({ score }: { score: number }) => {
  if (score >= 80) return <Badge className="bg-green-100 text-green-700 border-green-200">Excellent 🌟</Badge>;
  if (score >= 60) return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Good 👍</Badge>;
  if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Average 📈</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200">Needs Work 💪</Badge>;
};

// ─── Main Dashboard Component ─────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // ─── State ────────────────────────────────────────────────
  const [attempts, setAttempts]     = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [totalTests, setTotalTests] = useState(0);

  // ─── Fetch Recent Results ──────────────────────────────────
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await getMyResultsApi(1, 5);
        if (response.success && response.data) {
          setAttempts(response.data.attempts);
          setTotalTests(response.data.pagination.totalAttempts);
        }
      } catch (error) {
        console.error('Results fetch karne mein error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, []);

  // ─── Stats Calculate karo ─────────────────────────────────
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => a.score))
    : 0;
  const totalTimeMin = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.totalTime || 0), 0) / 60)
    : 0;

  // ─── Logout Handler ───────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // ─── UI ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ════════════════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════════════════ */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-gray-800 text-lg">Aptitude Test Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700">{user?.name}</p>
              <Badge
                variant="outline"
                className={user?.role === 'admin'
                  ? 'text-purple-600 border-purple-300 text-xs'
                  : 'text-indigo-600 border-indigo-300 text-xs'
                }
              >
                {user?.role === 'admin' ? '👑 Admin' : '🎓 Student'}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-500 border-red-200 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ─── Welcome Section ──────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Namaste, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Aaj kaunsa topic practice karein? Chalo shuru karte hain! 🚀
          </p>
        </div>

        {/* ─── Stats Cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="📝"
            label="Total Tests"
            value={totalTests}
            subtext="Attempts so far"
            color="bg-indigo-50"
          />
          <StatCard
            icon="📊"
            label="Average Score"
            value={`${avgScore}%`}
            subtext="Across all tests"
            color="bg-blue-50"
          />
          <StatCard
            icon="🏆"
            label="Best Score"
            value={`${bestScore}%`}
            subtext="Personal best"
            color="bg-green-50"
          />
          <StatCard
            icon="⏱️"
            label="Time Spent"
            value={`${totalTimeMin}m`}
            subtext="Total practice time"
            color="bg-purple-50"
          />
        </div>

        {/* ─── Quick Actions ────────────────────────────── */}
        <Card className="border-0 shadow-md mb-8 bg-gradient-to-r from-indigo-500 to-purple-600">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-white">
                <h2 className="text-xl font-bold">Naya Test Shuru Karo! 🎯</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  Quantitative, Verbal ya Logical Reasoning — choose karo
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold"
                  onClick={() => navigate('/test-setup')}
                >
                  🚀 Test Start Karo
                </Button>
                {user?.role === 'admin' && (
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                    onClick={() => alert('Phase 4 Admin Panel coming soon!')}
                  >
                    📤 Upload Questions
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Recent Attempts ──────────────────────────── */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-800">
                  📋 Recent Test Attempts
                </CardTitle>
                <CardDescription>
                  Tumhare last {attempts.length} tests ka result
                </CardDescription>
              </div>
              {totalTests > 5 && (
                <Link to="/results">
                  <Button variant="outline" size="sm">
                    Sab dekho →
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-4xl animate-spin mb-3">⏳</div>
                  <p className="text-gray-500">Results load ho rahe hain...</p>
                </div>
              </div>
            )}

            {/* No attempts yet */}
            {!isLoading && attempts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Abhi koi test attempt nahi kiya!
                </h3>
                <p className="text-gray-400 mt-1 text-sm">
                  Upar "Test Start Karo" button se pehla test do 👆
                </p>
              </div>
            )}

            {/* Attempts List */}
            {!isLoading && attempts.length > 0 && (
              <div className="space-y-3">
                {attempts.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
                  >
                    {/* Left: Title + Date */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {attempt.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        📅 {new Date(attempt.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Middle: Stats */}
                    <div className="hidden sm:flex items-center gap-4 mx-4 text-sm text-gray-600">
                      <span>✅ {attempt.correctCount} correct</span>
                      <span>❌ {attempt.incorrectCount} wrong</span>
                      <span>⏭️ {attempt.skippedCount} skip</span>
                    </div>

                    {/* Right: Score + Badge */}
                    <div className="flex items-center gap-3 ml-2">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">
                          {attempt.score}%
                        </p>
                      </div>
                      <DifficultyBadge score={attempt.score} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Footer ───────────────────────────────────── */}
        <p className="text-center text-gray-400 text-xs mt-8">
          🎯 Aptitude Test Platform • Practice makes perfect!
        </p>
      </main>
    </div>
  );
};

export default DashboardPage;
