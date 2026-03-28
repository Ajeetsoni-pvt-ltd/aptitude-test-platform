// frontend/src/pages/AnalysisPage.tsx
// ─────────────────────────────────────────────────────────────
// Performance Analysis Dashboard
// Charts: LineChart (trends), BarChart (topics), PieChart (breakdown)
// Recharts already installed from Phase 1 [web:202]
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getAnalysisDataApi } from '@/api/analysisApi';
import type { TestAttempt } from '@/types';

// ─── Recharts Imports ──────────────────────────────────────────
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';

// ─── Chart Colors ──────────────────────────────────────────────
const COLORS = {
  correct:   '#22c55e',  // Green
  wrong:     '#ef4444',  // Red
  skipped:   '#94a3b8',  // Gray
  primary:   '#6366f1',  // Indigo
  secondary: '#8b5cf6',  // Purple
  warning:   '#f59e0b',  // Amber
};

const PIE_COLORS = [COLORS.correct, COLORS.wrong, COLORS.skipped];

// ─── Custom Tooltip for LineChart ─────────────────────────────
// [web:228]
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}
const ScoreTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-indigo-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        <p className="text-indigo-600 font-semibold">
          Score: {payload[0]?.value}%
        </p>
      </div>
    );
  }
  return null;
};

// ─── Custom Tooltip for BarChart ──────────────────────────────
const TopicTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-purple-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        <p className="text-purple-600 font-semibold">
          Accuracy: {payload[0]?.value}%
        </p>
      </div>
    );
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
const AnalysisPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [attempts, setAttempts]   = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Data Fetch ────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAnalysisDataApi();
        if (response.success && response.data) {
          // Latest pehle → charts ke liye reverse karo (oldest first)
          const sorted = [...response.data.attempts].reverse();
          setAttempts(sorted);
        }
      } catch (err) {
        console.error('Analysis data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Chart Data Prepare karo
  // ═══════════════════════════════════════════════════════════

  // ─── 1. Score Trend Data (LineChart ke liye) ───────────────
  const scoreTrendData = attempts.map((attempt, idx) => ({
    name: `Test ${idx + 1}`,
    score: attempt.score,
    date: new Date(attempt.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short',
    }),
  }));

  // ─── 2. Topic Performance Data (BarChart ke liye) ──────────
  // Sab attempts ke topic performance merge karo
  const topicMap: Record<string, { correct: number; total: number }> = {};
  attempts.forEach((attempt) => {
    if (attempt.topicPerformance) {
      Object.entries(attempt.topicPerformance).forEach(([topic, perf]) => {
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        topicMap[topic].correct += perf.correct;
        topicMap[topic].total   += perf.total;
      });
    }
  });

  const topicBarData = Object.entries(topicMap).map(([topic, perf]) => ({
    topic: topic.length > 15 ? topic.substring(0, 15) + '...' : topic, // Label truncate
    fullTopic: topic,
    accuracy: perf.total > 0 ? Math.round((perf.correct / perf.total) * 100) : 0,
    correct:  perf.correct,
    total:    perf.total,
  }));

  // ─── 3. Pie Chart Data (Overall Breakdown) ─────────────────
  const totalCorrect   = attempts.reduce((s, a) => s + (a.correctCount   || 0), 0);
  const totalWrong     = attempts.reduce((s, a) => s + (a.incorrectCount || 0), 0);
  const totalSkipped   = attempts.reduce((s, a) => s + (a.skippedCount   || 0), 0);
  const totalQuestions = totalCorrect + totalWrong + totalSkipped;

  const pieData = [
    { name: 'Correct ✅',  value: totalCorrect,  percent: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0 },
    { name: 'Wrong ❌',    value: totalWrong,    percent: totalQuestions > 0 ? Math.round((totalWrong / totalQuestions) * 100) : 0 },
    { name: 'Skipped ⏭️', value: totalSkipped,  percent: totalQuestions > 0 ? Math.round((totalSkipped / totalQuestions) * 100) : 0 },
  ];

  // ─── 4. Radar Chart Data (Topic-wise) ─────────────────────
  const radarData = topicBarData.map((t) => ({
    subject: t.topic,
    accuracy: t.accuracy,
    fullMark: 100,
  }));

  // ─── 5. Summary Stats ─────────────────────────────────────
  const avgScore   = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0;
  const bestScore  = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;
  const worstScore = attempts.length > 0 ? Math.min(...attempts.map((a) => a.score)) : 0;

  // Improving trend? Last 3 vs pehle 3 compare karo
  const isImproving = (() => {
    if (attempts.length < 4) return null;
    const recent = attempts.slice(-3).reduce((s, a) => s + a.score, 0) / 3;
    const older  = attempts.slice(0, 3).reduce((s, a) => s + a.score, 0)  / 3;
    return recent > older;
  })();

  // ─── Loading State ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-spin mb-4">⏳</div>
          <p className="text-gray-500 text-lg">Performance data load ho raha hai...</p>
        </div>
      </div>
    );
  }

  // ─── No Data State ─────────────────────────────────────────
  if (attempts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-10 max-w-md">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Abhi koi data nahi!
          </h2>
          <p className="text-gray-500 mb-6">
            Pehle kuch tests do — phir analysis yahan dikhegi 📊
          </p>
          <Button
            onClick={() => navigate('/test-setup')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            🚀 Pehla Test Do
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN UI
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ═══ NAVBAR ═════════════════════════════════════════ */}
      <nav className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="font-bold text-gray-800 text-lg">Performance Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </Button>
          <Button
            variant="outline" size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => { logout(); navigate('/login'); }}
          >
            Logout
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ═══ HEADER + SUMMARY ════════════════════════════ */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tumhari Performance 🎯
          </h1>
          <p className="text-gray-500 mt-1">
            {attempts.length} tests ka detailed analysis
            {isImproving !== null && (
              <span className={`ml-2 font-semibold ${isImproving ? 'text-green-600' : 'text-red-500'}`}>
                {isImproving ? '📈 Improving!' : '📉 Needs work'}
              </span>
            )}
          </p>
        </div>

        {/* ═══ SUMMARY STATS (4 cards) ═════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '📝', label: 'Total Tests',    value: attempts.length,    color: 'bg-indigo-50' },
            { icon: '📊', label: 'Average Score',  value: `${avgScore}%`,     color: 'bg-blue-50'   },
            { icon: '🏆', label: 'Best Score',     value: `${bestScore}%`,    color: 'bg-green-50'  },
            { icon: '📉', label: 'Lowest Score',   value: `${worstScore}%`,   color: 'bg-red-50'    },
          ].map((stat) => (
            <Card key={stat.label} className={`border-0 shadow-md ${stat.color}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-800 mt-1">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══ CHART 1: SCORE TREND (LineChart) ═══════════ */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">📈 Score Trend</CardTitle>
            <CardDescription>
              Har test mein tumhara score — improve ho raha hai? [web:219]
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={scoreTrendData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<ScoreTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8, stroke: COLORS.primary, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ═══ CHART 2 + 3: TOPIC + PIE (Side by Side) ════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ─── Topic-wise BarChart ───────────────────────── */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">📚 Topic-wise Accuracy</CardTitle>
              <CardDescription>
                Kaunse topic mein strong ho, kaunse mein weak?
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topicBarData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  Data nahi hai abhi
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={topicBarData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="topic"
                      tick={{ fontSize: 10, fill: '#6b7280' }}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<TopicTooltip />} />
                    <Bar
                      dataKey="accuracy"
                      fill={COLORS.secondary}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ─── Answer Breakdown PieChart ────────────────── */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">🥧 Answer Breakdown</CardTitle>
              <CardDescription>
                Overall — Correct, Wrong, Skipped ka ratio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-6">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [
  `${value ?? 0} questions`,
  name,
]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend manually banao */}
                <div className="space-y-3">
                  {pieData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i] }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{entry.name}</p>
                        <p className="text-xs text-gray-400">
                          {entry.value}Q ({entry.percent}%)
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400">Total: {totalQuestions}Q</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ CHART 4: RADAR (Topic Strengths) ══════════ */}
        {radarData.length >= 3 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">🕸️ Skill Radar</CardTitle>
              <CardDescription>
                Topics mein overall strength ka visual map
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <Radar
                    name="Accuracy"
                    dataKey="accuracy"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                 <Tooltip formatter={(v: any) => [`${v ?? 0}%`, 'Accuracy']} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ═══ RECENT ATTEMPTS TABLE ═══════════════════════ */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">📋 All Attempts History</CardTitle>
            <CardDescription>Tumhare sare tests ka record</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-600">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Test</th>
                    <th className="text-center p-3 font-semibold">Score</th>
                    <th className="text-center p-3 font-semibold">✅</th>
                    <th className="text-center p-3 font-semibold">❌</th>
                    <th className="text-center p-3 font-semibold">⏭️</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-center p-3 font-semibold">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[...attempts].reverse().map((attempt, idx) => (
                    <tr
                      key={attempt._id}
                      className="border-b hover:bg-indigo-50 transition-colors"
                    >
                      <td className="p-3 text-gray-400 font-mono">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-medium text-gray-800 truncate max-w-[180px]">
                          {attempt.title}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-black text-lg
                          ${attempt.score >= 80 ? 'text-green-600' :
                            attempt.score >= 60 ? 'text-blue-600'  :
                            attempt.score >= 40 ? 'text-yellow-600': 'text-red-500'}`}>
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="p-3 text-center text-green-600 font-semibold">
                        {attempt.correctCount}
                      </td>
                      <td className="p-3 text-center text-red-500 font-semibold">
                        {attempt.incorrectCount}
                      </td>
                      <td className="p-3 text-center text-gray-400 font-semibold">
                        {attempt.skippedCount}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(attempt.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: '2-digit'
                        })}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={
                          attempt.score >= 80 ? 'bg-green-100 text-green-700'  :
                          attempt.score >= 60 ? 'bg-blue-100 text-blue-700'    :
                          attempt.score >= 40 ? 'bg-yellow-100 text-yellow-700':
                          'bg-red-100 text-red-700'
                        }>
                          {attempt.score >= 80 ? '🌟 Excellent' :
                           attempt.score >= 60 ? '👍 Good'      :
                           attempt.score >= 40 ? '📈 Average'   : '💪 Practice'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ═══ ACTION BUTTONS ══════════════════════════════ */}
        <div className="flex gap-3 pb-8">
          <Button
            onClick={() => navigate('/test-setup')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex-1"
          >
            🚀 Naya Test Do
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex-1"
          >
            🏠 Dashboard
          </Button>
        </div>

      </main>
    </div>
  );
};

export default AnalysisPage;