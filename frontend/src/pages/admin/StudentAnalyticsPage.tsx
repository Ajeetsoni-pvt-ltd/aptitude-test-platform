// frontend/src/pages/admin/StudentAnalyticsPage.tsx
// Admin view: Detailed per-student analytics, topic mastery, violations

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import apiClient from '@/api/axios';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  ArrowLeft, Trophy, Target, Clock, AlertTriangle,
  CheckCircle2, XCircle, BarChart2, User, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StudentAnalytics {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  stats: {
    totalAttempts: number;
    avgScore: number;
    bestScore: number;
    totalTime: number;
    totalViolations: number;
  };
  topicPerformance: { topic: string; correct: number; total: number; accuracy: number }[];
  scoreTrend: { date: string; score: number; title?: string }[];
  recentAttempts: {
    _id: string;
    title: string;
    score: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    totalTime: number;
    createdAt: string;
  }[];
}

const SCORE_COLOR = (s: number) =>
  s >= 70 ? '#00FF88' : s >= 40 ? '#FFB700' : '#FF3366';

const fmtTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const StudentAnalyticsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();
  const [data,      setData]      = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/admin/students/${userId}/analytics`);
        if (res.data.success) setData(res.data.data);
        else setError('Failed to load analytics.');
      } catch {
        setError('Could not fetch student data.');
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetch();
  }, [userId]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-neon-red font-inter">{error || 'No data.'}</p>
          <button onClick={() => navigate('/admin/users')} className="mt-4 text-neon-cyan text-sm font-inter hover:underline">
            ← Back to Users
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { user, stats, topicPerformance, scoreTrend, recentAttempts } = data;

  const radarData = topicPerformance.slice(0, 5).map((t) => ({
    subject: t.topic.replace(' Aptitude', '').replace(' Ability', '').slice(0, 8),
    value:   t.accuracy,
  }));

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* ── Back ──────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm font-inter mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Students
        </button>

        {/* ── Profile Header ────────────────────────────────── */}
        <div className="admin-panel p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-neon-violet/20 border border-neon-violet/30 flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-neon-violet" />
          </div>
          <div className="flex-1">
            <h1 className="font-orbitron text-xl font-bold text-white">{user.name}</h1>
            <p className="text-white/40 text-sm font-inter flex items-center gap-2 mt-1">
              <Mail size={13} /> {user.email}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-neon-cyan/30 text-neon-cyan bg-neon-cyan/5 font-inter uppercase">
                {user.role}
              </span>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border font-inter uppercase',
                user.isActive
                  ? 'border-neon-green/30 text-neon-green bg-neon-green/5'
                  : 'border-neon-red/30 text-neon-red bg-neon-red/5'
              )}>
                {user.isActive ? '● Active' : '● Deactivated'}
              </span>
              <span className="text-white/20 text-[10px] font-inter">
                Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* ── KPI Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Tests',        value: stats.totalAttempts,           color: 'cyan',   icon: <BarChart2 size={16} className="text-neon-cyan" /> },
            { label: 'Avg Score',    value: `${stats.avgScore}%`,          color: 'violet', icon: <Target size={16} className="text-neon-violet" /> },
            { label: 'Best Score',   value: `${stats.bestScore}%`,         color: 'green',  icon: <Trophy size={16} className="text-neon-green" /> },
            { label: 'Total Time',   value: fmtTime(stats.totalTime),      color: 'amber',  icon: <Clock size={16} className="text-neon-amber" /> },
            { label: 'Violations',   value: stats.totalViolations,         color: stats.totalViolations > 0 ? 'red' : 'green',
              icon: stats.totalViolations > 0 ? <AlertTriangle size={16} className="text-neon-red" /> : <CheckCircle2 size={16} className="text-neon-green" /> },
          ].map((k) => (
            <div key={k.label} className={cn('neon-card p-4 flex flex-col gap-2 text-center')}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto', `bg-neon-${k.color}/10 border border-neon-${k.color}/20`)}>
                {k.icon}
              </div>
              <p className={cn('font-orbitron font-bold text-lg', `text-neon-${k.color}`)}>{k.value}</p>
              <p className="text-white/30 text-[10px] font-inter uppercase tracking-wider">{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Score Trend + Radar ────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 admin-panel p-5">
            <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-neon-cyan" /> Score Trajectory
            </h2>
            {scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="studGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: 8 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    itemStyle={{ color: '#00F5FF' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#00F5FF" fill="url(#studGrad)" strokeWidth={2} name="Score" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/20 text-sm font-inter text-center py-8">No test history yet.</p>
            )}
          </div>

          <div className="admin-panel p-5">
            <h2 className="font-inter font-semibold text-white mb-4">Skills Radar</h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <Radar name="Accuracy" dataKey="value" stroke="#9D00FF" fill="#9D00FF" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/20 text-xs font-inter text-center py-8">No topic data.</p>
            )}
          </div>
        </div>

        {/* ── Topic Mastery ─────────────────────────────────── */}
        {topicPerformance.length > 0 && (
          <div className="admin-panel p-5 mb-6">
            <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={16} className="text-neon-violet" /> Topic Mastery
            </h2>
            <div className="space-y-4">
              {topicPerformance.map((t) => (
                <div key={t.topic}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-white/70 text-sm font-inter">{t.topic}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/20 text-xs font-mono-code">{t.correct}/{t.total}</span>
                      <span className="font-orbitron text-sm font-bold" style={{ color: SCORE_COLOR(t.accuracy) }}>{t.accuracy}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${t.accuracy}%`, background: SCORE_COLOR(t.accuracy), boxShadow: `0 0 8px ${SCORE_COLOR(t.accuracy)}` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Attempts ───────────────────────────────── */}
        {recentAttempts.length > 0 && (
          <div className="admin-panel p-5">
            <h2 className="font-inter font-semibold text-white mb-4">Recent Test Attempts</h2>
            <div className="space-y-2">
              {recentAttempts.map((a) => (
                <div key={a._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-11 h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: SCORE_COLOR(a.score) }}>
                    <span className="font-orbitron text-xs font-bold" style={{ color: SCORE_COLOR(a.score) }}>{a.score}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-inter font-medium truncate">{a.title || 'Practice Test'}</p>
                    <p className="text-white/30 text-xs font-inter">
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {a.totalTime && ` • ${fmtTime(a.totalTime)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-inter">
                    <span className="flex items-center gap-1 text-neon-green"><CheckCircle2 size={12} />{a.correctCount}</span>
                    <span className="flex items-center gap-1 text-neon-red"><XCircle size={12} />{a.incorrectCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default StudentAnalyticsPage;
