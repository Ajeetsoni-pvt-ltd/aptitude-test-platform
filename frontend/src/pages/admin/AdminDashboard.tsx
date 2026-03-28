// frontend/src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { getAdminStatsApi } from '@/api/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DIFF_COLORS: Record<string, string> = {
  easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]     = useState<any>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStatsApi()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <span className="text-4xl animate-spin">⏳</span>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Admin Dashboard</h1>
          <p className="text-gray-500">Platform ka overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '👥', label: 'Total Users',     value: stats?.users?.total     || 0, color: 'bg-blue-50'   },
            { icon: '🎓', label: 'Students',         value: stats?.users?.students  || 0, color: 'bg-indigo-50' },
            { icon: '❓', label: 'Total Questions',  value: stats?.questions?.total || 0, color: 'bg-purple-50' },
            { icon: '📝', label: 'Total Tests',      value: stats?.tests?.total     || 0, color: 'bg-green-50'  },
          ].map((s) => (
            <Card key={s.label} className={`border-0 shadow-md ${s.color}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-3xl font-black text-gray-800 mt-1">{s.value}</p>
                </div>
                <span className="text-3xl">{s.icon}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Extra Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-amber-50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tests (Last 7 Days)</p>
                <p className="text-3xl font-black text-gray-800 mt-1">
                  {stats?.tests?.last7Days || 0}
                </p>
              </div>
              <span className="text-3xl">📅</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-green-50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Platform Avg Score</p>
                <p className="text-3xl font-black text-gray-800 mt-1">
                  {stats?.tests?.avgScore || 0}%
                </p>
              </div>
              <span className="text-3xl">📊</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-purple-50">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admin Users</p>
                <p className="text-3xl font-black text-gray-800 mt-1">
                  {stats?.users?.admins || 0}
                </p>
              </div>
              <span className="text-3xl">👑</span>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Topic-wise questions */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">❓ Questions by Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.questions?.byTopic || []}>
                  <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [v ?? 0, 'Questions']} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Difficulty-wise questions */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">💪 Questions by Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.questions?.byDifficulty || []}>
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [v ?? 0, 'Questions']} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {(stats?.questions?.byDifficulty || []).map(
                      (entry: any) => (
                        <Cell key={entry._id} fill={DIFF_COLORS[entry._id] || '#6366f1'} />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-600 to-purple-600">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="font-bold text-lg">Quick Actions 🚀</h3>
              <p className="text-indigo-200 text-sm">Platform manage karo</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/admin/upload')}
                className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 text-sm"
              >
                📤 Upload Questions
              </button>
              <button
                onClick={() => navigate('/admin/questions')}
                className="px-4 py-2 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 text-sm"
              >
                ❓ View Questions
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 text-sm"
              >
                👥 Manage Users
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;