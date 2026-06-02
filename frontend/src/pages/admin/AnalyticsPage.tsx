// frontend/src/pages/admin/AnalyticsPage.tsx
// Full platform analytics — score trends, topic performance, top students

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminMetricCard,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import { getAdminAnalyticsApi } from '@/api/adminApi';
import { useChartColors } from '@/hooks/useChartColors';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  TrendingUp, Users, BookOpen, Target, Trophy,
  BarChart3, Activity, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────
interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalAttempts: number;
    totalQuestions: number;
    avgScore: number;
    last7DaysAttempts: number;
    growthRate: number;
  };
  scoreDistribution: { range: string; count: number }[];
  dailyActivity: { date: string; label: string; attempts: number; avgScore: number }[];
  topicPerformance: { topic: string; totalCorrect: number; totalQuestions: number; accuracy: number }[];
  topStudents: { name: string; email: string; avgScore: number; tests: number; bestScore: number }[];
  difficultyPerformance: { difficulty: string; accuracy: number; total: number }[];
}

// ── Tooltip ───────────────────────────────────────────────────
const ChartTooltip = ({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(8,12,24,0.95)] px-3 py-2 shadow-xl backdrop-blur-xl">
      <p className="text-[11px] uppercase tracking-widest text-white/35 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-orbitron text-sm" style={{ color: p.color || '#00F5FF' }}>
          {p.name ? `${p.name}: ` : ''}{p.value}{p.name === 'avgScore' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#00FF88',
  medium: '#FFB700',
  hard: '#FF3366',
};

const TOPIC_COLORS = ['#00F5FF', '#9D00FF', '#FF00AA', '#00FF88', '#FFB700', '#FF3366'];

const SCORE_RANGE_COLORS = ['#FF3366', '#FF6B35', '#FFB700', '#00F5FF', '#00FF88'];

// ── Main Component ────────────────────────────────────────────
const AnalyticsPage = () => {
  const navigate = useNavigate();
  const chartColors = useChartColors();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminAnalyticsApi()
      .then((res) => {
        if (res.success && res.data) setData(res.data);
        else setError(res.message || 'Failed to load analytics.');
      })
      .catch(() => setError('Could not fetch analytics data.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center flex-col gap-4">
          <div className="h-14 w-14 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin shadow-[0_0_30px_rgba(0,245,255,0.2)]" />
          <p className="font-orbitron text-xs uppercase tracking-widest text-neon-cyan/70">
            Crunching platform data...
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-neon-red font-inter">{error || 'No data available.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-neon-cyan text-sm font-inter hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { overview, scoreDistribution, dailyActivity, topicPerformance, topStudents, difficultyPerformance } = data;

  const GrowthIcon = overview.growthRate > 0
    ? ArrowUpRight
    : overview.growthRate < 0
      ? ArrowDownRight
      : Minus;

  const growthColor = overview.growthRate > 0
    ? 'text-neon-green'
    : overview.growthRate < 0
      ? 'text-neon-red'
      : 'text-white/40';

  // Radar data for topic performance
  const radarData = topicPerformance.slice(0, 6).map((t) => ({
    subject: t.topic.replace(' Aptitude', '').replace(' Ability', '').replace(' Reasoning', ''),
    accuracy: t.accuracy,
  }));

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          eyebrow="Platform Intelligence"
          title={<>Analytics <span className="gradient-text-cyan-violet">Command</span></>}
          description="Deep insights into student performance, topic mastery, score distributions, and platform growth — all in one view."
        />

        {/* ── KPI Overview ──────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Total Students"
            value={overview.totalStudents}
            icon={<Users className="h-5 w-5" />}
            tone="cyan"
            caption="Registered learners"
          />
          <AdminMetricCard
            label="Total Tests"
            value={overview.totalAttempts}
            icon={<BookOpen className="h-5 w-5" />}
            tone="violet"
            caption="All-time attempts"
            trend={
              <span className={cn('flex items-center gap-1', growthColor)}>
                <GrowthIcon size={12} />
                {Math.abs(overview.growthRate)}% vs last week
              </span>
            }
          />
          <AdminMetricCard
            label="Platform Avg Score"
            value={`${overview.avgScore}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            tone="green"
            caption="Across all attempts"
          />
          <AdminMetricCard
            label="Last 7 Days"
            value={overview.last7DaysAttempts}
            icon={<Activity className="h-5 w-5" />}
            tone="amber"
            caption="Recent test activity"
          />
        </div>

        {/* ── Daily Activity Chart ───────────────────────────── */}
        <AdminPanel
          tone="cyan"
          eyebrow="30-Day Trend"
          title="Daily Test Activity"
          description="Number of test attempts and average score per day over the last 30 days."
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attemptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#9D00FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#9D00FF" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: chartColors.tickFill, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: chartColors.tickFillDim, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: chartColors.tickFillDim, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="attempts"
                  name="Attempts"
                  stroke="#00F5FF"
                  strokeWidth={2.5}
                  fill="url(#attemptsGrad)"
                  dot={false}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  name="avgScore"
                  stroke="#9D00FF"
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-6 text-xs font-inter text-white/40">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-neon-cyan inline-block" />Attempts (left axis)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-neon-violet inline-block" />Avg Score % (right axis)</span>
          </div>
        </AdminPanel>

        {/* ── Score Distribution + Difficulty ───────────────── */}
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel
            tone="violet"
            eyebrow="Score Spread"
            title="Score Distribution"
            description="How students are scoring across all test attempts."
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="range"
                    tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartColors.tickFillDim, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Students" radius={[12, 12, 4, 4]}>
                    {scoreDistribution.map((_, i) => (
                      <Cell key={i} fill={SCORE_RANGE_COLORS[i] || '#00F5FF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>

          <AdminPanel
            tone="amber"
            eyebrow="Difficulty Analysis"
            title="Accuracy by Difficulty"
            description="How accurately students answer easy, medium, and hard questions."
          >
            <div className="space-y-5 pt-2">
              {difficultyPerformance.length > 0 ? difficultyPerformance.map((d) => (
                <div key={d.difficulty} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: DIFFICULTY_COLORS[d.difficulty] || '#00F5FF', boxShadow: `0 0 8px ${DIFFICULTY_COLORS[d.difficulty] || '#00F5FF'}` }}
                      />
                      <span className="text-white/70 text-sm font-inter capitalize">{d.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/25 text-xs font-mono-code">{d.total} answers</span>
                      <span
                        className="font-orbitron text-sm font-bold"
                        style={{ color: DIFFICULTY_COLORS[d.difficulty] || '#00F5FF' }}
                      >
                        {d.accuracy}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${d.accuracy}%`,
                        background: DIFFICULTY_COLORS[d.difficulty] || '#00F5FF',
                        boxShadow: `0 0 10px ${DIFFICULTY_COLORS[d.difficulty] || '#00F5FF'}`,
                      }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-white/25 text-sm font-inter text-center py-8">
                  No difficulty data yet. Students need to complete tests first.
                </p>
              )}
            </div>
          </AdminPanel>
        </div>

        {/* ── Topic Performance + Radar ──────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <AdminPanel
            tone="magenta"
            eyebrow="Topic Intelligence"
            title="Topic-wise Accuracy"
            description="Platform-wide accuracy per topic based on all student answers."
          >
            {topicPerformance.length > 0 ? (
              <div className="space-y-4">
                {topicPerformance.map((t, i) => (
                  <div key={t.topic} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm font-inter">{t.topic}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/25 text-xs font-mono-code">
                          {t.totalCorrect}/{t.totalQuestions}
                        </span>
                        <span
                          className="font-orbitron text-sm font-bold"
                          style={{ color: TOPIC_COLORS[i % TOPIC_COLORS.length] }}
                        >
                          {t.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${t.accuracy}%`,
                          background: TOPIC_COLORS[i % TOPIC_COLORS.length],
                          boxShadow: `0 0 8px ${TOPIC_COLORS[i % TOPIC_COLORS.length]}`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/25 text-sm font-inter text-center py-8">
                No topic data yet.
              </p>
            )}
          </AdminPanel>

          <AdminPanel
            tone="violet"
            eyebrow="Skills Radar"
            title="Topic Radar"
            description="Visual accuracy spread across all topics."
          >
            {radarData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={chartColors.gridStroke} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: chartColors.tickFill, fontSize: 10 }}
                    />
                    <Radar
                      name="Accuracy"
                      dataKey="accuracy"
                      stroke="#9D00FF"
                      fill="#9D00FF"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-white/25 text-sm font-inter text-center py-8">
                No radar data yet.
              </p>
            )}
          </AdminPanel>
        </div>

        {/* ── Top Students Leaderboard ───────────────────────── */}
        <AdminPanel
          tone="green"
          eyebrow="Top Performers"
          title="Student Leaderboard"
          description="Top 10 students ranked by average score across all test attempts."
          actions={
            <button
              onClick={() => navigate('/admin/users')}
              className="text-xs text-neon-cyan font-inter hover:underline flex items-center gap-1"
            >
              View All Students <ArrowUpRight size={12} />
            </button>
          }
        >
          {topStudents.length > 0 ? (
            <div className="space-y-2">
              {topStudents.map((student, i) => {
                const rankColor = i === 0 ? '#FFB700' : i === 1 ? '#00F5FF' : i === 2 ? '#9D00FF' : undefined;
                const rankIcon  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                return (
                  <div
                    key={student.email}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all"
                  >
                    {/* Rank */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-orbitron text-sm font-bold flex-shrink-0"
                      style={rankColor ? { background: `${rankColor}18`, color: rankColor, border: `1px solid ${rankColor}30` } : { background: chartColors.gridStroke, color: chartColors.tickFill, border: `1px solid ${chartColors.gridStroke}` }}
                    >
                      {rankIcon ?? i + 1}
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-inter font-medium truncate">{student.name}</p>
                      <p className="text-white/25 text-xs font-mono-code truncate">{student.email}</p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4 text-xs font-inter text-white/35">
                      <span>{student.tests} tests</span>
                      <span>Best: <span className="text-neon-green">{student.bestScore}%</span></span>
                    </div>

                    {/* Avg Score */}
                    <div
                      className="font-orbitron text-lg font-bold flex-shrink-0"
                      style={{ color: rankColor || chartColors.tickFill }}
                    >
                      {student.avgScore}%
                    </div>

                    {/* View analytics */}
                    <button
                      onClick={() => navigate(`/admin/students/${student.email}/analytics`)}
                      className="text-white/20 hover:text-neon-cyan transition-colors flex-shrink-0"
                      title="View student analytics"
                    >
                      <BarChart3 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy size={32} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/25 text-sm font-inter">
                No test attempts yet. Leaderboard will populate once students complete tests.
              </p>
            </div>
          )}
        </AdminPanel>

        {/* ── Summary Cards ─────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Questions per Student',
              value: overview.totalStudents > 0
                ? Math.round(overview.totalAttempts / overview.totalStudents)
                : 0,
              desc: 'Average tests per registered student',
              tone: 'cyan' as const,
              icon: <Target size={16} />,
            },
            {
              label: 'Pass Rate (≥60%)',
              value: `${overview.avgScore >= 60 ? '✓' : '~'} ${overview.avgScore}%`,
              desc: 'Platform average vs 60% pass threshold',
              tone: 'green' as const,
              icon: <TrendingUp size={16} />,
            },
            {
              label: 'Weekly Growth',
              value: `${overview.growthRate > 0 ? '+' : ''}${overview.growthRate}%`,
              desc: 'Test attempts vs previous 7 days',
              tone: overview.growthRate >= 0 ? 'amber' as const : 'violet' as const,
              icon: <Activity size={16} />,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="admin-panel px-5 py-5 flex items-start gap-4"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', `bg-neon-${card.tone}/10 text-neon-${card.tone} border border-neon-${card.tone}/20`)}>
                {card.icon}
              </div>
              <div>
                <p className="text-white/30 text-[11px] uppercase tracking-widest font-inter">{card.label}</p>
                <p className={cn('font-orbitron text-2xl font-bold mt-1', `text-neon-${card.tone}`)}>{card.value}</p>
                <p className="text-white/35 text-xs font-inter mt-1">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </AdminPage>
    </AdminLayout>
  );
};

export default AnalyticsPage;
